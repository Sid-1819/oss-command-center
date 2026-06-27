'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ReadmePlanStep } from '@/actions/readme/types';

interface PlanStepsCardProps {
  steps: ReadmePlanStep[];
  appliedSteps: ReadmePlanStep[];
  skippedSteps: ReadmePlanStep[];
}

const PREVIEW_LINE_LIMIT = 8;

function stepKey(step: ReadmePlanStep): string {
  return `${step.operation}|${step.section ?? ''}|${step.content}`;
}

function isStepApplied(step: ReadmePlanStep, appliedSteps: ReadmePlanStep[]): boolean {
  const key = stepKey(step);
  return appliedSteps.some((candidate) => stepKey(candidate) === key);
}

function truncateContent(content: string): string {
  const lines = content.split('\n');

  if (lines.length <= PREVIEW_LINE_LIMIT) {
    return content;
  }

  return `${lines.slice(0, PREVIEW_LINE_LIMIT).join('\n')}\n…`;
}

const operationLabels: Record<ReadmePlanStep['operation'], string> = {
  insert: 'Insert',
  replace: 'Replace',
  append: 'Append',
};

export function PlanStepsCard({ steps, appliedSteps, skippedSteps }: PlanStepsCardProps) {
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Planned Steps</CardTitle>
          <Badge variant="outline">{steps.length} steps</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Review each AI-proposed change before creating a pull request.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {steps.map((step, index) => {
          const applied = isStepApplied(step, appliedSteps);
          const skipped = !applied && skippedSteps.some((s) => stepKey(s) === stepKey(step));
          const isExpanded = expandedSteps[index] ?? false;

          return (
            <div
              key={`${step.operation}-${step.section ?? 'none'}-${index}`}
              className="rounded-lg border border-border/50 bg-muted/20 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Step {index + 1}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {operationLabels[step.operation]}
                    </Badge>
                    {step.section ? (
                      <code className="rounded bg-black/20 px-1.5 py-0.5 text-xs">
                        {step.section}
                      </code>
                    ) : null}
                    <Badge
                      variant={applied ? 'default' : 'destructive'}
                      className={
                        applied
                          ? 'bg-chart-3/20 text-chart-3 border-chart-3/30'
                          : skipped
                            ? undefined
                            : 'bg-muted text-muted-foreground'
                      }
                    >
                      {applied ? 'Applied' : skipped ? 'Skipped' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">{step.rationale}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleStep(index)}
                  className="shrink-0 rounded-md p-1 hover:bg-muted/50"
                  aria-expanded={isExpanded}
                  aria-label={`Toggle content preview for step ${index + 1}`}
                >
                  <ChevronDown
                    className={`size-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>

              {isExpanded ? (
                <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-foreground/80">
                  {truncateContent(step.content)}
                </pre>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
