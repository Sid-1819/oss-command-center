'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { refreshActionRunStatus } from '@/actions/action-run';
import { executeReadmeAction } from '@/actions/readme/executeReadmeAction';
import { planReadmeAction } from '@/actions/readme/planReadmeAction';
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
  buildReadmePlanReview,
  clearPlanReview,
  loadPlanReview,
  savePlanReview,
} from '@/lib/readme/plan-review-storage';
import { toExecutionResult } from '@/lib/readme/to-execution-result';
import { toMaintenanceAction } from '@/lib/readme/to-maintenance-action';
import type { ReadmeExecutionPlan } from '@/actions/readme/types';
import type { ActionRun, ActionRunCompletion } from '@/types/action-run';
import type { ExecutionResult, MaintenanceAction } from '@/types/execution-workflow';
import {
  README_PLAN_CONTEXT_KEY,
  type ReadmePlanContext,
  type ReadmePlanReview,
} from '@/types/readme-plan-review';

function formatElapsed(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function readPlanContext(): ReadmePlanContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = sessionStorage.getItem(README_PLAN_CONTEXT_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ReadmePlanContext;
  } catch {
    return null;
  }
}

function applyPlanReview(
  review: ReadmePlanReview,
  setPlan: (plan: ReadmeExecutionPlan) => void,
  setPlanReview: (review: ReadmePlanReview) => void,
  setAction: (action: MaintenanceAction) => void,
) {
  setPlan(review.plan);
  setPlanReview(review);
  setAction(
    toMaintenanceAction(
      review.plan,
      review.preview,
      review.validation,
      review.repositoryRef,
      review.suggestion,
    ),
  );
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

export default function ReadmeWorkflowPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repo = searchParams.get('repo')?.trim() ?? '';
  const suggestion = searchParams.get('suggestion')?.trim() ?? '';

  const [action, setAction] = useState<MaintenanceAction | null>(null);
  const [plan, setPlan] = useState<ReadmeExecutionPlan | null>(null);
  const [planReview, setPlanReview] = useState<ReadmePlanReview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restoredActionRun, setRestoredActionRun] = useState<ActionRun | null>(null);
  const [restoredCompletion, setRestoredCompletion] =
    useState<ActionRunCompletion | null>(null);
  const [restoredExecutionResult, setRestoredExecutionResult] =
    useState<ExecutionResult | null>(null);

  useEffect(() => {
    if (!isPlanning) {
      return;
    }

    const startedAt = Date.now();

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlanning]);

  useEffect(() => {
    if (!repo) {
      return;
    }

    const existingRun = findActionRunForRepository(repo);

    if (existingRun && TRACKABLE_STATUSES.includes(existingRun.status)) {
      setRestoredActionRun(existingRun);
      setRestoredCompletion(loadActionRunCompletion());
      setRestoredExecutionResult(buildRestoredExecutionResult(existingRun));
    }
  }, [repo]);

  useEffect(() => {
    let isCancelled = false;

    async function loadPlan() {
      setIsPlanning(true);
      setErrorMessage(null);
      setAction(null);
      setPlan(null);
      setPlanReview(null);

      if (!repo || !suggestion) {
        setErrorMessage(
          'Missing repository or suggestion. Start from the dashboard Documentation Drift section.',
        );
        setIsPlanning(false);
        return;
      }

      const cachedReview = loadPlanReview(repo, suggestion);

      if (cachedReview) {
        applyPlanReview(cachedReview, setPlan, setPlanReview, setAction);
        setIsPlanning(false);
        return;
      }

      const context = readPlanContext();

      if (!context) {
        setErrorMessage(
          'Analysis context expired. Go back to the dashboard, analyze your repository again, then click Update README.',
        );
        setIsPlanning(false);
        return;
      }

      if (context.repositoryRef !== repo) {
        setErrorMessage(
          'Repository mismatch. Go back to the dashboard and start the README update again.',
        );
        setIsPlanning(false);
        return;
      }

      if (context.suggestion !== suggestion) {
        setErrorMessage(
          'Suggestion mismatch. Go back to the dashboard and start the README update again.',
        );
        setIsPlanning(false);
        return;
      }

      const result = await planReadmeAction({
        repositoryRef: context.repositoryRef,
        suggestion: context.suggestion,
        analysis: context.analysis,
        briefing: context.briefing,
      });

      if (isCancelled) {
        return;
      }

      if (!result.success) {
        setErrorMessage(result.error.message);
        setIsPlanning(false);
        return;
      }

      const review = buildReadmePlanReview(
        context.repositoryRef,
        context.suggestion,
        result,
      );

      savePlanReview(review);
      applyPlanReview(review, setPlan, setPlanReview, setAction);
      setIsPlanning(false);
    }

    void loadPlan();

    return () => {
      isCancelled = true;
    };
  }, [repo, suggestion]);

  const handleCreatePullRequest = useCallback(async (): Promise<ExecuteWorkflowResult> => {
    if (!planReview || !action) {
      throw new Error('Plan review is not available.');
    }

    setErrorMessage(null);

    const result = await executeReadmeAction({
      repositoryRef: planReview.repositoryRef,
      plan: planReview.plan,
    });

    if (!result.success) {
      if (result.error.code === 'README_CHANGED') {
        clearPlanReview();
        setErrorMessage(
          'README.md changed since this plan was created. Go back to the dashboard, analyze again, and click Update README to generate a fresh plan.',
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

    return {
      result: executionResult,
      actionRun: result.actionRun,
    };
  }, [action, planReview]);

  const handleRefreshStatus = useCallback(async (actionRun: ActionRun) => {
    const refreshed = await refreshActionRunStatus(actionRun);

    if (!refreshed.success) {
      throw new Error(refreshed.error.message);
    }

    saveActionRun(refreshed.actionRun, refreshed.completion);

    if (refreshed.completion?.analysis && refreshed.completion.briefing) {
      const context: ReadmePlanContext = {
        repositoryRef: actionRun.repositoryRef,
        suggestion:
          refreshed.completion.nextActions.find(
            (item) => item.executable && item.actionType === 'readme',
          )?.payload?.suggestion ??
          planReview?.suggestion ??
          suggestion,
        analysis: refreshed.completion.analysis,
        briefing: refreshed.completion.briefing,
        analyzedAt: new Date().toISOString(),
      };

      sessionStorage.setItem(README_PLAN_CONTEXT_KEY, JSON.stringify(context));
    }

    setRestoredActionRun(refreshed.actionRun);
    setRestoredCompletion(refreshed.completion ?? null);
    setRestoredExecutionResult(buildRestoredExecutionResult(refreshed.actionRun));

    return {
      actionRun: refreshed.actionRun,
      completion: refreshed.completion,
    };
  }, [planReview?.suggestion, suggestion]);

  const handleExecuteReadmeSuggestion = useCallback(
    (nextSuggestion: string) => {
      const context = readPlanContext();

      if (!context || context.repositoryRef !== repo) {
        setErrorMessage(
          'Analysis context is unavailable. Refresh status after merge or analyze again from the dashboard.',
        );
        return;
      }

      clearPlanReview();

      const nextContext: ReadmePlanContext = {
        ...context,
        suggestion: nextSuggestion,
      };

      sessionStorage.setItem(README_PLAN_CONTEXT_KEY, JSON.stringify(nextContext));

      router.push(
        `/app/readme?repo=${encodeURIComponent(repo)}&suggestion=${encodeURIComponent(nextSuggestion)}`,
      );
    },
    [repo, router],
  );

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

          <h1 className="text-3xl font-bold">Update README</h1>
          {repo ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Repository:{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {repo}
              </code>
            </p>
          ) : null}
          {suggestion ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {suggestion}
            </p>
          ) : null}
        </div>

        {isPlanning ? (
          <div className="glass-panel flex flex-col items-center justify-center gap-3 p-12 text-center">
            <Spinner className="size-6" />
            <p className="text-sm text-muted-foreground">
              Generating README update plan… ({formatElapsed(elapsedSeconds)})
            </p>
            <p className="text-xs text-muted-foreground/80">
              AI is reviewing documentation drift and drafting proposed changes.
            </p>
          </div>
        ) : null}

        {!isPlanning && errorMessage ? (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
            <AlertCircle />
            <AlertTitle>Unable to complete README update</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {!isPlanning && action && plan && planReview ? (
          <ExecutionWorkflow
            action={action}
            mode="review"
            planReview={planReview}
            onExecute={handleCreatePullRequest}
            initialActionRun={restoredActionRun}
            initialCompletion={restoredCompletion}
            initialExecutionResult={restoredExecutionResult}
            onRefreshStatus={handleRefreshStatus}
            onExecuteReadmeSuggestion={handleExecuteReadmeSuggestion}
          />
        ) : null}
      </div>
    </div>
  );
}
