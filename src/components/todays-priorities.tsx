'use client';

import { AlertCircle, AlertOctagon, AlertCircle as AlertLow, ArrowRight } from 'lucide-react';

interface PriorityItem {
  id: string;
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

const priorities: PriorityItem[] = [
  {
    id: '1',
    title: 'Review PR #421 - Add streaming support',
    reason: 'Critical performance improvement awaiting final review. 3 maintainers requested changes.',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Update README after merged features',
    reason: 'Recent feature merges (hydration, RSC) not documented in quickstart guide.',
    priority: 'medium',
  },
  {
    id: '3',
    title: 'Triage 12 new issues',
    reason: 'Issues queue growing. Most are support questions needing initial response.',
    priority: 'medium',
  },
  {
    id: '4',
    title: 'Label Issue #231 as "Good First Issue"',
    reason: 'Great beginner-friendly task for new contributors. Well scoped and documented.',
    priority: 'low',
  },
];

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'border-red-500/30 bg-red-500/5';
    case 'medium':
      return 'border-yellow-500/30 bg-yellow-500/5';
    case 'low':
      return 'border-blue-500/30 bg-blue-500/5';
    default:
      return 'border-card-border bg-background/40';
  }
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'high':
      return <AlertOctagon className="w-5 h-5 text-red-400" />;
    case 'medium':
      return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    case 'low':
      return <AlertLow className="w-5 h-5 text-blue-400" />;
    default:
      return null;
  }
}

function getPriorityBadge(priority: string) {
  const baseClass = 'px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide';
  switch (priority) {
    case 'high':
      return `${baseClass} bg-red-500/20 text-red-300`;
    case 'medium':
      return `${baseClass} bg-yellow-500/20 text-yellow-300`;
    case 'low':
      return `${baseClass} bg-blue-500/20 text-blue-300`;
    default:
      return `${baseClass} bg-card-border text-text-muted`;
  }
}

export default function TodaysPriorities() {
  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-8">
      <h2 className="text-xl font-bold mb-2">Today&apos;s Priorities</h2>
      <p className="text-sm text-text-muted mb-6">Ranked by impact and urgency</p>

      <div className="space-y-4">
        {priorities.map((item) => (
          <div
            key={item.id}
            className={`border rounded-lg p-4 transition-all hover:border-accent-primary/50 group cursor-pointer ${getPriorityColor(
              item.priority,
            )}`}
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5">{getPriorityIcon(item.priority)}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-semibold text-foreground text-sm group-hover:text-accent-primary transition-colors">
                    {item.title}
                  </h3>
                  <div className={getPriorityBadge(item.priority)}>{item.priority}</div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{item.reason}</p>
              </div>

              <button className="flex-shrink-0 ml-2 p-2 hover:bg-accent-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                <ArrowRight className="w-4 h-4 text-accent-primary" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
