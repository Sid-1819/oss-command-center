'use client';

import Link from 'next/link';
import { ExternalLink, CheckCircle2, XCircle, Copy, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { NextRecommendedActions } from '@/components/workflow/next-recommended-actions';
import { HealthScoreDelta } from '@/components/health-score-delta';
import type { ActionRun, ActionRunCompletion } from '@/types/action-run';
import type { MaintenanceAction, ExecutionResult as ExecutionResultType } from '@/types/execution-workflow';

interface ExecutionResultProps {
  result: ExecutionResultType;
  action: MaintenanceAction;
  onReset: () => void;
  actionRun?: ActionRun;
  onRefreshStatus?: () => Promise<void>;
  isRefreshing?: boolean;
  completion?: ActionRunCompletion;
  onExecuteDocSuggestion?: (targetFile: string, suggestion: string) => void;
  onFixIssue?: (issueNumber: number) => void;
  previousHealthScore?: number;
}

function formatDate(iso?: string): string {
  if (!iso) {
    return 'Unknown';
  }

  return new Date(iso).toLocaleString();
}

export function ExecutionResult({
  result,
  action,
  onReset,
  actionRun,
  onRefreshStatus,
  isRefreshing = false,
  completion,
  onExecuteDocSuggestion,
  onFixIssue,
  previousHealthScore,
}: ExecutionResultProps) {
  const isSuccess = result.status === 'success';
  const isAwaitingReview = actionRun?.status === 'AWAITING_REVIEW';
  const isCompleted = actionRun?.status === 'COMPLETED';
  const isClosed = actionRun?.status === 'CLOSED';

  const title = isCompleted
    ? 'Pull Request Merged'
    : isClosed
      ? 'Pull Request Closed'
      : isAwaitingReview
        ? 'Awaiting Review'
        : isSuccess
          ? 'Execution Successful'
          : 'Execution Failed';

  const borderClass = isClosed
    ? 'border-2 border-muted-foreground/30'
    : isSuccess || isCompleted
      ? 'border-2 border-chart-3/30'
      : 'border-2 border-destructive/30';

  const iconClass = isClosed
    ? 'text-muted-foreground'
    : isSuccess || isCompleted
      ? 'text-chart-3'
      : 'text-destructive';

  return (
    <Card className={`glass-panel border-0 ${borderClass}`}>
      <CardHeader>
        <div className="flex items-center gap-3">
          {isSuccess || isCompleted ? (
            <CheckCircle2 className={`size-6 ${iconClass}`} />
          ) : isClosed ? (
            <XCircle className={`size-6 ${iconClass}`} />
          ) : (
            <XCircle className={`size-6 ${iconClass}`} />
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className={`text-lg ${iconClass}`}>{title}</CardTitle>
              {actionRun ? (
                <Badge variant="outline">
                  {isCompleted
                    ? 'Completed'
                    : isClosed
                      ? 'Closed'
                      : isAwaitingReview
                        ? 'Awaiting Review'
                        : actionRun.status}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{result.summary}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {actionRun ? (
          <div className="rounded-lg border border-border/40 bg-muted/20 p-4 space-y-2 text-sm">
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              <p>
                <span className="text-muted-foreground">Repository: </span>
                <code className="rounded bg-black/20 px-1.5 py-0.5 text-xs">
                  {actionRun.repositoryRef || action.repository}
                </code>
              </p>
              <p>
                <span className="text-muted-foreground">PR: </span>
                <span>#{actionRun.pullRequestNumber}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Branch: </span>
                <code className="rounded bg-black/20 px-1.5 py-0.5 text-xs">
                  {actionRun.branch}
                </code>
              </p>
            </div>
            {isCompleted ? (
              <div className="space-y-1 pt-2 border-t border-border/30">
                {actionRun.mergedBy ? (
                  <p>
                    <span className="text-muted-foreground">Merged by: </span>
                    {actionRun.mergedBy}
                  </p>
                ) : null}
                {actionRun.mergedAt ? (
                  <p>
                    <span className="text-muted-foreground">Merged at: </span>
                    {formatDate(actionRun.mergedAt)}
                  </p>
                ) : null}
                {actionRun.branchDeleted ? (
                  <p className="text-chart-3">Branch deleted</p>
                ) : actionRun.branchDeleteWarning ? (
                  <p className="text-amber-500">{actionRun.branchDeleteWarning}</p>
                ) : null}
                {actionRun.issueClosed ? (
                  <p className="text-chart-3">Issue #{actionRun.issueNumber} closed</p>
                ) : actionRun.issueCloseWarning ? (
                  <p className="text-amber-500">{actionRun.issueCloseWarning}</p>
                ) : null}
              </div>
            ) : null}
            {isClosed ? (
              <p className="pt-2 border-t border-border/30 text-muted-foreground">
                This pull request was closed without merging. No further tracking is available
                for this action run.
              </p>
            ) : null}
          </div>
        ) : null}

        {!isClosed ? (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/40 p-3 text-center">
                <p className="text-2xl font-semibold">{result.changesApplied}</p>
                <p className="text-xs text-muted-foreground mt-1">Changes Applied</p>
              </div>
              <div className="rounded-lg bg-chart-3/5 border border-chart-3/20 p-3 text-center">
                <p className="text-2xl font-semibold text-chart-3">
                  {result.checksPassedCount}
                </p>
                <p className="text-xs text-chart-3 mt-1">Checks Passed</p>
              </div>
              <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-center">
                <p className="text-2xl font-semibold text-destructive">
                  {result.checksFailedCount}
                </p>
                <p className="text-xs text-destructive mt-1">Checks Failed</p>
              </div>
            </div>

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
          </>
        ) : null}

        {isSuccess && isAwaitingReview && (
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
                      <p className="text-sm font-medium text-primary">Open Pull Request</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Review and merge on GitHub, then refresh status here
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

              {onRefreshStatus ? (
                <Button
                  className="w-full"
                  disabled={isRefreshing}
                  onClick={() => void onRefreshStatus()}
                >
                  {isRefreshing ? (
                    <>
                      <Spinner className="mr-2 size-4" />
                      Refreshing…
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 size-4" />
                      Refresh Status
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </div>
        )}

        {isSuccess && !actionRun && (
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

        {isCompleted && completion ? (
          <div className="space-y-3 pt-4 border-t border-border/30">
            {completion.briefing && previousHealthScore !== undefined ? (
              <HealthScoreDelta
                previousScore={previousHealthScore}
                newScore={completion.briefing.repositoryHealth.score}
              />
            ) : null}
            <p className="text-sm font-medium">Next Recommended Actions</p>
            <NextRecommendedActions
              actions={completion.nextActions}
              onExecuteDoc={onExecuteDocSuggestion}
              onFixIssue={onFixIssue}
            />
          </div>
        ) : null}

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

        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/30">
          {isClosed ? (
            <Button asChild variant="outline" className="col-span-2 w-full">
              <Link href="/app">Back to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={onReset} className="w-full">
                Review Again
              </Button>
              <Button asChild className="w-full">
                <Link href="/app">Back to dashboard</Link>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
