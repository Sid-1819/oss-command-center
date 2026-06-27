'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { executeReadmeAction } from '@/actions/readme/executeReadmeAction';
import { planReadmeAction } from '@/actions/readme/planReadmeAction';
import { ExecutionWorkflow } from '@/components/workflow/execution-workflow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  buildReadmePlanReview,
  clearPlanReview,
  loadPlanReview,
  savePlanReview,
} from '@/lib/readme/plan-review-storage';
import { toExecutionResult } from '@/lib/readme/to-execution-result';
import { toMaintenanceAction } from '@/lib/readme/to-maintenance-action';
import type { ReadmeExecutionPlan } from '@/actions/readme/types';
import type { MaintenanceAction } from '@/types/execution-workflow';
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

export default function ReadmeWorkflowPage() {
  const searchParams = useSearchParams();
  const repo = searchParams.get('repo')?.trim() ?? '';
  const suggestion = searchParams.get('suggestion')?.trim() ?? '';

  const [action, setAction] = useState<MaintenanceAction | null>(null);
  const [plan, setPlan] = useState<ReadmeExecutionPlan | null>(null);
  const [planReview, setPlanReview] = useState<ReadmePlanReview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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

  const handleCreatePullRequest = useCallback(async () => {
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

    return toExecutionResult(
      result.output,
      result.report,
      action.preflightChecks,
    );
  }, [action, planReview]);

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
          />
        ) : null}
      </div>
    </div>
  );
}
