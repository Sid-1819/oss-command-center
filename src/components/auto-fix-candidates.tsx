'use client';

import { Wrench, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/section-header';
import {
  DashboardEmptyState,
  type DashboardSectionStateProps,
} from '@/components/dashboard-section-state';
import { normalizeBriefing } from '@/lib/maintainer-briefing-utils';
import type { MaintainerBriefing } from '@/types/maintainer-briefing';

interface AutoFixCandidatesProps extends DashboardSectionStateProps {
  briefing?: MaintainerBriefing;
  onReviewFix?: (issueNumber: number) => void;
}

export default function AutoFixCandidates({
  briefing,
  onReviewFix,
  isLoading,
  isEmpty,
}: AutoFixCandidatesProps) {
  const candidates = briefing ? normalizeBriefing(briefing).autoFixCandidates : [];

  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <SectionHeader
          icon={<Wrench className="size-4" />}
          title="Auto-Fix Candidates"
          description="Low-effort issues MaintainerOS can fix via PR"
          action={
            candidates.length > 0 ? (
              <Badge variant="outline" className="tabular-nums">
                {candidates.length}
              </Badge>
            ) : undefined
          }
        />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : isEmpty || candidates.length === 0 ? (
          <DashboardEmptyState />
        ) : (
          <div className="space-y-2.5">
            {candidates.map((candidate) => (
              <div
                key={candidate.issueNumber}
                className="group list-item-interactive border-l-2 border-l-primary/40"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium">Issue #{candidate.issueNumber}</h3>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {candidate.fixType}
                      </Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {candidate.reason}
                    </p>
                    {candidate.suggestedFiles[0] ? (
                      <p className="mt-1 text-xs text-muted-foreground/80">
                        Target:{' '}
                        <code className="rounded bg-muted px-1">{candidate.suggestedFiles[0]}</code>
                      </p>
                    ) : null}
                  </div>
                  {onReviewFix ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={() => onReviewFix(candidate.issueNumber)}
                    >
                      Review fix
                      <ArrowRight className="ml-1 size-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
