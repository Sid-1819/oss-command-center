'use client';

import { Zap, Bot, Clock, Calendar, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/section-header';
import {
  DashboardEmptyState,
  type DashboardSectionStateProps,
} from '@/components/dashboard-section-state';
import { countAiAutomatableTasks } from '@/lib/maintainer-briefing-utils';
import type { MaintainerBriefing } from '@/types/maintainer-briefing';

function estimateMaintenanceMinutes(
  priorities: MaintainerBriefing['priorities']
): number | null {
  if (priorities.length === 0) {
    return null;
  }

  const weights = { high: 15, medium: 10, low: 5 };

  return priorities.reduce(
    (total, priority) => total + weights[priority.priority],
    0
  );
}

interface MaintainerBriefingProps extends DashboardSectionStateProps {
  briefing?: MaintainerBriefing;
  analyzedAt?: string;
}

function MaintainerBriefingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
      </div>
    </div>
  );
}

export default function MaintainerBriefing({
  briefing,
  analyzedAt,
  isLoading,
  isEmpty,
}: MaintainerBriefingProps) {
  const highPriorityCount =
    briefing?.priorities.filter((item) => item.priority === 'high').length ?? 0;
  const maintenanceMinutes = briefing
    ? estimateMaintenanceMinutes(briefing.priorities)
    : null;
  const aiReadyTaskCount = briefing ? countAiAutomatableTasks(briefing) : 0;
  const healthScore = briefing?.repositoryHealth.score ?? 0;
  const isHealthy = healthScore >= 70;

  return (
    <Card className="glass-panel section-glow overflow-visible border-0 [--card-spacing:--spacing(6)]">
      <CardHeader className="pb-0">
        <SectionHeader
          icon={<Sparkles className="size-4" />}
          title="Maintainer Briefing"
          description="AI-generated analysis and recommendations for your repository"
          action={
            analyzedAt ? (
              <Badge
                variant="outline"
                className="shrink-0 gap-1.5 border-white/[0.08] bg-secondary/50 text-muted-foreground"
              >
                <Calendar className="size-3" />
                {formatDistanceToNow(new Date(analyzedAt), { addSuffix: true })}
              </Badge>
            ) : undefined
          }
        />
      </CardHeader>

      <CardContent className="pt-6">
        {isLoading ? (
          <MaintainerBriefingSkeleton />
        ) : isEmpty || !briefing ? (
          <DashboardEmptyState />
        ) : (
          <>
            <div className="mb-8 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 p-5 ring-1 ring-white/[0.06]">
              <p className="text-[15px] leading-relaxed text-foreground/90">
                {briefing.summary}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="metric-tile">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                    <Bot className="size-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    AI-ready tasks
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tabular-nums">{aiReadyTaskCount}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Issues and doc updates MaintainerOS can draft PRs for
                </p>
              </div>

              <div className="metric-tile">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-chart-2/10 ring-1 ring-chart-2/20">
                    <Clock className="size-4 text-chart-2" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Est. Maintenance Time
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tabular-nums">
                    {maintenanceMinutes ?? '—'}
                  </span>
                  {maintenanceMinutes !== null && (
                    <span className="text-sm text-muted-foreground">min</span>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  To address today&apos;s priorities
                </p>
              </div>

              <div className="metric-tile">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                    <Zap className="size-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-foreground">
                    {isHealthy ? 'Active' : 'Needs attention'}
                  </span>
                  <Badge
                    className={
                      isHealthy
                        ? 'bg-primary/15 text-primary hover:bg-primary/15'
                        : 'bg-chart-4/15 text-chart-4 hover:bg-chart-4/15'
                    }
                  >
                    {isHealthy ? 'Healthy' : 'At risk'}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {highPriorityCount > 0
                    ? `${highPriorityCount} high-priority item${highPriorityCount === 1 ? '' : 's'} awaiting`
                    : 'No high-priority items'}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
