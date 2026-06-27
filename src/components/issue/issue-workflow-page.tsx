'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { refreshActionRunStatus } from '@/actions/action-run';
import { executeIssueFixAction } from '@/actions/issue-fix/executeIssueFixAction';
import { planIssueFixAction } from '@/actions/issue-fix/planIssueFixAction';
import { AiLoadingPanel } from '@/components/ai-loading-panel';
import { ExecutionWorkflow } from '@/components/workflow/execution-workflow';
import type { ExecuteWorkflowResult } from '@/components/workflow/execution-workflow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  findActionRunForRepository,
  loadActionRunCompletion,
  saveActionRun,
} from '@/lib/action-run/storage';
import {
  buildIssuePlanReview,
  clearIssuePlanReview,
  loadIssuePlanReview,
  saveIssuePlanReview,
} from '@/lib/actions/plan-review-storage';
import { toExecutionResult } from '@/lib/actions/to-execution-result';
import { toIssueMaintenanceAction } from '@/lib/actions/to-maintenance-action';
import { getEffectiveAiConfig, isAiConfigReady } from '@/lib/ai/client-settings';
import { normalizeBriefing } from '@/lib/maintainer-briefing-utils';
import {
  buildDemoCompletedActionRun,
  buildDemoRefreshCompletion,
} from '@/lib/demo/refresh-completion';
import type { ActionRun, ActionRunCompletion } from '@/types/action-run';
import type { ExecutionResult, MaintenanceAction } from '@/types/execution-workflow';
import {
  ISSUE_PLAN_CONTEXT_KEY,
  type IssuePlanContext,
  type IssueFixPlanReview,
} from '@/types/doc-plan-review';

function readIssueContext(): IssuePlanContext | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(ISSUE_PLAN_CONTEXT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as IssuePlanContext;
  } catch {
    return null;
  }
}

function buildRestoredExecutionResult(actionRun: ActionRun): ExecutionResult {
  return {
    status: 'success',
    summary:
      actionRun.status === 'COMPLETED'
        ? 'Pull request merged and issue closed.'
        : actionRun.status === 'CLOSED'
          ? 'Pull request was closed without merging.'
          : 'Fix PR created and awaiting review.',
    logs: [`Tracking PR #${actionRun.pullRequestNumber} for issue #${actionRun.issueNumber}`],
    changesApplied: 0,
    checksPassedCount: 0,
    checksFailedCount: 0,
    prUrl: actionRun.pullRequestUrl,
    pullRequestNumber: actionRun.pullRequestNumber,
    branchName: actionRun.branch,
    canRollback: false,
  };
}

const TRACKABLE: ActionRun['status'][] = ['AWAITING_REVIEW', 'COMPLETED', 'CLOSED'];

