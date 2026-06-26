'use client';

import { Star, GitFork, AlertCircle, GitPullRequest, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SectionHeader } from '@/components/section-header';
import { cn } from '@/lib/utils';

interface MetricItem {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: string;
  description?: string;
  iconBg?: string;
}

export default function RepositoryHealth() {
  const metrics: MetricItem[] = [
    {
      icon: <TrendingUp className="size-4 text-primary" />,
      label: 'Health Score',
      value: '78',
      description: 'Overall repository health',
      iconBg: 'bg-primary/10 ring-primary/20',
    },
    {
      icon: <Star className="size-4 text-chart-3" />,
      label: 'Stars',
      value: '45.2K',
      change: '+2.1K this month',
      iconBg: 'bg-chart-3/10 ring-chart-3/20',
    },
    {
      icon: <GitFork className="size-4 text-chart-2" />,
      label: 'Forks',
      value: '8.9K',
      change: '+450 this month',
      iconBg: 'bg-chart-2/10 ring-chart-2/20',
    },
    {
      icon: <AlertCircle className="size-4 text-chart-4" />,
      label: 'Open Issues',
      value: '156',
      description: '12 high priority',
      iconBg: 'bg-chart-4/10 ring-chart-4/20',
    },
    {
      icon: <GitPullRequest className="size-4 text-primary" />,
      label: 'Pull Requests',
      value: '23',
      description: 'Awaiting review',
      iconBg: 'bg-primary/10 ring-primary/20',
    },
  ];

  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <SectionHeader
          icon={<Activity className="size-4" />}
          title="Repository Health"
          description="Key metrics at a glance"
        />
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {metrics.map((metric, index) => (
            <div
              key={metric.label}
              className={cn(
                'metric-tile !p-3.5 animate-in fade-in slide-in-from-right-2 fill-mode-backwards'
              )}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg ring-1',
                    metric.iconBg
                  )}
                >
                  {metric.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {metric.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-bold tabular-nums text-foreground">{metric.value}</p>
                    {metric.label === 'Health Score' && (
                      <span className="text-xs text-muted-foreground">/100</span>
                    )}
                  </div>
                </div>
                {(metric.change || metric.description) && (
                  <p className="shrink-0 text-right text-[11px] text-muted-foreground">
                    {metric.change ?? metric.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
