'use client';

import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
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
import {
  buildGitHubIssueUrl,
  getSecurityIssuesFromAnalysis,
  type SecurityIssueItem,
} from '@/lib/github/links';
import type { RepositoryAnalysis } from '@/types/repository-analysis';

interface SecurityOverviewProps extends DashboardSectionStateProps {
  analysis?: RepositoryAnalysis;
}

function SecurityOverviewSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}

const severityConfig = {
  critical: {
    borderColor: 'border-l-destructive/60',
    bgColor: 'bg-destructive/5',
    ringColor: 'ring-destructive/20',
    badgeVariant: 'destructive' as const,
    icon: <AlertTriangle className="size-4 text-destructive" />,
  },
  high: {
    borderColor: 'border-l-chart-4/60',
    bgColor: 'bg-chart-4/5',
    ringColor: 'ring-chart-4/20',
    badgeVariant: 'secondary' as const,
    icon: <AlertTriangle className="size-4 text-chart-4" />,
  },
  medium: {
    borderColor: 'border-l-chart-3/60',
    bgColor: 'bg-chart-3/5',
    ringColor: 'ring-chart-3/20',
    badgeVariant: 'outline' as const,
    icon: <AlertTriangle className="size-4 text-chart-3" />,
  },
  low: {
    borderColor: 'border-l-primary/40',
    bgColor: 'bg-primary/5',
    ringColor: 'ring-primary/20',
    badgeVariant: 'outline' as const,
    icon: <CheckCircle className="size-4 text-primary" />,
  },
};

function renderSecurityIssue(
  issue: SecurityIssueItem,
  repository?: RepositoryAnalysis['repository'],
) {
  const config = severityConfig[issue.severity];
  const href = repository
    ? buildGitHubIssueUrl(repository.owner, repository.name, issue.issueNumber)
    : null;

  const content = (
    <>
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary/50 ring-1 ring-white/[0.06]">
        {config.icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-start justify-between gap-3">
          <h3 className="text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
            {issue.title}
          </h3>
          <Badge variant={config.badgeVariant} className="shrink-0 capitalize text-xs">
            {issue.severity}
          </Badge>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{issue.description}</p>
      </div>
    </>
  );

  const className = `rounded-lg border-l-2 ${config.borderColor} ${config.bgColor} ring-1 ${config.ringColor} p-3`;

  if (href) {
    return (
      <GitHubExternalLinkRow href={href} variant="outline" className={className}>
        {content}
      </GitHubExternalLinkRow>
    );
  }

  return <div className={className}>{content}</div>;
}

function renderHealthyState() {
  const config = severityConfig.low;

  return (
    <div
      className={`rounded-lg border-l-2 ${config.borderColor} ${config.bgColor} ring-1 ${config.ringColor} p-3`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary/50 ring-1 ring-white/[0.06]">
          {config.icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-start justify-between gap-3">
            <h3 className="text-sm font-medium leading-snug text-foreground">
              No open security-labeled issues
            </h3>
            <Badge variant={config.badgeVariant} className="shrink-0 capitalize text-xs">
              healthy
            </Badge>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            No sampled open issues matched security or vulnerability labels.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SecurityOverview({
  analysis,
  isLoading,
  isEmpty,
}: SecurityOverviewProps) {
  const showContent = !isEmpty && !isLoading && analysis;
  const securityIssues: SecurityIssueItem[] = showContent
    ? getSecurityIssuesFromAnalysis(analysis)
    : [];

  const criticalCount = securityIssues.filter((issue) => issue.severity === 'critical').length;
  const highCount = securityIssues.filter((issue) => issue.severity === 'high').length;

  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <SectionHeader
          icon={<Shield className="size-4" />}
          title="Security Overview"
          description="Vulnerabilities & compliance checks"
          action={
            showContent ? (
              <Badge
                variant={
                  criticalCount > 0 ? 'destructive' : highCount > 0 ? 'secondary' : 'outline'
                }
                className="border-white/[0.08] tabular-nums"
              >
                {criticalCount > 0
                  ? `${criticalCount} critical`
                  : highCount > 0
                    ? `${highCount} high`
                    : securityIssues.length > 0
                      ? `${securityIssues.length} open`
                      : 'Healthy'}
              </Badge>
            ) : undefined
          }
        />
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <SecurityOverviewSkeleton />
        ) : isEmpty ? (
          <DashboardEmptyState />
        ) : securityIssues.length === 0 ? (
          renderHealthyState()
        ) : (
          <PreviewListDialog
            items={securityIssues}
            dialogTitle="All security issues"
            getItemKey={(issue) => String(issue.issueNumber)}
            listClassName="space-y-3"
            renderItem={(issue) => renderSecurityIssue(issue, analysis?.repository)}
          />
        )}
      </CardContent>
    </Card>
  );
}
