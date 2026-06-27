'use client';

import { GitPullRequest, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

function MergeQueueSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-16 rounded-xl" />
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
  const topPRs = [
    {
      id: 1,
      title: 'Fix critical security vulnerability',
      author: 'security-bot',
      priority: 'urgent',
      reviews: 2,
    },
    {
      id: 2,
      title: 'Add TypeScript support improvements',
      author: 'contributor-a',
      priority: 'high',
      reviews: 1,
    },
    {
      id: 3,
      title: 'Update dependencies to latest versions',
      author: 'dependabot',
      priority: 'medium',
      reviews: 0,
    },
  ];

  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <SectionHeader
          icon={<GitPullRequest className="size-4" />}
          title="Merge Queue"
          description="Top 3 AI-prioritized PRs"
          action={
            pullRequests > 0 ? (
              <Badge variant="outline" className="border-white/[0.08] bg-secondary/50 tabular-nums">
                {pullRequests} total
              </Badge>
            ) : undefined
          }
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
          <div className="space-y-2.5">
            {topPRs.map((pr) => (
              <div
                key={pr.id}
                className="group list-item-interactive border-l-2 border-l-primary/40"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                    <GitPullRequest className="size-4 text-primary" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-start justify-between gap-3">
                      <h3 className="text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                        {pr.title}
                      </h3>
                      <Badge
                        variant={
                          pr.priority === 'urgent'
                            ? 'destructive'
                            : pr.priority === 'high'
                              ? 'secondary'
                              : 'outline'
                        }
                        className="shrink-0 capitalize"
                      >
                        {pr.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{pr.author}</span>
                      <span>•</span>
                      <span>{pr.reviews} review{pr.reviews !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
