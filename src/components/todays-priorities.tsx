'use client';

import { AlertCircle, AlertOctagon, ArrowRight, ListTodo } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/section-header';
import {
  DashboardEmptyState,
  type DashboardSectionStateProps,
} from '@/components/dashboard-section-state';
import { cn } from '@/lib/utils';
import type { MaintainerBriefing } from '@/types/maintainer-briefing';

const priorityConfig = {
  high: {
    variant: 'destructive' as const,
    icon: AlertOctagon,
    accent: 'border-l-destructive/60',
    dot: 'bg-destructive',
  },
  medium: {
    variant: 'secondary' as const,
    icon: AlertCircle,
    accent: 'border-l-chart-3/60',
    dot: 'bg-chart-3',
  },
  low: {
    variant: 'outline' as const,
    icon: AlertCircle,
    accent: 'border-l-muted-foreground/40',
    dot: 'bg-muted-foreground',
  },
};

interface TodaysPrioritiesProps extends DashboardSectionStateProps {
  priorities?: MaintainerBriefing['priorities'];
}

function TodaysPrioritiesSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}

export default function TodaysPriorities({
  priorities = [],
  isLoading,
  isEmpty,
}: TodaysPrioritiesProps) {
  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <SectionHeader
          icon={<ListTodo className="size-4" />}
          title="Today's Priorities"
          description="Ranked by impact and urgency"
          action={
            priorities.length > 0 ? (
              <Badge variant="outline" className="border-white/[0.08] bg-secondary/50 tabular-nums">
                {priorities.length} items
              </Badge>
            ) : undefined
          }
        />
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <TodaysPrioritiesSkeleton />
        ) : isEmpty ? (
          <DashboardEmptyState />
        ) : priorities.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No priorities identified for this repository.
          </p>
        ) : (
          <div className="space-y-2.5">
            {priorities.map((item, index) => {
              const config = priorityConfig[item.priority];
              const Icon = config.icon;

              return (
                <div
                  key={`${item.title}-${index}`}
                  className={cn('group list-item-interactive border-l-2', config.accent)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary ring-1 ring-white/[0.06]">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-start justify-between gap-3">
                        <h3 className="text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                          {item.title}
                        </h3>
                        <Badge variant={config.variant} className="shrink-0 capitalize">
                          <span className={cn('mr-1 size-1.5 rounded-full', config.dot)} />
                          {item.priority}
                        </Badge>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {item.reason}
                      </p>
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
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
