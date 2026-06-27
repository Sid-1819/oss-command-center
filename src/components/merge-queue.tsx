'use client';

import { GitPullRequest, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/section-header';
import {
  DashboardEmptyState,
  type DashboardSectionStateProps,
} from '@/components/dashboard-section-state';

interface MergeQueueProps extends DashboardSectionStateProps {
  pullRequests?: number;
}

interface PR {
  number: number;
  status: 'ready' | 'review' | 'blocked';
  readiness?: number; // 0-100
  reasons?: string[];
  blockers?: string[];
}

function MergeQueueSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-20 rounded-lg" />
      ))}
    </div>
  );
}

export default function MergeQueue({
  pullRequests = 0,
  isLoading,
  isEmpty,
}: MergeQueueProps) {
  // Mock top 3 PRs for demonstration
  const topPRs: PR[] = [
    {
      number: 58,
      status: 'ready',
      readiness: 98,
      reasons: ['CI Passed', 'Approved', 'No conflicts'],
    },
    {
      number: 54,
      status: 'review',
    },
    {
      number: 48,
      status: 'blocked',
      blockers: ['Waiting for maintainer approval', 'CI check failed'],
    },
  ];

  const getStatusIcon = (status: PR['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle2 className="size-4 text-primary" />;
      case 'review':
        return <AlertCircle className="size-4 text-chart-2" />;
      case 'blocked':
        return <Lock className="size-4 text-destructive" />;
    }
  };

  const getStatusLabel = (status: PR['status']) => {
    switch (status) {
      case 'ready':
        return 'Merge Readiness';
      case 'review':
        return 'Needs review';
      case 'blocked':
        return 'Blocked';
    }
  };

  return (
    <Card className="glass-panel border-0">
      <CardHeader className="pb-3">
        <SectionHeader
          icon={<GitPullRequest className="size-4" />}
          title="Merge Queue"
        />
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <MergeQueueSkeleton />
        ) : isEmpty ? (
          <DashboardEmptyState />
        ) : pullRequests === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No open pull requests in the merge queue.
          </p>
        ) : (
          <div className="space-y-0.5">
            {topPRs.map((pr, index) => (
              <div key={pr.number}>
                <div className="space-y-2 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(pr.status)}
                      <span className="text-sm font-medium">PR #{pr.number}</span>
                    </div>
                  </div>

                  {pr.status === 'ready' && (
                    <div className="space-y-2 pl-6">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Merge Readiness</span>
                        <span className="font-medium text-foreground">{pr.readiness}%</span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">Reason</div>
                        <div className="space-y-1">
                          {pr.reasons?.map((reason, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-foreground">
                              <span className="text-primary">✓</span>
                              <span>{reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        className="mt-2 w-full gap-2"
                      >
                        <span>⚡</span>
                        Merge
                      </Button>
                    </div>
                  )}

                  {pr.status === 'review' && (
                    <div className="pl-6">
                      <p className="text-xs text-muted-foreground">Needs review</p>
                    </div>
                  )}

                  {pr.status === 'blocked' && (
                    <div className="space-y-2 pl-6">
                      <div className="space-y-1">
                        {pr.blockers?.map((blocker, i) => (
                          <div key={i} className="text-xs text-muted-foreground">
                            • {blocker}
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs font-medium text-primary hover:text-primary hover:bg-transparent"
                      >
                        Show blockers
                      </Button>
                    </div>
                  )}
                </div>

                {index < topPRs.length - 1 && (
                  <div className="border-t border-border/40" />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
