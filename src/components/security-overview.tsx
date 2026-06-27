'use client';

import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/section-header';
import {
  DashboardEmptyState,
  type DashboardSectionStateProps,
} from '@/components/dashboard-section-state';
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

interface SecurityIssue {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  icon: React.ReactNode;
}

export default function SecurityOverview({
  analysis,
  isLoading,
  isEmpty,
}: SecurityOverviewProps) {
  // Mock security issues for demonstration
  const securityIssues: SecurityIssue[] = [
    {
      id: 'deps',
      title: 'Outdated Dependencies',
      severity: 'high',
      description: '8 packages with known vulnerabilities detected',
      icon: <AlertTriangle className="size-4" />,
    },
    {
      id: 'license',
      title: 'License Compliance',
      severity: 'medium',
      description: 'Review GPL-licensed dependencies',
      icon: <Clock className="size-4" />,
    },
    {
      id: 'secure',
      title: 'Security Scanning',
      severity: 'low',
      description: 'No critical vulnerabilities found',
      icon: <CheckCircle className="size-4" />,
    },
  ];

  const criticalCount = securityIssues.filter((i) => i.severity === 'critical').length;
  const highCount = securityIssues.filter((i) => i.severity === 'high').length;

  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <SectionHeader
          icon={<Shield className="size-4" />}
          title="Security Overview"
          description="Vulnerabilities & compliance checks"
          action={
            securityIssues.length > 0 ? (
              <Badge
                variant={criticalCount > 0 ? 'destructive' : highCount > 0 ? 'secondary' : 'outline'}
                className="border-white/[0.08] tabular-nums"
              >
                {criticalCount > 0
                  ? `${criticalCount} critical`
                  : highCount > 0
                    ? `${highCount} high`
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
        ) : (
          <div className="space-y-3">
            {securityIssues.map((issue) => {
              const severityConfig = {
                critical: {
                  borderColor: 'border-l-destructive/60',
                  bgColor: 'bg-destructive/5',
                  ringColor: 'ring-destructive/20',
                  badgeVariant: 'destructive' as const,
                },
                high: {
                  borderColor: 'border-l-chart-4/60',
                  bgColor: 'bg-chart-4/5',
                  ringColor: 'ring-chart-4/20',
                  badgeVariant: 'secondary' as const,
                },
                medium: {
                  borderColor: 'border-l-chart-3/60',
                  bgColor: 'bg-chart-3/5',
                  ringColor: 'ring-chart-3/20',
                  badgeVariant: 'outline' as const,
                },
                low: {
                  borderColor: 'border-l-primary/40',
                  bgColor: 'bg-primary/5',
                  ringColor: 'ring-primary/20',
                  badgeVariant: 'outline' as const,
                },
              };

              const config = severityConfig[issue.severity];

              return (
                <div
                  key={issue.id}
                  className={`rounded-lg border-l-2 ${config.borderColor} ${config.bgColor} ring-1 ${config.ringColor} p-3`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary/50 ring-1 ring-white/[0.06]">
                      {issue.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-start justify-between gap-3">
                        <h3 className="text-sm font-medium leading-snug text-foreground">
                          {issue.title}
                        </h3>
                        <Badge variant={config.badgeVariant} className="shrink-0 capitalize text-xs">
                          {issue.severity}
                        </Badge>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {issue.description}
                      </p>
                    </div>

                    {issue.severity !== 'low' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-7 text-xs"
                      >
                        Review
                      </Button>
                    )}
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
