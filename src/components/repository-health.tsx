'use client';

import { Star, GitFork, AlertCircle, GitPullRequest, TrendingUp } from 'lucide-react';

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
      icon: <TrendingUp className="w-5 h-5 text-accent-primary" />,
      label: 'Health Score',
      value: '78/100',
      description: 'Overall repository health',
    },
    {
      icon: <Star className="w-5 h-5 text-yellow-400" />,
      label: 'Stars',
      value: '45.2K',
      change: '+2.1K this month',
    },
    {
      icon: <GitFork className="w-5 h-5 text-blue-400" />,
      label: 'Forks',
      value: '8.9K',
      change: '+450 this month',
    },
    {
      icon: <AlertCircle className="w-5 h-5 text-yellow-400" />,
      label: 'Open Issues',
      value: '156',
      description: '12 high priority',
    },
    {
      icon: <GitPullRequest className="w-5 h-5 text-accent-secondary" />,
      label: 'Pull Requests',
      value: '23',
      description: 'Awaiting review',
    },
  ];

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-8">
      <h2 className="text-xl font-bold mb-2">Repository Health</h2>
      <p className="text-sm text-text-muted mb-6">Key metrics at a glance</p>

      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-background/40 rounded-lg p-4 border border-card-border/50">
            <div className="flex items-start gap-3">
              <div className="mt-1">{metric.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1">{metric.label}</p>
                <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                {metric.change && <p className="text-xs text-text-muted mt-2">{metric.change}</p>}
                {metric.description && <p className="text-xs text-text-muted mt-2">{metric.description}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
