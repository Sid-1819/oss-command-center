'use client';

import { Code2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/section-header';
import {
  DashboardEmptyState,
  type DashboardSectionStateProps,
} from '@/components/dashboard-section-state';
import { PreviewListDialog } from '@/components/preview-list-dialog';
import { GitHubExternalLinkRow } from '@/components/github-external-link-row';
import { buildGitHubIssueUrl } from '@/lib/github/links';
import type { MaintainerBriefing } from '@/types/maintainer-briefing';
import type { RepositoryAnalysis } from '@/types/repository-analysis';

interface ContributorOpportunitiesProps extends DashboardSectionStateProps {
  opportunities?: MaintainerBriefing['contributorOpportunities'];
  issues?: RepositoryAnalysis['issues'];
  repository?: RepositoryAnalysis['repository'];
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
  repository,
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
          <PreviewListDialog
            items={opportunities}
            dialogTitle="All contributor opportunities"
            emptyMessage="No contributor opportunities identified."
            getItemKey={(opportunity, index) => `${opportunity.issueNumber}-${index}`}
            renderItem={(opportunity) => {
              const title =
                issueTitleByNumber.get(opportunity.issueNumber) ??
                `Issue #${opportunity.issueNumber}`;
              const href = repository
                ? buildGitHubIssueUrl(
                    repository.owner,
                    repository.name,
                    opportunity.issueNumber,
                  )
                : null;

              const content = (
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
              );

              if (href) {
                return <GitHubExternalLinkRow href={href}>{content}</GitHubExternalLinkRow>;
              }

              return <div className="list-item-interactive">{content}</div>;
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
