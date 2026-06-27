'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { refreshActionRunStatus } from '@/actions/action-run';
import { executeMarkdownDocAction } from '@/actions/markdown-doc/executeMarkdownDocAction';
import { planMarkdownDocAction } from '@/actions/markdown-doc/planMarkdownDocAction';
import type { MarkdownDocExecutionPlan } from '@/actions/markdown-doc/types';
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
import type { ActionRun, ActionRunCompletion } from '@/types/action-run';
import type { ExecutionResult, MaintenanceAction } from '@/types/execution-workflow';
import {
  DOC_PLAN_CONTEXT_KEY,
  type DocPlanContext,
  type DocPlanReview,
} from '@/types/doc-plan-review';

function readPlanContext(): DocPlanContext | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(DOC_PLAN_CONTEXT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DocPlanContext;
  } catch {
    return null;
  }
}

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
    const existingRun = findActionRunForRepository(repo);
    if (
      existingRun &&
      TRACKABLE_STATUSES.includes(existingRun.status) &&
      (existingRun.actionType === 'markdown-doc' ||
        existingRun.actionType === 'readme') &&
      (!existingRun.targetFile || existingRun.targetFile === targetFile)
    ) {
      setRestoredActionRun(existingRun);
      setRestoredCompletion(loadActionRunCompletion());
      setRestoredExecutionResult(buildRestoredExecutionResult(existingRun));
    }
  }, [repo, targetFile]);

  useEffect(() => {
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

    const cachedReview = loadPlanReview(repo, targetFile, suggestion);
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
      const context = readPlanContext();
      if (context) {
        setPreviousHealthScore(context.briefing.repositoryHealth.score);
      }
      setIsInitializing(false);
      return;
    }

    const context = readPlanContext();
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
  }, [repo, targetFile, suggestion]);

  const handleStartAnalysis = useCallback(async () => {
    const context = docContext ?? readPlanContext();
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

    const result = await planMarkdownDocAction({
      repositoryRef: context.repositoryRef,
      targetFile: context.targetFile,
      suggestion: context.suggestion,
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

    const review = buildDocPlanReview(
      context.repositoryRef,
      context.targetFile,
      context.suggestion,
      result,
    );

    savePlanReview(review);
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
    setIsPlanning(false);
  }, [demoMode, docContext, repo, suggestion, targetFile]);

  const handleReAnalyze = useCallback(() => {
    clearPlanReview();
    setPlan(null);
    setPlanReview(null);
    setAction(null);
    setRestoredActionRun(null);
    setRestoredCompletion(null);
    setRestoredExecutionResult(null);
    setErrorMessage(null);
  }, []);

  const handleCreatePullRequest = useCallback(async (): Promise<ExecuteWorkflowResult> => {
    if (!planReview || !action) throw new Error('Plan review is not available.');

    setErrorMessage(null);

    const result = await executeMarkdownDocAction({
      repositoryRef: planReview.repositoryRef,
      plan: planReview.plan,
      demoMode: demoMode || readPlanContext()?.demoMode,
    });

    if (!result.success) {
      if (result.error.code === 'README_CHANGED' || result.error.code === 'FILE_CHANGED') {
        clearPlanReview();
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
      saveActionRun(result.actionRun);
      setRestoredActionRun(result.actionRun);
      setRestoredCompletion(null);
      setRestoredExecutionResult(executionResult);
    }

    return { result: executionResult, actionRun: result.actionRun };
  }, [action, demoMode, planReview, targetFile]);

  const handleRefreshStatus = useCallback(
    async (actionRun: ActionRun) => {
      const context = readPlanContext();

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

        sessionStorage.setItem(DOC_PLAN_CONTEXT_KEY, JSON.stringify(nextContext));
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
      const context = readPlanContext();
      if (!context || context.repositoryRef !== repo) {
        setErrorMessage('Analysis context unavailable. Refresh after merge or analyze again.');
        return;
      }

      clearPlanReview();
      const nextContext: DocPlanContext = {
        ...context,
        targetFile: nextFile,
        suggestion: nextSuggestion,
      };
      sessionStorage.setItem(DOC_PLAN_CONTEXT_KEY, JSON.stringify(nextContext));

      router.push(
        `/app/doc?repo=${encodeURIComponent(repo)}&file=${encodeURIComponent(nextFile)}&suggestion=${encodeURIComponent(nextSuggestion)}${demoMode ? '&demo=1' : ''}`,
      );
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
