'use client';

import { GitBranch, RefreshCw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function Header() {
  return (
    <header className="border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo and branding */}
        <div className="flex items-center gap-3">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center">
            <GitBranch className="size-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold text-foreground">MaintainerOS</h1>
        </div>

        {/* Center - Repository selector */}
        <div className="hidden md:flex items-center">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <GitBranch className="size-4" />
            <span>vercel/next.js</span>
            <ChevronDown className="size-4" />
          </Button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
            <RefreshCw className="size-4" />
            <span>Analyze</span>
          </Button>
          <Button size="sm" className="flex items-center gap-2">
            <GitBranch className="size-4" data-icon="inline-start" />
            Analyze Repository
          </Button>
        </div>
      </div>
    </header>
  );
}
