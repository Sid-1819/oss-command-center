'use client';

import { ExternalLink, CheckCircle2, XCircle, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { MaintenanceAction, ExecutionResult as ExecutionResultType } from '@/types/execution-workflow';

interface ExecutionResultProps {
  result: ExecutionResultType;
  action: MaintenanceAction;
  onReset: () => void;
}

export function ExecutionResult({ result, action, onReset }: ExecutionResultProps) {
  const isSuccess = result.status === 'success';

  return (
    <Card className={`glass-panel border-0 ${isSuccess ? 'border-2 border-chart-3/30' : 'border-2 border-destructive/30'}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          {isSuccess ? (
            <CheckCircle2 className="size-6 text-chart-3" />
          ) : (
            <XCircle className="size-6 text-destructive" />
          )}
          <div>
            <CardTitle className={`text-lg ${isSuccess ? 'text-chart-3' : 'text-destructive'}`}>
              {isSuccess ? 'Execution Successful' : 'Execution Failed'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">{result.summary}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/40 p-3 text-center">
            <p className="text-2xl font-semibold">{result.changesApplied}</p>
            <p className="text-xs text-muted-foreground mt-1">Changes Applied</p>
          </div>
          <div className="rounded-lg bg-chart-3/5 border border-chart-3/20 p-3 text-center">
            <p className="text-2xl font-semibold text-chart-3">{result.checksPassedCount}</p>
            <p className="text-xs text-chart-3 mt-1">Checks Passed</p>
          </div>
          <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-center">
            <p className="text-2xl font-semibold text-destructive">{result.checksFailedCount}</p>
            <p className="text-xs text-destructive mt-1">Checks Failed</p>
          </div>
        </div>

        {/* Execution Log */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Execution Log</p>
          <div className="rounded-lg bg-black/40 border border-muted/30 p-3 space-y-1 max-h-32 overflow-auto">
            {result.logs.map((log, index) => (
              <div key={index} className="font-mono text-xs text-foreground/70">
                <span className="text-muted-foreground">[{index}]</span> {log}
              </div>
            ))}
          </div>
        </div>

        {/* Success State Actions */}
        {isSuccess && (
          <div className="space-y-3 pt-4 border-t border-border/30">
            <p className="text-sm font-medium">What&apos;s next?</p>
            <div className="grid gap-2">
              {result.prUrl && (
                <a
                  href={result.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-primary/30 bg-primary/5 p-3 hover:bg-primary/10 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary">View Pull Request</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Changes are ready for review
                      </p>
                    </div>
                    <ExternalLink className="size-4 text-primary" />
                  </div>
                </a>
              )}

              <div className="rounded-lg border border-chart-3/30 bg-chart-3/5 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-chart-3">Branch Created</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <code className="bg-black/20 px-1.5 py-0.5 rounded">
                        {result.branchName}
                      </code>
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(result.branchName || '');
                    }}
                  >
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Failure State Actions */}
        {!isSuccess && (
          <div className="space-y-3 pt-4 border-t border-border/30">
            <p className="text-sm font-medium">Troubleshooting</p>
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 space-y-2">
              <p className="text-sm text-destructive font-medium">Execution encountered an error:</p>
              <ul className="text-sm text-destructive/80 list-disc list-inside space-y-1">
                {result.logs
                  .filter((log) => log.toLowerCase().includes('error'))
                  .map((log, index) => (
                    <li key={index}>{log}</li>
                  ))}
              </ul>
            </div>

            {result.canRollback && (
              <Button variant="outline" className="w-full">
                Rollback Changes
              </Button>
            )}
          </div>
        )}

        {/* General Actions */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/30">
          <Button variant="outline" onClick={onReset} className="w-full">
            Review Again
          </Button>
          <Button className="w-full">
            Create Similar Action
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
