'use client';

import { Search, Settings, MoreVertical, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

function MaintenanceInbox() {
  const tasks = [
    {
      id: 1,
      title: 'Critical: Security vulnerability in dependencies',
      repository: 'vercel/v0',
      type: 'security',
      priority: 'critical',
      time: '2 hours ago',
    },
    {
      id: 2,
      title: 'Review: Add TypeScript 5.2 support',
      repository: 'shadcn/ui',
      type: 'review',
      priority: 'high',
      time: '4 hours ago',
    },
    {
      id: 3,
      title: 'Release: v2.0 ready for deployment',
      repository: 'nextjs/next.js',
      type: 'release',
      priority: 'high',
      time: '1 day ago',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'high':
        return 'bg-accent/10 text-accent border-accent/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="group glass-panel glass-panel-hover p-5 border border-white/5 cursor-pointer"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getPriorityColor(task.priority)}`}>
                  {task.priority.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">{task.time}</span>
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1 group-hover:text-primary transition-colors">
                {task.title}
              </h3>
              <p className="text-xs text-muted-foreground">{task.repository}</p>
            </div>
            <button className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function RepositorySnapshot() {
  const stats = [
    { label: 'Repositories', value: '12', trend: '+2' },
    { label: 'Open Issues', value: '48', trend: '-5' },
    { label: 'Open PRs', value: '23', trend: '+3' },
    { label: 'Health Score', value: '94%', trend: '+2%' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, index) => (
        <div key={index} className="glass-panel p-4 border border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs text-chart-3">
                <TrendingUp className="w-3 h-3" />
                <span>{stat.trend}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AIBriefing() {
  const briefing = [
    'You have 3 repositories with unreviewed PRs requiring your attention',
    'Security scan found 1 high-severity vulnerability across your ecosystem',
    '2 releases are ready for deployment; recommend deploying v2.0 today',
    'Documentation drift detected in 4 repositories; sync recommended',
  ];

  return (
    <div className="glass-panel p-6 border border-white/5 space-y-4">
      <div className="space-y-3">
        {briefing.map((item, index) => (
          <div key={index} className="flex gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            <p className="text-sm text-foreground leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Workspace() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/5 sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Workspace</h1>
              <p className="text-xs text-muted-foreground mt-1">Manage your repositories and maintenance tasks</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <Button variant="ghost" size="icon">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Top Section: Maintenance Inbox + Repository Snapshot */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Maintenance Inbox - 2 cols */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Maintenance Inbox</h2>
              <p className="text-xs text-muted-foreground">What needs your attention today</p>
            </div>
            <MaintenanceInbox />
          </div>

          {/* Repository Snapshot - 1 col */}
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-1">Repository Snapshot</h2>
              <p className="text-xs text-muted-foreground">Key metrics at a glance</p>
            </div>
            <RepositorySnapshot />
          </div>
        </div>

        {/* Bottom Section: AI Briefing */}
        <div className="max-w-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-1">AI Briefing</h2>
            <p className="text-xs text-muted-foreground">Personalized insights and recommendations</p>
          </div>
          <AIBriefing />
        </div>
      </main>
    </div>
  );
}
