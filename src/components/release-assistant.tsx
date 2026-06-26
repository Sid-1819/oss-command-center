'use client';

import { FileText, CheckCircle2, Sparkles, Rocket, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/section-header';
import {
  DashboardEmptyState,
  type DashboardSectionStateProps,
} from '@/components/dashboard-section-state';
import type { MaintainerBriefing } from '@/types/maintainer-briefing';

interface ReleaseAssistantProps extends DashboardSectionStateProps {
  release?: MaintainerBriefing['release'];
}

function ReleaseAssistantSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-16 w-full" />
      <div className="grid grid-cols-2 gap-2.5">
        <Skeleton className="h-8 rounded-lg" />
        <Skeleton className="h-8 rounded-lg" />
      </div>
    </div>
  );
}

export default function ReleaseAssistant({
  release,
  isLoading,
  isEmpty,
}: ReleaseAssistantProps) {
  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <SectionHeader
          icon={<Rocket className="size-4" />}
          title="Release Assistant"
          description="Generate release documentation"
          action={
            release ? (
              <Badge
                className={
                  release.ready
                    ? 'gap-1.5 bg-primary/15 text-primary hover:bg-primary/15'
                    : 'gap-1.5 bg-chart-4/15 text-chart-4 hover:bg-chart-4/15'
                }
              >
                {release.ready ? (
                  <CheckCircle2 className="size-3" />
                ) : (
                  <XCircle className="size-3" />
                )}
                {release.ready ? 'Ready' : 'Not ready'}
              </Badge>
            ) : undefined
          }
        />
      </CardHeader>

      <CardContent className="space-y-5">
        {isLoading ? (
          <ReleaseAssistantSkeleton />
        ) : isEmpty || !release ? (
          <DashboardEmptyState />
        ) : (
          <>
            <div
              className={
                release.ready
                  ? 'relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 ring-1 ring-primary/20'
                  : 'relative overflow-hidden rounded-xl bg-gradient-to-br from-chart-4/10 via-chart-4/5 to-transparent p-4 ring-1 ring-chart-4/20'
              }
            >
              <div
                className={
                  release.ready
                    ? 'absolute -right-4 -top-4 size-24 rounded-full bg-primary/10 blur-2xl'
                    : 'absolute -right-4 -top-4 size-24 rounded-full bg-chart-4/10 blur-2xl'
                }
              />
              <div className="relative flex items-start gap-3">
                <div
                  className={
                    release.ready
                      ? 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/30'
                      : 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-chart-4/20 ring-1 ring-chart-4/30'
                  }
                >
                  {release.ready ? (
                    <CheckCircle2 className="size-5 text-primary" />
                  ) : (
                    <XCircle className="size-5 text-chart-4" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {release.ready ? 'Release Ready' : 'Not Release Ready'}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {release.ready
                      ? 'Project appears stable for a release'
                      : 'Address blockers before releasing'}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">{release.reason}</p>

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="gap-2 border-white/[0.08] bg-secondary/40"
              >
                <FileText className="size-3.5" data-icon="inline-start" />
                Release Notes
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled
                className="gap-2 border-white/[0.08] bg-secondary/40"
              >
                <Sparkles className="size-3.5" data-icon="inline-start" />
                CHANGELOG
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
