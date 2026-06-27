'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { refreshActionRunStatus } from '@/actions/action-run';
import { executeMarkdownDocAction } from '@/actions/markdown-doc/executeMarkdownDocAction';
import { planMarkdownDocAction } from '@/actions/markdown-doc/planMarkdownDocAction';
import type { MarkdownDocExecutionPlan } from '@/actions/markdown-doc/types';
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
  buildDocPlanReview,
  clearPlanReview,
  loadPlanReview,
  savePlanReview,
} from '@/lib/actions/plan-review-storage';
import { toExecutionResult } from '@/lib/actions/to-execution-result';
import { toDocMaintenanceAction } from '@/lib/actions/to-maintenance-action';
import type { ActionRun, ActionRunCompletion } from '@/types/action-run';
import type { ExecutionResult, MaintenanceAction } from '@/types/execution-workflow';
import {
  getEffectiveAiConfig,
} from '@/lib/ai/client-settings';
import {
  DOC_PLAN_CONTEXT_KEY,
  type DocPlanContext,
  type DocPlanReview,
} from '@/types/doc-plan-review';

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
}

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
    let isCancelled = false;

    async function loadPlan() {
      setIsPlanning(true);
      setErrorMessage(null);
      setAction(null);
      setPlan(null);
      setPlanReview(null);

      if (!repo || !suggestion) {
        setErrorMessage(
          'Missing repository or suggestion. Start from the dashboard Maintenance Queue.',
        );
        setIsPlanning(false);
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
        setIsPlanning(false);
        return;
      }

      const context = readPlanContext();
      if (!context) {
        setErrorMessage(
          'Analysis context expired. Go back to the dashboard, analyze again, then start a doc update.',
        );
        setIsPlanning(false);
        return;
      }

      if (context.repositoryRef !== repo || context.targetFile !== targetFile) {
        setErrorMessage('Repository or file mismatch. Start again from the dashboard.');
        setIsPlanning(false);
        return;
      }

      if (context.suggestion !== suggestion) {
        setErrorMessage('Suggestion mismatch. Start again from the dashboard.');
        setIsPlanning(false);
        return;
      }

      const result = await planMarkdownDocAction({
        repositoryRef: context.repositoryRef,
        targetFile: context.targetFile,
        suggestion: context.suggestion,
        analysis: context.analysis,
        briefing: context.briefing,
        aiConfig: context.aiConfig ?? getEffectiveAiConfig(),
        demoMode: context.demoMode ?? demoMode,
      });

      if (isCancelled) return;

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
    }

    void loadPlan();
    return () => {
      isCancelled = true;
    };
  }, [repo, targetFile, suggestion]);

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

        const context: DocPlanContext = {
          repositoryRef: actionRun.repositoryRef,
          targetFile,
          suggestion:
            docSuggestion?.payload?.suggestion ?? planReview?.suggestion ?? suggestion,
          analysis: refreshed.completion.analysis,
          briefing: refreshed.completion.briefing,
          analyzedAt: new Date().toISOString(),
        };

        sessionStorage.setItem(DOC_PLAN_CONTEXT_KEY, JSON.stringify(context));
      }

      setRestoredActionRun(refreshed.actionRun);
      setRestoredCompletion(refreshed.completion ?? null);
      setRestoredExecutionResult(buildRestoredExecutionResult(refreshed.actionRun));

      return {
        actionRun: refreshed.actionRun,
        completion: refreshed.completion,
      };
    },
    [planReview?.suggestion, suggestion, targetFile],
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

        {isPlanning ? (
          <div className="glass-panel flex flex-col items-center justify-center gap-3 p-12 text-center">
            <Spinner className="size-6" />
            <p className="text-sm text-muted-foreground">
              Generating update plan… ({formatElapsed(elapsedSeconds)})
            </p>
          </div>
        ) : null}

        {!isPlanning && errorMessage ? (
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
            <AlertCircle />
            <AlertTitle>Unable to complete update</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        {!isPlanning && action && plan && planReview ? (
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
          />
        ) : null}
      </div>
    </div>
  );
}
