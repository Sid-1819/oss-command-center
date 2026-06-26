'use client';

import {
  Star,
  GitFork,
  AlertCircle,
  GitPullRequest,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/section-header';
import {
  DashboardEmptyState,
  type DashboardSectionStateProps,
} from '@/components/dashboard-section-state';
import { cn } from '@/lib/utils';
import type { MaintainerBriefing } from '@/types/maintainer-briefing';
import type { RepositoryAnalysis } from '@/types/repository-analysis';

function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }

  return value.toLocaleString();
}

interface RepositoryHealthProps extends DashboardSectionStateProps {
  analysis?: RepositoryAnalysis;
  briefing?: MaintainerBriefing;
}

function RepositoryHealthSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}

export default function RepositoryHealth({
  analysis,
  briefing,
  isLoading,
  isEmpty,
}: RepositoryHealthProps) {
  const metrics = analysis
    ? [
        {
          icon: <TrendingUp className="size-4 text-primary" />,
          label: 'Health Score',
          value: String(briefing?.repositoryHealth.score ?? '—'),
          description: briefing?.repositoryHealth.explanation ?? 'Overall repository health',
          iconBg: 'bg-primary/10 ring-primary/20',
        },
        {
          icon: <Star className="size-4 text-chart-3" />,
          label: 'Stars',
          value: formatCount(analysis.repository.stars),
          iconBg: 'bg-chart-3/10 ring-chart-3/20',
        },
        {
          icon: <GitFork className="size-4 text-chart-2" />,
          label: 'Forks',
          value: formatCount(analysis.repository.forks),
          iconBg: 'bg-chart-2/10 ring-chart-2/20',
        },
        {
          icon: <AlertCircle className="size-4 text-chart-4" />,
          label: 'Open Issues',
          value: formatCount(analysis.repository.openIssues),
          description: `${analysis.repository.sampledIssues} recent sampled`,
          iconBg: 'bg-chart-4/10 ring-chart-4/20',
        },
        {
          icon: <GitPullRequest className="size-4 text-primary" />,
          label: 'Pull Requests',
          value: formatCount(analysis.repository.openPullRequests),
          description: `${analysis.repository.sampledPullRequests} recent sampled`,
          iconBg: 'bg-primary/10 ring-primary/20',
        },
      ]
    : [];

  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <SectionHeader
          icon={<Activity className="size-4" />}
          title="Repository Health"
          description="Key metrics at a glance"
        />
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <RepositoryHealthSkeleton />
        ) : isEmpty || !analysis ? (
          <DashboardEmptyState />
        ) : (
          <div className="space-y-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="metric-tile !p-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg ring-1',
                      metric.iconBg
                    )}
                  >
                    {metric.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      {metric.label}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-bold tabular-nums text-foreground">
                        {metric.value}
                      </p>
                      {metric.label === 'Health Score' && (
                        <span className="text-xs text-muted-foreground">/100</span>
                      )}
                    </div>
                  </div>
                  {metric.description && (
                    <p className="shrink-0 max-w-[120px] text-right text-[11px] text-muted-foreground">
                      {metric.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
