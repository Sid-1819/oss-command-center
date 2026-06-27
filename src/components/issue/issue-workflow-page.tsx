'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { refreshActionRunStatus } from '@/actions/action-run';
import { executeIssueFixAction } from '@/actions/issue-fix/executeIssueFixAction';
import { planIssueFixAction } from '@/actions/issue-fix/planIssueFixAction';
import type { IssueFixExecutionPlan } from '@/actions/issue-fix/types';
import { ExecutionWorkflow } from '@/components/workflow/execution-workflow';
import type { ExecuteWorkflowResult } from '@/components/workflow/execution-workflow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  findActionRunForRepository,
  loadActionRunCompletion,
  saveActionRun,
} from '@/lib/action-run/storage';
import {
  buildIssuePlanReview,
  loadIssuePlanReview,
  saveIssuePlanReview,
} from '@/lib/actions/plan-review-storage';
import { toExecutionResult } from '@/lib/actions/to-execution-result';
import { toIssueMaintenanceAction } from '@/lib/actions/to-maintenance-action';
import { getEffectiveAiConfig } from '@/lib/ai/client-settings';
import type { ActionRun, ActionRunCompletion } from '@/types/action-run';
import type { ExecutionResult, MaintenanceAction } from '@/types/execution-workflow';
import {
  ISSUE_PLAN_CONTEXT_KEY,
  type IssuePlanContext,
  type IssueFixPlanReview,
} from '@/types/doc-plan-review';

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restoredActionRun, setRestoredActionRun] = useState<ActionRun | null>(null);
  const [restoredCompletion, setRestoredCompletion] = useState<ActionRunCompletion | null>(null);
  const [restoredExecutionResult, setRestoredExecutionResult] =
    useState<ExecutionResult | null>(null);

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
    let cancelled = false;

    async function load() {
      setIsPlanning(true);
      setErrorMessage(null);
      setAction(null);
      setPlanReview(null);

      if (!repo || !Number.isFinite(issueNumber)) {
        setErrorMessage('Missing repository or issue number.');
        setIsPlanning(false);
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
        setIsPlanning(false);
        return;
      }

      const context = readIssueContext();
      if (!context || context.repositoryRef !== repo) {
        setErrorMessage('Analysis context expired. Start from the dashboard Auto-Fix section.');
        setIsPlanning(false);
        return;
      }

      const result = await planIssueFixAction({
        repositoryRef: context.repositoryRef,
        issueNumber,
        analysis: context.analysis,
        briefing: context.briefing,
        aiConfig: context.aiConfig ?? getEffectiveAiConfig(),
        demoMode: context.demoMode ?? demoMode,
      });

      if (cancelled) return;

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
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [repo, issueNumber]);

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
    const refreshed = await refreshActionRunStatus(actionRun);
    if (!refreshed.success) throw new Error(refreshed.error.message);
    saveActionRun(refreshed.actionRun, refreshed.completion);
    setRestoredActionRun(refreshed.actionRun);
    setRestoredCompletion(refreshed.completion ?? null);
    setRestoredExecutionResult(buildRestoredExecutionResult(refreshed.actionRun));
    return { actionRun: refreshed.actionRun, completion: refreshed.completion };
  }, []);

  const handleFixIssue = useCallback(
    (num: number) => {
      router.push(
        `/app/issue?repo=${encodeURIComponent(repo)}&issue=${encodeURIComponent(String(num))}`,
      );
    },
    [repo, router],
  );

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

        {isPlanning ? (
          <div className="glass-panel mt-8 flex flex-col items-center gap-3 p-12 text-center">
            <Spinner className="size-6" />
            <p className="text-sm text-muted-foreground">
              Generating fix plan… ({formatElapsed(elapsedSeconds)})
            </p>
          </div>
        ) : null}

        {!isPlanning && errorMessage ? (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle />
            <AlertTitle>Unable to plan fix</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {!isPlanning && action && planReview ? (
          <div className="mt-6">
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
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
