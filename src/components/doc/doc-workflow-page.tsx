'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { refreshActionRunStatus } from '@/actions/action-run';
import { executeMarkdownDocAction } from '@/actions/markdown-doc/executeMarkdownDocAction';
import { finalizeMarkdownDocPlanAction } from '@/actions/markdown-doc/finalizeMarkdownDocPlanAction';
import {
  prepareMarkdownDocPlanAction,
  type PrepareMarkdownDocPlanResult,
} from '@/actions/markdown-doc/prepareMarkdownDocPlanAction';
import {
  markdownDocExecutionPlanSchema,
  type MarkdownDocExecutionPlan,
  type MarkdownDocPlanPayload,
} from '@/actions/markdown-doc/types';
import { AiLoadingPanel } from '@/components/ai-loading-panel';
import { ExecutionWorkflow } from '@/components/workflow/execution-workflow';
import type { ExecuteWorkflowResult } from '@/components/workflow/execution-workflow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  findActionRunForRepository,
  loadActionRunCompletion,
  saveActionRun,
} from '@/lib/action-run/storage';
import {
  buildDemoCompletedActionRun,
  buildDemoRefreshCompletion,
} from '@/lib/demo/refresh-completion';
import {
  buildDocPlanReview,
  clearPlanReview,
  loadPlanReview,
  savePlanReview,
} from '@/lib/actions/plan-review-storage';
import { toExecutionResult } from '@/lib/actions/to-execution-result';
import { toDocMaintenanceAction } from '@/lib/actions/to-maintenance-action';
import { getEffectiveAiConfig, isAiConfigReady } from '@/lib/ai/client-settings';
import {
  isWorkflowStateError,
  workflowStateErrorMessage,
} from '@/lib/workflow-state/errors';
import {
  loadDocPlanContext,
  saveDocPlanContext,
} from '@/lib/workflow-state/context-storage';
import type { ActionRun, ActionRunCompletion } from '@/types/action-run';
import type { ExecutionResult, MaintenanceAction } from '@/types/execution-workflow';
import type { DocPlanContext, DocPlanReview } from '@/types/doc-plan-review';
import { useAiStream } from '@/hooks/use-ai-stream';

function buildRestoredExecutionResult(actionRun: ActionRun): ExecutionResult {
  return {
    status: 'success',
    summary:
      actionRun.status === 'COMPLETED'
        ? 'Pull request merged successfully.'
        : actionRun.status === 'CLOSED'
          ? 'Pull request was closed without merging.'
          : 'Pull request created and awaiting review.',
    logs: [`Tracking PR #${actionRun.pullRequestNumber} on ${actionRun.repositoryRef}`],
    changesApplied: 0,
    checksPassedCount: 0,
    checksFailedCount: 0,
    prUrl: actionRun.pullRequestUrl,
    pullRequestNumber: actionRun.pullRequestNumber,
    branchName: actionRun.branch,
    canRollback: false,
  };
}

const TRACKABLE_STATUSES: ActionRun['status'][] = [
  'AWAITING_REVIEW',
  'COMPLETED',
  'CLOSED',
];

function workflowErrorMessage(error: unknown, fallback: string): string {
  if (isWorkflowStateError(error)) {
    return workflowStateErrorMessage(error);
  }

  return fallback;
}

interface DocWorkflowPageProps {
  defaultFile?: string;
}

