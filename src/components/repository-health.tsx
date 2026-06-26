'use client';

import { Star, GitFork, AlertCircle, GitPullRequest, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface MetricItem {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  change?: string;
  description?: string;
}

export default function RepositoryHealth() {
  const metrics: MetricItem[] = [
    {
      icon: <TrendingUp className="size-5 text-primary" />,
      label: 'Health Score',
      value: '78/100',
      description: 'Overall repository health',
    },
    {
      icon: <Star className="size-5 text-amber-500" />,
      label: 'Stars',
      value: '45.2K',
      change: '+2.1K this month',
    },
    {
      icon: <GitFork className="size-5 text-blue-500" />,
      label: 'Forks',
      value: '8.9K',
      change: '+450 this month',
    },
    {
      icon: <AlertCircle className="size-5 text-amber-500" />,
      label: 'Open Issues',
      value: '156',
      description: '12 high priority',
    },
    {
      icon: <GitPullRequest className="size-5 text-primary" />,
      label: 'Pull Requests',
      value: '23',
      description: 'Awaiting review',
    },
  ];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Repository Health</CardTitle>
        <CardDescription>Key metrics at a glance</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-secondary rounded-lg p-4 border border-border">
              <div className="flex items-start gap-3">
                <div className="mt-1">{metric.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{metric.label}</p>
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                  {metric.change && <p className="text-xs text-muted-foreground mt-2">{metric.change}</p>}
                  {metric.description && <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
