'use client';

import { Code2, ArrowRight, Zap } from 'lucide-react';

interface Opportunity {
  id: string;
  issueNumber: number;
  title: string;
  reason: string;
  effort: 'small' | 'medium' | 'large';
}

const opportunities: Opportunity[] = [
  {
    id: '1',
    issueNumber: 892,
    title: 'Add dark mode toggle to sidebar',
    reason: 'Great UI/UX task for beginners. Clear acceptance criteria and isolated component.',
    effort: 'small',
  },
  {
    id: '2',
    issueNumber: 1043,
    title: 'Create TypeScript example in docs',
    reason: 'Perfect for learning project structure. No dependencies on other systems.',
    effort: 'medium',
  },
  {
    id: '3',
    issueNumber: 756,
    title: 'Add unit tests for utils/helpers',
    reason: 'Self-contained testing task. Great way to learn test patterns used in codebase.',
    effort: 'small',
  },
  {
    id: '4',
    issueNumber: 1101,
    title: 'Improve error messages',
    reason: 'Improve developer experience by making error messages more helpful.',
    effort: 'medium',
  },
];

function getEffortColor(effort: string) {
  switch (effort) {
    case 'small':
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/30';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30';
    case 'large':
      return 'bg-red-500/10 text-red-300 border-red-500/30';
    default:
      return 'bg-card-border text-text-muted';
  }
}

function getEffortLabel(effort: string) {
  switch (effort) {
    case 'small':
      return 'Small effort';
    case 'medium':
      return 'Medium effort';
    case 'large':
      return 'Large effort';
    default:
      return 'Unknown';
  }
}

export default function ContributorOpportunities() {
  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-8">
      <div className="flex items-center gap-2 mb-2">
        <Code2 className="w-5 h-5 text-text-muted" />
        <h2 className="text-xl font-bold">Contributor Opportunities</h2>
      </div>
      <p className="text-sm text-text-muted mb-6">Beginner-friendly issues to invite contributors</p>

      <div className="space-y-3">
        {opportunities.map((opp) => (
          <div
            key={opp.id}
            className="border border-card-border rounded-lg p-4 group cursor-pointer hover:border-accent-primary/50 transition-all bg-background/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-text-muted">#{opp.issueNumber}</span>
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-accent-primary transition-colors">
                    {opp.title}
                  </h3>
                </div>
                <p className="text-xs text-text-muted leading-relaxed mb-3">{opp.reason}</p>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getEffortColor(opp.effort)}`}>
                  <Zap className="w-3 h-3" />
                  {getEffortLabel(opp.effort)}
                </div>
              </div>
              <button className="flex-shrink-0 p-2 hover:bg-accent-primary/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                <ArrowRight className="w-4 h-4 text-accent-primary" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
