'use client';

import { GitBranch, RefreshCw, ChevronDown } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-card-border bg-card-bg/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo and branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
            <GitBranch className="w-5 h-5 text-background" />
          </div>
          <h1 className="text-lg font-semibold">MaintainerOS</h1>
        </div>

        {/* Center - Repository selector */}
        <div className="hidden md:flex items-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-card-bg border border-card-border rounded-lg hover:border-accent-primary/30 cursor-pointer transition-colors">
            <GitBranch className="w-4 h-4 text-text-muted" />
            <span className="text-sm font-medium">vercel/next.js</span>
            <ChevronDown className="w-4 h-4 text-text-muted" />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-card-bg border border-card-border rounded-lg text-sm font-medium hover:border-accent-secondary/30 transition-colors text-text-muted">
            <RefreshCw className="w-4 h-4" />
            <span>Analyze</span>
          </button>
          <button className="px-4 py-2 bg-accent-primary hover:bg-accent-primary/90 rounded-lg text-sm font-medium text-background transition-colors">
            Analyze Repository
          </button>
        </div>
      </div>
    </header>
  );
}