export default function DocWorkflowPage({ defaultFile = 'README.md' }: DocWorkflowPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repo = searchParams.get('repo')?.trim() ?? '';
  const targetFile = searchParams.get('file')?.trim() || defaultFile;
  const suggestion = searchParams.get('suggestion')?.trim() ?? '';
  const demoMode = searchParams.get('demo') === '1';

  const [action, setAction] = useState<MaintenanceAction | null>(null);
  const [plan, setPlan] = useState<MarkdownDocExecutionPlan | null>(null);
  const [planReview, setPlanReview] = useState<DocPlanReview | null>(null);
  const [docContext, setDocContext] = useState<DocPlanContext | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPlanning, setIsPlanning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restoredActionRun, setRestoredActionRun] = useState<ActionRun | null>(null);
  const [restoredCompletion, setRestoredCompletion] = useState<ActionRunCompletion | null>(null);
  const [restoredExecutionResult, setRestoredExecutionResult] =
    useState<ExecutionResult | null>(null);
  const [previousHealthScore, setPreviousHealthScore] = useState<number | undefined>();
  const prepareContextRef = useRef<Extract<PrepareMarkdownDocPlanResult, { success: true }> | null>(
    null,
  );

  const { submit: submitPlan, object: streamingPlan } = useAiStream({
    api: '/api/ai/markdown-doc-plan',
    schema: markdownDocExecutionPlanSchema,
    onFinish: async ({ object, error }) => {
      const prepared = prepareContextRef.current;

      if (!prepared) {
        setIsPlanning(false);
        return;
      }

      if (!object || error) {
        setErrorMessage(error?.message ?? 'Failed to generate documentation plan.');
        prepareContextRef.current = null;
        setIsPlanning(false);
        return;
      }

      try {
        const result = await finalizeMarkdownDocPlanAction({
          targetFile: prepared.targetFile,
          currentContent: prepared.currentContent,
          sourceSha: prepared.sourceSha,
          payload: object as MarkdownDocPlanPayload,
        });

        if (!result.success) {
          setErrorMessage(result.error.message);
          return;
        }

        const review = buildDocPlanReview(
          prepared.repositoryRef,
          prepared.targetFile,
          prepared.suggestion,
          result,
        );

        await savePlanReview(review);
        setPlan(review.plan);
        setPlanReview(review);
        setAction(
          toDocMaintenanceAction(
            review.plan,
            review.preview,
            review.validation,
            review.repositoryRef,
            review.suggestion,
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

  const canStartAnalysis = useMemo(() => {
    if (!docContext || docContext.repositoryRef !== repo || docContext.targetFile !== targetFile) {
      return false;
    }
    const config = docContext.aiConfig ?? getEffectiveAiConfig();
    return demoMode || docContext.demoMode || isAiConfigReady(config);
  }, [demoMode, docContext, repo, targetFile]);

  useEffect(() => {
    if (!isPlanning) return;
    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [isPlanning]);

  useEffect(() => {
    if (!repo) return;

    let cancelled = false;

    async function restoreActionRun() {
      try {
        const existingRun = await findActionRunForRepository(repo);
        if (cancelled) return;

        if (
          existingRun &&
          TRACKABLE_STATUSES.includes(existingRun.status) &&
          (existingRun.actionType === 'markdown-doc' ||
            existingRun.actionType === 'readme') &&
          (!existingRun.targetFile || existingRun.targetFile === targetFile)
        ) {
          const completion = await loadActionRunCompletion(repo);
          if (cancelled) return;

          setRestoredActionRun(existingRun);
          setRestoredCompletion(completion);
          setRestoredExecutionResult(buildRestoredExecutionResult(existingRun));
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
  }, [repo, targetFile]);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      setIsInitializing(true);
      setErrorMessage(null);
      setAction(null);
      setPlan(null);
      setPlanReview(null);
      setDocContext(null);

      if (!repo || !suggestion) {
        setErrorMessage(
          'Missing repository or suggestion. Start from the dashboard Maintenance Queue.',
        );
        setIsInitializing(false);
        return;
      }

      try {
        const cachedReview = await loadPlanReview(repo, targetFile, suggestion);
        if (cancelled) return;

        if (cachedReview) {
          setPlan(cachedReview.plan);
          setPlanReview(cachedReview);
          setAction(
            toDocMaintenanceAction(
              cachedReview.plan,
              cachedReview.preview,
              cachedReview.validation,
              cachedReview.repositoryRef,
              cachedReview.suggestion,
            ),
          );
          const context = await loadDocPlanContext();
          if (cancelled) return;
          if (context) {
            setPreviousHealthScore(context.briefing.repositoryHealth.score);
          }
          setIsInitializing(false);
          return;
        }

        const context = await loadDocPlanContext();
        if (cancelled) return;

        if (!context) {
          setErrorMessage(
            'Analysis context expired. Go back to the dashboard, analyze again, then start a doc update.',
          );
          setIsInitializing(false);
          return;
        }

        if (context.repositoryRef !== repo || context.targetFile !== targetFile) {
          setErrorMessage('Repository or file mismatch. Start again from the dashboard.');
          setIsInitializing(false);
          return;
        }

        if (context.suggestion !== suggestion) {
          setErrorMessage('Suggestion mismatch. Start again from the dashboard.');
          setIsInitializing(false);
          return;
        }

        setDocContext(context);
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
  }, [repo, targetFile, suggestion]);

  const handleStartAnalysis = useCallback(async () => {
    const context = docContext ?? (await loadDocPlanContext());
    if (!context || context.repositoryRef !== repo || context.targetFile !== targetFile) {
      setErrorMessage('Analysis context expired. Start again from the dashboard.');
      return;
    }

    if (context.suggestion !== suggestion) {
      setErrorMessage('Suggestion mismatch. Start again from the dashboard.');
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
    setPlan(null);
    setPlanReview(null);

    try {
      const prepared = await prepareMarkdownDocPlanAction({
        repositoryRef: context.repositoryRef,
        targetFile: context.targetFile,
        suggestion: context.suggestion,
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
        targetFile: prepared.targetFile,
        analysis: prepared.analysis,
        briefing: context.briefing,
        suggestion: prepared.suggestion,
        currentContent: prepared.currentContent,
        aiConfig: prepared.aiConfig,
        demoMode: prepared.demoMode,
      });
    } catch (error) {
      setErrorMessage(workflowErrorMessage(error, 'Failed to start plan generation.'));
      setIsPlanning(false);
    }
  }, [demoMode, docContext, repo, submitPlan, suggestion, targetFile]);

  const handleReAnalyze = useCallback(() => {
    void (async () => {
      try {
        await clearPlanReview();
        setPlan(null);
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
    if (!planReview || !action) throw new Error('Plan review is not available.');

    setErrorMessage(null);

    const storedContext = await loadDocPlanContext();

    const result = await executeMarkdownDocAction({
      repositoryRef: planReview.repositoryRef,
      plan: planReview.plan,
      demoMode: demoMode || storedContext?.demoMode,
    });

    if (!result.success) {
      if (result.error.code === 'README_CHANGED' || result.error.code === 'FILE_CHANGED') {
        await clearPlanReview();
        setErrorMessage(
          `${targetFile} changed since this plan was created. Analyze again and start a fresh update.`,
        );
      }
      throw new Error(result.error.message);
    }

    const executionResult = toExecutionResult(
      result.output,
      result.report,
      action.preflightChecks,
    );

    if (result.actionRun) {
      await saveActionRun(result.actionRun);
      setRestoredActionRun(result.actionRun);
      setRestoredCompletion(null);
      setRestoredExecutionResult(executionResult);
    }

    return { result: executionResult, actionRun: result.actionRun };
  }, [action, demoMode, planReview, targetFile]);

  const handleRefreshStatus = useCallback(
    async (actionRun: ActionRun) => {
      const context = await loadDocPlanContext();

      if (demoMode && context) {
        const completion = buildDemoRefreshCompletion({
          analysis: context.analysis,
          briefing: context.briefing,
        });
        const completedRun = buildDemoCompletedActionRun(actionRun);

        await saveActionRun(completedRun, completion);
        setRestoredActionRun(completedRun);
        setRestoredCompletion(completion);
        setRestoredExecutionResult(buildRestoredExecutionResult(completedRun));

        return { actionRun: completedRun, completion };
      }

      const refreshed = await refreshActionRunStatus(actionRun);
      if (!refreshed.success) throw new Error(refreshed.error.message);

      await saveActionRun(refreshed.actionRun, refreshed.completion);

      if (refreshed.completion?.analysis && refreshed.completion.briefing) {
        const docSuggestion = refreshed.completion.nextActions.find(
          (item) =>
            item.executable &&
            item.actionType === 'markdown-doc' &&
            item.payload?.targetFile === targetFile,
        );

        const nextContext: DocPlanContext = {
          repositoryRef: actionRun.repositoryRef,
          targetFile,
          suggestion:
            docSuggestion?.payload?.suggestion ?? planReview?.suggestion ?? suggestion,
          analysis: refreshed.completion.analysis,
          briefing: refreshed.completion.briefing,
          analyzedAt: new Date().toISOString(),
        };

        await saveDocPlanContext(nextContext);
      }

      setRestoredActionRun(refreshed.actionRun);
      setRestoredCompletion(refreshed.completion ?? null);
      setRestoredExecutionResult(buildRestoredExecutionResult(refreshed.actionRun));

      return {
        actionRun: refreshed.actionRun,
        completion: refreshed.completion,
      };
    },
    [demoMode, planReview?.suggestion, suggestion, targetFile],
  );

  const handleExecuteDocSuggestion = useCallback(
    (nextFile: string, nextSuggestion: string) => {
      void (async () => {
        try {
          const context = await loadDocPlanContext();
          if (!context || context.repositoryRef !== repo) {
            setErrorMessage(
              'Analysis context unavailable. Refresh after merge or analyze again.',
            );
            return;
          }

          await clearPlanReview();
          const nextContext: DocPlanContext = {
            ...context,
            targetFile: nextFile,
            suggestion: nextSuggestion,
          };
          await saveDocPlanContext(nextContext);

          router.push(
            `/app/doc?repo=${encodeURIComponent(repo)}&file=${encodeURIComponent(nextFile)}&suggestion=${encodeURIComponent(nextSuggestion)}${demoMode ? '&demo=1' : ''}`,
          );
        } catch (error) {
          setErrorMessage(workflowErrorMessage(error, 'Failed to start next doc update.'));
        }
      })();
    },
    [demoMode, repo, router],
  );

  const showLanding =
    !isInitializing && !isPlanning && !planReview && docContext && !errorMessage;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="mb-4 gap-2">
            <Link href="/app">
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>
          </Button>

          <h1 className="text-3xl font-bold">Update {targetFile}</h1>
          {repo ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Repository:{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{repo}</code>
            </p>
          ) : null}
          {suggestion ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{suggestion}</p>
          ) : null}
        </div>

        {isInitializing ? (
          <AiLoadingPanel message="Loading workflow…" />
        ) : null}

        {isPlanning ? (
          <AiLoadingPanel
            message="Generating update plan…"
            elapsedSeconds={elapsedSeconds}
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
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
            <AlertCircle />
            <AlertTitle>Unable to complete update</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {showLanding ? (
          <div className="glass-panel space-y-6 rounded-xl border border-white/10 p-6">
            <p className="text-sm text-muted-foreground">
              Review the suggested change above, then start AI analysis to generate an update plan
              and PR preview.
            </p>

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

        {!isPlanning && action && plan && planReview ? (
          <div className="space-y-4">
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
              planReview={planReview}
              targetFile={targetFile}
              onExecute={handleCreatePullRequest}
              initialActionRun={restoredActionRun}
              initialCompletion={restoredCompletion}
              initialExecutionResult={restoredExecutionResult}
              onRefreshStatus={handleRefreshStatus}
              onExecuteDocSuggestion={(file, sugg) => handleExecuteDocSuggestion(file, sugg)}
              previousHealthScore={previousHealthScore}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
