'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { getDashboardHref } from '@/lib/dashboard-href';
import { refreshActionRunStatus } from '@/actions/action-run';
import { executeIssueFixAction } from '@/actions/issue-fix/executeIssueFixAction';
import { finalizeIssueFixPlanAction } from '@/actions/issue-fix/finalizeIssueFixPlanAction';
import {
  prepareIssueFixPlanAction,
  type PrepareIssueFixPlanResult,
} from '@/actions/issue-fix/prepareIssueFixPlanAction';
import {
  issueFixExecutionPlanSchema,
  type IssueFixPlanPayload,
} from '@/actions/issue-fix/types';
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
import {
  isWorkflowStateError,
  workflowStateErrorMessage,
} from '@/lib/workflow-state/errors';
import {
  loadIssuePlanContext,
  saveIssuePlanContext,
} from '@/lib/workflow-state/context-storage';
import { syncDashboardSessionAfterMerge } from '@/lib/workflow-state/dashboard-session-storage';
import type { ActionRun, ActionRunCompletion } from '@/types/action-run';
import type { ExecutionResult, MaintenanceAction } from '@/types/execution-workflow';
import type { IssueFixPlanReview, IssuePlanContext } from '@/types/doc-plan-review';
import { useAiStream } from '@/hooks/use-ai-stream';

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

