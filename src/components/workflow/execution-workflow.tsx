'use client';

import { useState, useCallback } from 'react';
import type { MaintenanceAction, ExecutionResult as ExecutionResultType } from '@/types/execution-workflow';
import { PlanCard } from './plan-card';
import { ChangesetPreview } from './changeset-preview';
import { PreflightChecks } from './preflight-checks';
import { ExecutionControls } from './execution-controls';
import { ExecutionProgress } from './execution-progress';
import { ExecutionResult } from './execution-result';

interface ExecutionWorkflowProps {
  action: MaintenanceAction;
  onCancel?: () => void;
  onExecute?: (actionId: string) => Promise<void>;
}

export function ExecutionWorkflow({ action, onCancel, onExecute }: ExecutionWorkflowProps) {
  const [status, setStatus] = useState(action.status);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResultType | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    changeset: true,
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
        await onExecute(action.id);
      }

      // Simulate execution steps
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
        summary: 'Execution failed: unable to apply changes',
        logs: ['Starting documentation update...', 'Error: Merge conflict detected'],
        changesApplied: 0,
        checksPassedCount: 3,
        checksFailedCount: 1,
        canRollback: false,
      });
    } finally {
      setIsExecuting(false);
    }
  }, [action.id, onExecute]);

  const handleCancel = useCallback(() => {
    setIsExecuting(false);
    setStatus('review');
    if (onCancel) onCancel();
  }, [onCancel]);

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
            <PlanCard action={action} />
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
            <ExecutionControls
              isExecuting={isExecuting}
              canExecute={action.preflightChecks.every((c) => c.status !== 'error')}
              onExecute={handleExecute}
              onCancel={handleCancel}
            />
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
