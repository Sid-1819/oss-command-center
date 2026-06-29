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
import { PreviewListDialog } from '@/components/preview-list-dialog';
import type { DocumentationFileSuggestion, MaintainerBriefing } from '@/types/maintainer-briefing';

interface MaintenanceQueueProps extends DashboardSectionStateProps {
  release?: MaintainerBriefing['release'];
  documentation?: MaintainerBriefing['documentation'];
  onUpdateDoc?: (targetFile: string, suggestion: string) => void;
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
  type: string;
  icon: React.ReactNode;
  action?: string;
  actionCallback?: () => void;
}

function iconForFile(path: string) {
  const lower = path.toLowerCase();
  if (lower.includes('changelog')) return <Book className="size-4 text-chart-3" />;
  if (lower.includes('contributing')) return <CheckSquare className="size-4 text-chart-4" />;
  return <FileText className="size-4 text-chart-2" />;
}

function buildDocTasks(
  files: DocumentationFileSuggestion[],
  onUpdateDoc?: (targetFile: string, suggestion: string) => void,
): MaintenanceTask[] {
  const tasks: MaintenanceTask[] = [];

  for (const file of files) {
    const suggestion = file.suggestions[0];
    if (!suggestion) continue;

    tasks.push({
      id: `doc-${file.path}`,
      title: `${file.path} needs update`,
      description: suggestion,
      type: file.path.replace(/\.md$/i, '').toLowerCase(),
      icon: iconForFile(file.path),
      action: 'Review & Update',
      actionCallback: () => onUpdateDoc?.(file.path, suggestion),
    });
  }

  return tasks;
}

export default function MaintenanceQueue({
  release,
  documentation,
  onUpdateDoc,
  isLoading,
  isEmpty,
}: MaintenanceQueueProps) {
  const docTasks = buildDocTasks(documentation?.files ?? [], onUpdateDoc);

  const maintenanceTasks: MaintenanceTask[] = [
    ...docTasks,
    {
      id: 'release',
      title: release?.ready ? 'Release Ready' : 'Prepare Release',
      description: release?.reason ?? 'Review and publish the next version',
      type: 'release',
      icon: <GitCommit className="size-4 text-primary" />,
      action: 'Start Release',
    },
  ];

  const taskCount = isEmpty ? 0 : maintenanceTasks.length;

  return (
    <Card className="dashboard-section-card">
      <CardHeader>
        <SectionHeader
          icon={<Wrench className="size-4" />}
          title="AI Maintenance Queue"
          description="Documentation and release tasks"
          action={
            taskCount > 0 ? (
              <Badge variant="outline" className="border-white/[0.08] tabular-nums">
                {taskCount} tasks
              </Badge>
            ) : undefined
          }
        />
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <MaintenanceQueueSkeleton />
        ) : isEmpty || maintenanceTasks.length === 0 ? (
          <DashboardEmptyState />
        ) : (
          <PreviewListDialog
            items={maintenanceTasks}
            dialogTitle="All maintenance tasks"
            getItemKey={(task) => task.id}
            renderItem={(task) => (
              <div
                role={task.actionCallback ? 'button' : undefined}
                tabIndex={task.actionCallback ? 0 : undefined}
                className={`group dashboard-list-item border-l-2 border-l-chart-2/40${
                  task.actionCallback ? ' cursor-pointer' : ''
                }`}
                onClick={task.actionCallback ? task.actionCallback : undefined}
                onKeyDown={
                  task.actionCallback
                    ? (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          task.actionCallback?.();
                        }
                      }
                    : undefined
                }
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-foreground/6">
                    {task.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-start justify-between gap-3">
                      <h3 className="text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                        {task.title}
                      </h3>
                      <Badge variant="secondary" className="shrink-0 text-xs capitalize">
                        {task.type}
                      </Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {task.description}
                    </p>
                  </div>

                  {task.action && task.actionCallback ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        task.actionCallback?.();
                      }}
                    >
                      <ArrowRight className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
}