function workflowErrorMessage(error: unknown, fallback: string): string {
  if (isWorkflowStateError(error)) {
    return workflowStateErrorMessage(error);
  }

  return fallback;
}

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
  const prepareContextRef = useRef<Extract<PrepareIssueFixPlanResult, { success: true }> | null>(
    null,
  );
  const autoAnalyzeAttemptedRef = useRef(false);

  const { submit: submitPlan, object: streamingPlan } = useAiStream({
    api: '/api/ai/issue-fix-plan',
    schema: issueFixExecutionPlanSchema,
    onFinish: async ({ object, error }) => {
      const prepared = prepareContextRef.current;

      if (!prepared) {
        setIsPlanning(false);
        return;
      }

      if (!object || error) {
        setErrorMessage(error?.message ?? 'Failed to generate fix plan.');
        prepareContextRef.current = null;
        setIsPlanning(false);
        return;
      }

      try {
        const result = await finalizeIssueFixPlanAction({
          issueNumber: prepared.issueNumber,
          targetFile: prepared.targetFile,
          currentContent: prepared.currentContent,
          sourceSha: prepared.sourceSha,
          payload: object as IssueFixPlanPayload,
        });

        if (!result.success) {
          setErrorMessage(result.error.message);
          return;
        }

        const review = buildIssuePlanReview(repo, issueNumber, result);

        await saveIssuePlanReview(review);
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
      } catch (finalizeError) {
        setErrorMessage(
          workflowErrorMessage(finalizeError, 'Failed to save plan review.'),
        );
      } finally {
        prepareContextRef.current = null;
        setIsPlanning(false);
      }
    },
    onError: (streamError) => {
      setErrorMessage(streamError.message);
      prepareContextRef.current = null;
      setIsPlanning(false);
    },
  });

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

    let cancelled = false;

    async function restoreActionRun() {
      try {
        const run = await findActionRunForRepository(repo);
        if (cancelled) return;

        if (
          run &&
          TRACKABLE.includes(run.status) &&
          run.actionType === 'issue-fix' &&
          run.issueNumber === issueNumber
        ) {
          const completion = await loadActionRunCompletion(repo);
          if (cancelled) return;

          setRestoredActionRun(run);
          setRestoredCompletion(completion);
          setRestoredExecutionResult(buildRestoredExecutionResult(run));
        }
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(workflowErrorMessage(error, 'Failed to restore workflow state.'));
      }
    }

    void restoreActionRun();

    return () => {
      cancelled = true;
    };
  }, [repo, issueNumber]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      setIsInitializing(true);
      setErrorMessage(null);
      setAction(null);
      setPlanReview(null);
      setIssueContext(null);
      setRestoredActionRun(null);
      setRestoredCompletion(null);
      setRestoredExecutionResult(null);
      autoAnalyzeAttemptedRef.current = false;

      if (!repo || !Number.isFinite(issueNumber)) {
        setErrorMessage('Missing repository or issue number.');
        setIsInitializing(false);
        return;
      }

      try {
        const cachedReview = await loadIssuePlanReview(repo, issueNumber);
        if (cancelled) return;

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
          const context = await loadIssuePlanContext();
          if (cancelled) return;
          if (context) {
            setPreviousHealthScore(context.briefing.repositoryHealth.score);
          }
          setIsInitializing(false);
          return;
        }

        const context = await loadIssuePlanContext();
        if (cancelled) return;

        if (!context || context.repositoryRef !== repo) {
          setErrorMessage('Analysis context expired. Start from the dashboard Auto-Fix section.');
          setIsInitializing(false);
          return;
        }

        setIssueContext(context);
        setPreviousHealthScore(context.briefing.repositoryHealth.score);
        setIsInitializing(false);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(
          workflowErrorMessage(error, 'Failed to load workflow state from the database.'),
        );
        setIsInitializing(false);
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, [repo, issueNumber]);

  const handleStartAnalysis = useCallback(async () => {
    const context = issueContext ?? (await loadIssuePlanContext());
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

    try {
      const prepared = await prepareIssueFixPlanAction({
        repositoryRef: context.repositoryRef,
        issueNumber,
        analysis: context.analysis,
        briefing: context.briefing,
        aiConfig,
        demoMode: context.demoMode ?? demoMode,
      });

      if (!prepared.success) {
        setErrorMessage(prepared.error.message);
        setIsPlanning(false);
        return;
      }

      prepareContextRef.current = prepared;

      submitPlan({
        issueNumber: prepared.issueNumber,
        issueTitle: prepared.issueTitle,
        issueBody: prepared.issueBody,
        candidate: prepared.candidate,
        targetFile: prepared.targetFile,
        analysis: prepared.analysis,
        currentContent: prepared.currentContent,
        aiConfig: prepared.aiConfig,
        demoMode: prepared.demoMode,
      });
    } catch (error) {
      setErrorMessage(workflowErrorMessage(error, 'Failed to start plan generation.'));
      setIsPlanning(false);
    }
  }, [demoMode, issueContext, issueNumber, repo, submitPlan]);

  useEffect(() => {
    if (searchParams.get('analyze') !== '1') return;
    if (autoAnalyzeAttemptedRef.current) return;
    if (isInitializing || isPlanning || !issueContext || planReview || errorMessage) return;
    if (!canStartAnalysis) return;

    autoAnalyzeAttemptedRef.current = true;

    const params = new URLSearchParams(searchParams.toString());
    params.delete('analyze');
    const query = params.toString();
    router.replace(query ? `/app/issue?${query}` : '/app/issue');

    void handleStartAnalysis();
  }, [
    canStartAnalysis,
    errorMessage,
    handleStartAnalysis,
    isInitializing,
    isPlanning,
    issueContext,
    planReview,
    router,
    searchParams,
  ]);

  const handleReAnalyze = useCallback(() => {
    void (async () => {
      try {
        await clearIssuePlanReview();
        setPlanReview(null);
        setAction(null);
        setRestoredActionRun(null);
        setRestoredCompletion(null);
        setRestoredExecutionResult(null);
        setErrorMessage(null);
      } catch (error) {
        setErrorMessage(workflowErrorMessage(error, 'Failed to clear plan review.'));
      }
    })();
  }, []);

  const handleCreatePullRequest = useCallback(async (): Promise<ExecuteWorkflowResult> => {
    if (!planReview || !action) throw new Error('Plan not ready');

    const storedContext = await loadIssuePlanContext();

    const result = await executeIssueFixAction({
      repositoryRef: planReview.repositoryRef,
      plan: planReview.plan,
      demoMode: demoMode || storedContext?.demoMode,
    });

    if (!result.success) throw new Error(result.error.message);

    const executionResult = toExecutionResult(
      result.output as unknown as import('@/actions/markdown-doc/types').MarkdownDocExecutionOutput,
      result.report as unknown as import('@/actions/markdown-doc/types').MarkdownDocActionReport,
      action.preflightChecks,
    );

    if (result.actionRun) {
      await saveActionRun(result.actionRun);
      setRestoredActionRun(result.actionRun);
      setRestoredCompletion(null);
      setRestoredExecutionResult(executionResult);
    }

    return { result: executionResult, actionRun: result.actionRun };
  }, [action, demoMode, planReview]);

  const handleRefreshStatus = useCallback(async (actionRun: ActionRun) => {
    const context = await loadIssuePlanContext();

    const syncMergedAnalysis = async (completion: ActionRunCompletion) => {
      if (!completion.analysis || !completion.briefing) {
        return;
      }

      await syncDashboardSessionAfterMerge({
        repositoryRef: actionRun.repositoryRef,
        analysis: completion.analysis,
        briefing: completion.briefing,
        demoMode,
      });

      const storedContext = context ?? (await loadIssuePlanContext());
      if (storedContext && storedContext.repositoryRef === actionRun.repositoryRef) {
        await saveIssuePlanContext({
          ...storedContext,
          analysis: completion.analysis,
          briefing: completion.briefing,
          analyzedAt: new Date().toISOString(),
        });
        setIssueContext({
          ...storedContext,
          analysis: completion.analysis,
          briefing: completion.briefing,
          analyzedAt: new Date().toISOString(),
        });
      }
    };

    if (demoMode && context) {
      const completion = buildDemoRefreshCompletion({
        analysis: context.analysis,
        briefing: context.briefing,
      });
      const completedRun = buildDemoCompletedActionRun(actionRun);

      await saveActionRun(completedRun, completion);
      await syncMergedAnalysis(completion);
      setRestoredActionRun(completedRun);
      setRestoredCompletion(completion);
      setRestoredExecutionResult(buildRestoredExecutionResult(completedRun));

      return { actionRun: completedRun, completion };
    }

    const refreshed = await refreshActionRunStatus(actionRun);
    if (!refreshed.success) throw new Error(refreshed.error.message);
    await saveActionRun(refreshed.actionRun, refreshed.completion);
    if (refreshed.completion) {
      await syncMergedAnalysis(refreshed.completion);
    }
    setRestoredActionRun(refreshed.actionRun);
    setRestoredCompletion(refreshed.completion ?? null);
    setRestoredExecutionResult(buildRestoredExecutionResult(refreshed.actionRun));
    return { actionRun: refreshed.actionRun, completion: refreshed.completion };
  }, [demoMode]);

  const handleFixIssue = useCallback(
    (num: number) => {
      void (async () => {
        try {
          const context = issueContext ?? (await loadIssuePlanContext());
          if (!context || context.repositoryRef !== repo) {
            setErrorMessage(
              'Analysis context unavailable. Refresh after merge or analyze again.',
            );
            return;
          }

          await clearIssuePlanReview();
          await saveIssuePlanContext({ ...context, issueNumber: num });

          setRestoredActionRun(null);
          setRestoredCompletion(null);
          setRestoredExecutionResult(null);
          setPlanReview(null);
          setAction(null);
          setIssueContext({ ...context, issueNumber: num });
          setErrorMessage(null);

          router.push(
            `/app/issue?repo=${encodeURIComponent(repo)}&issue=${encodeURIComponent(String(num))}${demoMode ? '&demo=1' : ''}&analyze=1`,
          );
        } catch (error) {
          setErrorMessage(workflowErrorMessage(error, 'Failed to start next issue fix.'));
        }
      })();
    },
    [demoMode, issueContext, repo, router],
  );

  const showLanding =
    !isInitializing && !isPlanning && !planReview && issueContext && !errorMessage;
  const backToDashboardHref = getDashboardHref(repo, { demoMode });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-4 gap-2">
          <Link href={backToDashboardHref}>
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
            streamingSummary={
              typeof streamingPlan?.summary === 'string' ? streamingPlan.summary : undefined
            }
            streamingSteps={streamingPlan?.steps?.flatMap((step) =>
              step
                ? [
                    {
                      operation: step.operation,
                      section: step.section,
                      rationale: step.rationale,
                      content: step.content,
                    },
                  ]
                : [],
            )}
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
              backToDashboardHref={backToDashboardHref}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
