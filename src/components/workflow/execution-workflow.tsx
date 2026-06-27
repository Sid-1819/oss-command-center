'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import type { MaintenanceAction, ExecutionResult as ExecutionResultType } from '@/types/execution-workflow';
import type { ReadmePlanReview } from '@/types/readme-plan-review';
import { PlanCard } from './plan-card';
import { PlanStepsCard } from './plan-steps-card';
import { DiffPreview } from './diff-preview';
import { ChangesetPreview } from './changeset-preview';
import { PreflightChecks } from './preflight-checks';
import { ExecutionControls } from './execution-controls';
import { ExecutionProgress } from './execution-progress';
import { ExecutionResult } from './execution-result';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { README_TARGET_FILE } from '@/actions/readme/types';

interface ExecutionWorkflowProps {
  action: MaintenanceAction;
  mode?: 'review' | 'interactive';
  planReview?: ReadmePlanReview;
  onCancel?: () => void;
  onExecute?: () => Promise<ExecutionResultType>;
}

export function ExecutionWorkflow({
  action,
  mode = 'interactive',
  planReview,
  onCancel,
  onExecute,
}: ExecutionWorkflowProps) {
  const [status, setStatus] = useState(action.status);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResultType | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    changeset: true,
    diff: true,
    preflight: true,
  });

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleExecute = useCallback(async () => {
    setIsExecuting(true);
    setStatus('executing');

    try {
      if (onExecute) {
        const result = await onExecute();
        setExecutionResult(result);
        setStatus(result.status === 'success' ? 'complete' : 'failed');
        return;
      }

      // Demo-only mock execution
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setStatus('complete');
      setExecutionResult({
        status: 'success',
        summary: 'Documentation successfully updated',
        logs: ['Starting documentation update...', 'Updated 3 files', 'Validation passed', 'Execution completed'],
        changesApplied: 3,
        checksPassedCount: 4,
        checksFailedCount: 0,
        prUrl: 'https://github.com/example/pulls/123',
        branchName: 'fix/documentation-update',
        canRollback: true,
      });
    } catch (error) {
      setStatus('failed');
      setExecutionResult({
        status: 'failed',
        summary:
          error instanceof Error
            ? error.message
            : 'Execution failed: unable to apply changes',
        logs: [
          'Starting README update...',
          error instanceof Error ? `Error: ${error.message}` : 'Error: Unknown failure',
        ],
        changesApplied: 0,
        checksPassedCount: action.preflightChecks.filter((c) => c.status === 'success').length,
        checksFailedCount: action.preflightChecks.filter((c) => c.status === 'error').length,
        canRollback: false,
      });
    } finally {
      setIsExecuting(false);
    }
  }, [action.preflightChecks, onExecute]);

  const handleCancel = useCallback(() => {
    setIsExecuting(false);
    setStatus('review');
    if (onCancel) onCancel();
  }, [onCancel]);

  const validationIssueCount = planReview
    ? planReview.validation.issues.length
    : action.preflightChecks.filter((check) => check.status === 'error').length;

  const appliedStepCount = planReview?.preview.appliedSteps.length ?? 0;
  const skippedStepCount = planReview?.preview.skippedSteps.length ?? 0;
  const totalStepCount = planReview?.plan.steps.length ?? 0;

  const canCreatePullRequest =
    planReview !== undefined &&
    planReview.validation.valid &&
    appliedStepCount > 0 &&
    action.preflightChecks.every((check) => check.status !== 'error');

  return (
    <div className="space-y-6">
      {/* Status Progress Bar */}
      <div className="flex items-center gap-2 px-1">
        {['review', 'ready', 'executing', 'complete'].map((step, index) => (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg font-medium text-xs transition-all ${
                ['review', 'ready', 'executing', 'complete'].indexOf(status) >= index
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1}
            </div>
            {index < 3 && (
              <div
                className={`h-1 flex-1 rounded-full transition-all ${
                  ['review', 'ready', 'executing', 'complete'].indexOf(status) > index
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {status === 'review' && (
          <>
            <PlanCard
              action={action}
              stepCount={planReview?.plan.steps.length}
            />
            {planReview ? (
              <PlanStepsCard
                steps={planReview.plan.steps}
                appliedSteps={planReview.preview.appliedSteps}
                skippedSteps={planReview.preview.skippedSteps}
              />
            ) : null}
            {planReview ? (
              <DiffPreview
                diff={planReview.previewDiff}
                fileName={README_TARGET_FILE}
                isExpanded={expandedSections.diff}
                onToggle={() => toggleSection('diff')}
              />
            ) : null}
            <ChangesetPreview
              changes={action.proposedChanges}
              isExpanded={expandedSections.changeset}
              onToggle={() => toggleSection('changeset')}
            />
            <PreflightChecks
              checks={action.preflightChecks}
              isExpanded={expandedSections.preflight}
              onToggle={() => toggleSection('preflight')}
            />
            {mode === 'interactive' ? (
              <ExecutionControls
                isExecuting={isExecuting}
                canExecute={action.preflightChecks.every((c) => c.status !== 'error')}
                onExecute={handleExecute}
                onCancel={handleCancel}
              />
            ) : (
              <div className="glass-panel space-y-4 rounded-xl border border-white/10 p-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {planReview?.validation.valid
                      ? 'Plan valid — ready for review'
                      : `${validationIssueCount} validation issue${validationIssueCount === 1 ? '' : 's'} found`}
                  </p>
                  {planReview ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {appliedStepCount} of {totalStepCount} steps applied in preview
                      {skippedStepCount > 0
                        ? ` · ${skippedStepCount} skipped`
                        : ''}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Review the proposed README changes above.
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/app">Back to dashboard</Link>
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!canCreatePullRequest || isExecuting}
                    onClick={() => void handleExecute()}
                  >
                    {isExecuting ? (
                      <>
                        <Spinner className="mr-2 size-4" />
                        Creating PR…
                      </>
                    ) : (
                      'Create PR'
                    )}
                  </Button>
                </div>
                {!canCreatePullRequest && planReview ? (
                  <p className="text-center text-xs text-muted-foreground">
                    Resolve validation issues or ensure at least one step applies before creating a PR.
                  </p>
                ) : null}
              </div>
            )}
          </>
        )}

        {status === 'executing' && (
          <ExecutionProgress
            action={action}
            isExecuting={isExecuting}
            onCancel={handleCancel}
          />
        )}

        {(status === 'complete' || status === 'failed') && executionResult && (
          <ExecutionResult
            result={executionResult}
            action={action}
            onReset={() => {
              setStatus('review');
              setExecutionResult(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
