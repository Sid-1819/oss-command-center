'use client';

import { BookOpen, ArrowRight, AlertTriangle } from 'lucide-react';

interface DocSuggestion {
  id: string;
  name: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
}

const suggestions: DocSuggestion[] = [
  {
    id: '1',
    name: 'README.md',
    reason: 'Quick start guide references deprecated API endpoints. Updated 6 weeks ago.',
    severity: 'high',
  },
  {
    id: '2',
    name: 'Installation Guide',
    reason: 'Node.js version requirement changed. Currently lists v18, should be v20+.',
    severity: 'high',
  },
  {
    id: '3',
    name: 'API Reference',
    reason: 'New streaming endpoint added but not documented. Review recent PRs.',
    severity: 'medium',
  },
  {
    id: '4',
    name: 'Contributing Guide',
    reason: 'Coding standards reference outdated TypeScript version.',
    severity: 'low',
  },
];

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'high':
      return 'border-red-500/30 bg-red-500/5';
    case 'medium':
      return 'border-yellow-500/30 bg-yellow-500/5';
    case 'low':
      return 'border-blue-500/30 bg-blue-500/5';
    default:
      return 'border-card-border';
  }
}

function getSeverityBadge(severity: string) {
  const baseClass = 'px-2 py-1 rounded text-xs font-semibold uppercase';
  switch (severity) {
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

export default function DocumentationDrift() {
  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-8">
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-5 h-5 text-text-muted" />
        <h2 className="text-xl font-bold">Documentation Drift</h2>
      </div>
      <p className="text-sm text-text-muted mb-6">Documentation likely needs updating</p>

      <div className="space-y-3">
        {suggestions.map((doc) => (
          <div key={doc.id} className={`border rounded-lg p-4 group cursor-pointer transition-all hover:border-accent-primary/50 ${getSeverityColor(doc.severity)}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-sm text-foreground group-hover:text-accent-primary transition-colors">
                    {doc.name}
                  </h3>
                  <div className={getSeverityBadge(doc.severity)}>{doc.severity}</div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">{doc.reason}</p>
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
