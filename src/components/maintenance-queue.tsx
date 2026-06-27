'use client';

import { CheckSquare, FileText, ArrowRight, Book, GitCommit, Wrench } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/section-header';
import {
  DashboardEmptyState,
  type DashboardSectionStateProps,
} from '@/components/dashboard-section-state';
import type { MaintainerBriefing } from '@/types/maintainer-briefing';

interface MaintenanceQueueProps extends DashboardSectionStateProps {
  release?: MaintainerBriefing['release'];
  documentation?: MaintainerBriefing['documentation'];
  onUpdateReadme?: (suggestion: string) => void;
}

function MaintenanceQueueSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}

interface MaintenanceTask {
  id: string;
  title: string;
  description: string;
  type: 'readme' | 'changelog' | 'release' | 'build';
  icon: React.ReactNode;
  action?: string;
  actionCallback?: () => void;
}

export default function MaintenanceQueue({
  release,
  documentation,
  onUpdateReadme,
  isLoading,
  isEmpty,
}: MaintenanceQueueProps) {
  const maintenanceTasks: MaintenanceTask[] = [
    {
      id: 'readme',
      title: 'README Needs Update',
      description: documentation?.suggestions?.[0] ?? 'Update documentation to reflect latest changes',
      type: 'readme',
      icon: <FileText className="size-4 text-chart-2" />,
      action: 'Review & Update',
      actionCallback: () => {
        if (documentation?.suggestions?.[0] && onUpdateReadme) {
          onUpdateReadme(documentation.suggestions[0]);
        }
      },
    },
    {
      id: 'changelog',
      title: 'CHANGELOG Maintenance',
      description: 'Add entries for recent releases and bug fixes',
      type: 'changelog',
      icon: <Book className="size-4 text-chart-3" />,
      action: 'Update Log',
    },
    {
      id: 'release',
      title: release?.suggestion ?? 'Prepare Release',
      description: release?.explanation ?? 'Review and publish the next version',
      type: 'release',
      icon: <GitCommit className="size-4 text-primary" />,
      action: 'Start Release',
    },
  ];

  const taskCount = maintenanceTasks.filter((t) => !isEmpty).length;

  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <SectionHeader
          icon={<Wrench className="size-4" />}
          title="AI Maintenance Queue"
          description="README, CHANGELOG, Release tasks"
          action={
            taskCount > 0 ? (
              <Badge variant="outline" className="border-white/[0.08] bg-secondary/50 tabular-nums">
                {taskCount} tasks
              </Badge>
            ) : undefined
          }
        />
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <MaintenanceQueueSkeleton />
        ) : isEmpty ? (
          <DashboardEmptyState />
        ) : (
          <div className="space-y-2.5">
            {maintenanceTasks.map((task) => (
              <div
                key={task.id}
                className="group list-item-interactive border-l-2 border-l-chart-2/40"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary ring-1 ring-white/[0.06]">
                    {task.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-start justify-between gap-3">
                      <h3 className="text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                        {task.title}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-xs capitalize"
                      >
                        {task.type}
                      </Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {task.description}
                    </p>
                  </div>

                  {task.action && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={task.actionCallback}
                    >
                      <ArrowRight className="size-4" />
                    </Button>
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
