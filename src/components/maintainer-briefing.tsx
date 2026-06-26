'use client';

import { Zap, TrendingUp, Clock, Calendar } from 'lucide-react';

export default function MaintainerBriefing() {
  const healthScore = 78;
  const estimatedTime = 45;
  const lastAnalyzed = '2 hours ago';

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-8 lg:p-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold mb-2">Maintainer Briefing</h2>
          <p className="text-text-muted">AI-generated analysis and recommendations for your repository</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-text-muted flex items-center gap-1 justify-end">
            <Calendar className="w-3 h-3" />
            {lastAnalyzed}
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="mb-8 pb-8 border-b border-card-border">
        <p className="text-base leading-relaxed text-foreground/90">
          Your repository is in good shape with active maintenance. Recent merged PRs show feature development is on track. 3 high-priority issues require attention before the next release. Documentation has drifted slightly from the latest API changes. Consider scheduling time to address contributor feedback and triage new issues.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Health Score */}
        <div className="bg-background/40 rounded-lg p-6 border border-card-border/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-accent-primary/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent-primary" />
            </div>
            <span className="text-sm font-medium text-text-muted">Repository Health Score</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{healthScore}</span>
            <span className="text-sm text-text-muted mb-1">/100</span>
          </div>
          <p className="text-xs text-text-muted mt-3">Strong maintenance signals detected</p>
        </div>

        {/* Estimated Time */}
        <div className="bg-background/40 rounded-lg p-6 border border-card-border/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-accent-secondary/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-accent-secondary" />
            </div>
            <span className="text-sm font-medium text-text-muted">Est. Maintenance Time</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">{estimatedTime}</span>
            <span className="text-sm text-text-muted mb-1">minutes</span>
          </div>
          <p className="text-xs text-text-muted mt-3">To address today&apos;s priorities</p>
        </div>

        {/* Status */}
        <div className="bg-background/40 rounded-lg p-6 border border-card-border/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-accent-primary/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-accent-primary" />
            </div>
            <span className="text-sm font-medium text-text-muted">Status</span>
          </div>
          <p className="text-base font-semibold">Active</p>
          <p className="text-xs text-text-muted mt-3">3 high-priority items awaiting</p>
        </div>
      </div>
    </div>
  );
}
