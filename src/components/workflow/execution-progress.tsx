'use client';

import { useEffect, useState } from 'react';
import { Loader, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { MaintenanceAction, ExecutionStep } from '@/types/execution-workflow';

interface ExecutionProgressProps {
  action: MaintenanceAction;
  isExecuting: boolean;
  onCancel: () => void;
}

export function ExecutionProgress({ action, isExecuting, onCancel }: ExecutionProgressProps) {
  const [steps, setSteps] = useState<ExecutionStep[]>([
    { id: '1', name: 'Validating changes', status: 'running', timestamp: new Date() },
    { id: '2', name: 'Running pre-flight checks', status: 'pending' },
    { id: '3', name: 'Applying modifications', status: 'pending' },
    { id: '4', name: 'Running validation tests', status: 'pending' },
    { id: '5', name: 'Creating PR', status: 'pending' },
  ]);

  // Simulate step progression
  useEffect(() => {
    if (!isExecuting) return;

    const intervals = [2000, 4000, 6000, 8000, 10000];

    intervals.forEach((delay, index) => {
      setTimeout(() => {
        if (index > 0) {
          setSteps((prev) =>
            prev.map((step, i) =>
              i === index - 1 ? { ...step, status: 'complete', timestamp: new Date() } : step,
            ),
          );
        }
        if (index < steps.length) {
          setSteps((prev) =>
            prev.map((step, i) =>
              i === index ? { ...step, status: 'running', timestamp: new Date() } : step,
            ),
          );
        }
      }, delay);
    });
  }, [isExecuting]);

  const progressPercent = (steps.filter((s) => s.status === 'complete').length / steps.length) * 100;

  return (
    <Card className="glass-panel border-0">
      <CardHeader>
        <CardTitle className="text-base">Executing Maintenance Action</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {action.title} is in progress. Do not close this page.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Progress</p>
            <p className="text-sm font-medium text-primary">{Math.round(progressPercent)}%</p>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-chart-2 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step Log */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-3">
              <div className="flex items-center justify-center size-6 shrink-0 mt-1">
                {step.status === 'complete' && (
                  <div className="size-6 rounded-full bg-chart-3/20 flex items-center justify-center">
                    <span className="text-chart-3">✓</span>
                  </div>
                )}
                {step.status === 'running' && (
                  <Loader className="size-5 text-primary animate-spin" />
                )}
                {step.status === 'pending' && (
                  <div className="size-6 rounded-full border-2 border-muted" />
                )}
                {step.status === 'error' && (
                  <div className="size-6 rounded-full bg-destructive/20 flex items-center justify-center">
                    <AlertCircle className="size-4 text-destructive" />
                  </div>
                )}
              </div>

              <div className="flex-1 pt-1.5">
                <p
                  className={`text-sm font-medium transition-colors ${
                    step.status === 'complete'
                      ? 'text-muted-foreground'
                      : step.status === 'running'
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                  }`}
                >
                  {step.name}
                </p>
                {step.timestamp && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.timestamp.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Live Log Display */}
        <div className="rounded-lg bg-black/40 border border-muted/30 p-4 space-y-1 max-h-48 overflow-auto">
          <div className="font-mono text-xs text-foreground/70 space-y-1">
            <div className="text-chart-3">
              <span className="text-primary">[2:45:32]</span> Starting execution...
            </div>
            <div>
              <span className="text-primary">[2:45:33]</span> Validating 3 file changes
            </div>
            <div className="text-chart-3">
              <span className="text-primary">[2:45:35]</span> ✓ Validation successful
            </div>
            <div>
              <span className="text-primary">[2:45:36]</span> Running linter...
            </div>
            <div className="text-foreground/50">
              <span className="text-primary">[2:45:38]</span> {'\u2026'}
            </div>
          </div>
        </div>

        {/* Cancel Option */}
        <div className="flex items-center justify-center pt-4 border-t border-border/30">
          <Button
            variant="outline"
            onClick={onCancel}
            className="text-xs"
          >
            Cancel Execution
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
