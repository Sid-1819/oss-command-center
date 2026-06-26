'use client';

import { Code2, ArrowRight, Users } from 'lucide-react';
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
import type { RepositoryAnalysis } from '@/types/repository-analysis';

interface ContributorOpportunitiesProps extends DashboardSectionStateProps {
  opportunities?: MaintainerBriefing['contributorOpportunities'];
  issues?: RepositoryAnalysis['issues'];
}

function ContributorOpportunitiesSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}

export default function ContributorOpportunities({
  opportunities = [],
  issues = [],
  isLoading,
  isEmpty,
}: ContributorOpportunitiesProps) {
  const issueTitleByNumber = new Map(
    issues.map((issue) => [issue.number, issue.title] as const)
  );

  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <SectionHeader
          icon={<Users className="size-4" />}
          title="Contributor Opportunities"
          description="Beginner-friendly issues to invite contributors"
          action={
            opportunities.length > 0 ? (
              <Badge variant="outline" className="gap-1 border-white/[0.08] bg-secondary/50">
                <Code2 className="size-3" />
                {opportunities.length} open
              </Badge>
            ) : undefined
          }
        />
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <ContributorOpportunitiesSkeleton />
        ) : isEmpty ? (
          <DashboardEmptyState />
        ) : opportunities.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No contributor opportunities identified.
          </p>
        ) : (
          <div className="space-y-2.5">
            {opportunities.map((opportunity, index) => {
              const title =
                issueTitleByNumber.get(opportunity.issueNumber) ??
                `Issue #${opportunity.issueNumber}`;

              return (
                <div
                  key={`${opportunity.issueNumber}-${index}`}
                  className="group list-item-interactive"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground ring-1 ring-white/[0.06]">
                          #{opportunity.issueNumber}
                        </span>
                        <h3 className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                          {title}
                        </h3>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {opportunity.reason}
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
