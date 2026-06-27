'use client';

import { ChevronDown, CheckCircle2, AlertCircle, Loader, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PreflightCheck } from '@/types/execution-workflow';

interface PreflightChecksProps {
  checks: PreflightCheck[];
  isExpanded: boolean;
  onToggle: () => void;
}

export function PreflightChecks({ checks, isExpanded, onToggle }: PreflightChecksProps) {
  const statusIcons = {
    pending: <div className="size-4 rounded-full border-2 border-muted-foreground" />,
    running: <Loader className="size-4 animate-spin text-primary" />,
    success: <CheckCircle2 className="size-4 text-chart-3" />,
    warning: <AlertCircle className="size-4 text-destructive/60" />,
    error: <XCircle className="size-4 text-destructive" />,
  };

  const statusColors = {
    pending: 'bg-muted/40 border-muted/50',
    running: 'bg-primary/5 border-primary/20',
    success: 'bg-chart-3/5 border-chart-3/20',
    warning: 'bg-destructive/5 border-destructive/20',
    error: 'bg-destructive/10 border-destructive/30',
  };

  const passedCount = checks.filter((c) => c.status === 'success').length;
  const failedCount = checks.filter((c) => c.status === 'error').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;

  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <div className="flex items-center justify-between cursor-pointer" onClick={onToggle}>
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Pre-flight Checks</CardTitle>
            <div className="flex items-center gap-1">
              {passedCount > 0 && (
                <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20">
                  {passedCount} passed
                </Badge>
              )}
              {failedCount > 0 && (
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  {failedCount} failed
                </Badge>
              )}
              {warningCount > 0 && (
                <Badge
                  variant="outline"
                  className="bg-destructive/5 text-destructive/70 border-destructive/20"
                >
                  {warningCount} warning
                </Badge>
              )}
            </div>
          </div>
          <ChevronDown
            className={`size-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-2">
          {checks.map((check) => (
            <div
              key={check.id}
              className={`rounded-lg border-2 p-4 transition-all ${statusColors[check.status]}`}
            >
              <div className="flex items-start gap-3">
                {statusIcons[check.status]}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{check.name}</p>
                    {check.status === 'running' && (
                      <Badge variant="secondary" className="text-xs">
                        Running...
                      </Badge>
                    )}
                    {check.status === 'warning' && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-destructive/10 text-destructive/70 border-destructive/20"
                      >
                        Warning
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{check.description}</p>
                  {check.details && (
                    <div className="mt-2 rounded bg-black/20 px-2 py-1.5">
                      <code className="text-xs text-foreground/70 font-mono">{check.details}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {failedCount === 0 && (
            <div className="rounded-lg bg-chart-3/5 border-2 border-chart-3/20 p-3 mt-4">
              <p className="text-sm text-chart-3 font-medium">
                ✓ All checks passed. Ready to execute.
              </p>
            </div>
          )}

          {failedCount > 0 && (
            <div className="rounded-lg bg-destructive/10 border-2 border-destructive/30 p-3 mt-4">
              <p className="text-sm text-destructive font-medium">
                ⚠ Some checks failed. Please review before executing.
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