export default function IssueWorkflowPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repo = searchParams.get('repo')?.trim() ?? '';
  const issueNumber = Number.parseInt(searchParams.get('issue')?.trim() ?? '', 10);
  const demoMode = searchParams.get('demo') === '1';

  const [action, setAction] = useState<MaintenanceAction | null>(null);
  const [planReview, setPlanReview] = useState<IssueFixPlanReview | null>(null);
  const [issueContext, setIssueContext] = useState<IssuePlanContext | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPlanning, setIsPlanning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restoredActionRun, setRestoredActionRun] = useState<ActionRun | null>(null);
  const [restoredCompletion, setRestoredCompletion] = useState<ActionRunCompletion | null>(null);
  const [restoredExecutionResult, setRestoredExecutionResult] =
    useState<ExecutionResult | null>(null);
  const [previousHealthScore, setPreviousHealthScore] = useState<number | undefined>();

  const autoFixCandidate = useMemo(() => {
    if (!issueContext) return null;
    const normalized = normalizeBriefing(issueContext.briefing);
    return normalized.autoFixCandidates.find(
      (candidate) => candidate.issueNumber === issueNumber,
    );
  }, [issueContext, issueNumber]);

  const canStartAnalysis = useMemo(() => {
    if (!issueContext || issueContext.repositoryRef !== repo) return false;
    const config = issueContext.aiConfig ?? getEffectiveAiConfig();
    return demoMode || issueContext.demoMode || isAiConfigReady(config);
  }, [demoMode, issueContext, repo]);

  useEffect(() => {
    if (!isPlanning) return;
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [isPlanning]);

  useEffect(() => {
    if (!repo) return;
    const run = findActionRunForRepository(repo);
    if (
      run &&
      TRACKABLE.includes(run.status) &&
      run.actionType === 'issue-fix' &&
      run.issueNumber === issueNumber
    ) {
      setRestoredActionRun(run);
      setRestoredCompletion(loadActionRunCompletion());
      setRestoredExecutionResult(buildRestoredExecutionResult(run));
    }
  }, [repo, issueNumber]);

  useEffect(() => {
    setIsInitializing(true);
    setErrorMessage(null);
    setAction(null);
    setPlanReview(null);
    setIssueContext(null);

    if (!repo || !Number.isFinite(issueNumber)) {
      setErrorMessage('Missing repository or issue number.');
      setIsInitializing(false);
      return;
    }

    const cachedReview = loadIssuePlanReview(repo, issueNumber);
    if (cachedReview) {
      setPlanReview(cachedReview);
      setAction(
        toIssueMaintenanceAction(
          cachedReview.plan,
          cachedReview.preview,
          cachedReview.validation,
          repo,
          `Issue #${issueNumber}`,
        ),
      );
      const context = readIssueContext();
      if (context) {
        setPreviousHealthScore(context.briefing.repositoryHealth.score);
      }
      setIsInitializing(false);
      return;
    }

    const context = readIssueContext();
    if (!context || context.repositoryRef !== repo) {
      setErrorMessage('Analysis context expired. Start from the dashboard Auto-Fix section.');
      setIsInitializing(false);
      return;
    }

    setIssueContext(context);
    setPreviousHealthScore(context.briefing.repositoryHealth.score);
    setIsInitializing(false);
  }, [repo, issueNumber]);

  const handleStartAnalysis = useCallback(async () => {
    const context = issueContext ?? readIssueContext();
    if (!context || context.repositoryRef !== repo) {
      setErrorMessage('Analysis context expired. Start from the dashboard Auto-Fix section.');
      return;
    }

    const aiConfig = context.aiConfig ?? getEffectiveAiConfig();
    if (!demoMode && !context.demoMode && !isAiConfigReady(aiConfig)) {
      setErrorMessage('Configure an AI provider in settings before starting analysis.');
      return;
    }

    setIsPlanning(true);
    setElapsedSeconds(0);
    setErrorMessage(null);
    setAction(null);
    setPlanReview(null);

    const result = await planIssueFixAction({
      repositoryRef: context.repositoryRef,
      issueNumber,
      analysis: context.analysis,
      briefing: context.briefing,
      aiConfig,
      demoMode: context.demoMode ?? demoMode,
    });

    if (!result.success) {
      setErrorMessage(result.error.message);
      setIsPlanning(false);
      return;
    }

    const review = buildIssuePlanReview(repo, issueNumber, result);

    saveIssuePlanReview(review);
    setPlanReview(review);
    setAction(
      toIssueMaintenanceAction(
        result.plan,
        result.preview,
        result.validation,
        repo,
        `Issue #${issueNumber}`,
      ),
    );
    setIsPlanning(false);
  }, [demoMode, issueContext, issueNumber, repo]);

  const handleReAnalyze = useCallback(() => {
    clearIssuePlanReview();
    setPlanReview(null);
    setAction(null);
    setRestoredActionRun(null);
    setRestoredCompletion(null);
    setRestoredExecutionResult(null);
    setErrorMessage(null);
  }, []);

  const handleCreatePullRequest = useCallback(async (): Promise<ExecuteWorkflowResult> => {
    if (!planReview || !action) throw new Error('Plan not ready');

    const result = await executeIssueFixAction({
      repositoryRef: planReview.repositoryRef,
      plan: planReview.plan,
      demoMode: demoMode || readIssueContext()?.demoMode,
    });

    if (!result.success) throw new Error(result.error.message);

    const executionResult = toExecutionResult(
      result.output as unknown as import('@/actions/markdown-doc/types').MarkdownDocExecutionOutput,
      result.report as unknown as import('@/actions/markdown-doc/types').MarkdownDocActionReport,
      action.preflightChecks,
    );

    if (result.actionRun) {
      saveActionRun(result.actionRun);
      setRestoredActionRun(result.actionRun);
      setRestoredCompletion(null);
      setRestoredExecutionResult(executionResult);
    }

    return { result: executionResult, actionRun: result.actionRun };
  }, [action, demoMode, planReview]);

  const handleRefreshStatus = useCallback(async (actionRun: ActionRun) => {
    const context = readIssueContext();

    if (demoMode && context) {
      const completion = buildDemoRefreshCompletion({
        analysis: context.analysis,
        briefing: context.briefing,
      });
      const completedRun = buildDemoCompletedActionRun(actionRun);

      saveActionRun(completedRun, completion);
      setRestoredActionRun(completedRun);
      setRestoredCompletion(completion);
      setRestoredExecutionResult(buildRestoredExecutionResult(completedRun));

      return { actionRun: completedRun, completion };
    }

    const refreshed = await refreshActionRunStatus(actionRun);
    if (!refreshed.success) throw new Error(refreshed.error.message);
    saveActionRun(refreshed.actionRun, refreshed.completion);
    setRestoredActionRun(refreshed.actionRun);
    setRestoredCompletion(refreshed.completion ?? null);
    setRestoredExecutionResult(buildRestoredExecutionResult(refreshed.actionRun));
    return { actionRun: refreshed.actionRun, completion: refreshed.completion };
  }, [demoMode]);

  const handleFixIssue = useCallback(
    (num: number) => {
      router.push(
        `/app/issue?repo=${encodeURIComponent(repo)}&issue=${encodeURIComponent(String(num))}`,
      );
    },
    [repo, router],
  );

  const showLanding =
    !isInitializing && !isPlanning && !planReview && issueContext && !errorMessage;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4 gap-2">
          <Link href="/app">
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </Button>

        <h1 className="text-3xl font-bold">Fix issue #{issueNumber}</h1>
        {repo ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Repository:{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{repo}</code>
          </p>
        ) : null}

        {isInitializing ? (
          <AiLoadingPanel message="Loading workflow…" className="mt-8" />
        ) : null}

        {isPlanning ? (
          <AiLoadingPanel
            message="Generating fix plan…"
            elapsedSeconds={elapsedSeconds}
            className="mt-8"
          />
        ) : null}

        {!isInitializing && !isPlanning && errorMessage ? (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle />
            <AlertTitle>Unable to plan fix</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {showLanding ? (
          <div className="glass-panel mt-8 space-y-6 rounded-xl border border-white/10 p-6">
            {autoFixCandidate ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {autoFixCandidate.fixType}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {autoFixCandidate.reason}
                </p>
                {autoFixCandidate.suggestedFiles[0] ? (
                  <p className="text-xs text-muted-foreground">
                    Target:{' '}
                    <code className="rounded bg-muted px-1">
                      {autoFixCandidate.suggestedFiles[0]}
                    </code>
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Review the issue context, then start AI analysis to generate a fix plan and PR
                preview.
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="gap-2"
                disabled={!canStartAnalysis}
                onClick={() => void handleStartAnalysis()}
              >
                <Sparkles className="size-4" />
                Start AI analysis
              </Button>
              {!canStartAnalysis ? (
                <p className="self-center text-xs text-muted-foreground">
                  Configure an AI provider in dashboard settings first.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {!isPlanning && action && planReview ? (
          <div className="mt-6 space-y-4">
            {!restoredActionRun ? (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={handleReAnalyze}>
                  Re-analyze
                </Button>
              </div>
            ) : null}
            <ExecutionWorkflow
              action={action}
              mode="review"
              planReview={planReview as unknown as import('@/types/doc-plan-review').DocPlanReview}
              targetFile={planReview.plan.targetFile}
              onExecute={handleCreatePullRequest}
              initialActionRun={restoredActionRun}
              initialCompletion={restoredCompletion}
              initialExecutionResult={restoredExecutionResult}
              onRefreshStatus={handleRefreshStatus}
              onFixIssue={handleFixIssue}
              previousHealthScore={previousHealthScore}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
