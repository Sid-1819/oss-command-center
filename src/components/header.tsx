'use client';

import { GitBranch, RefreshCw, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
            <GitBranch className="size-5 text-primary-foreground" />
            <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background">
              <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-75" />
            </span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              MaintainerOS
            </h1>
            <p className="text-[11px] text-muted-foreground">AI workspace for open source</p>
          </div>
        </div>

        <div className="hidden md:flex items-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-white/[0.08] bg-secondary/50 hover:bg-secondary/80"
          >
            <GitBranch className="size-3.5 text-primary" />
            <span className="font-mono text-xs">vercel/next.js</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="hidden sm:flex border-primary/30 bg-primary/5 text-primary">
            <span className="mr-1.5 size-1.5 rounded-full bg-primary animate-pulse" />
            Live
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex gap-2 border-white/[0.08] bg-secondary/50"
          >
            <RefreshCw className="size-3.5" />
            Sync
          </Button>
          <Button size="sm" className="gap-2 bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90">
            <Sparkles className="size-3.5" data-icon="inline-start" />
            Analyze
          </Button>
        </div>
      </div>
    </header>
  );
}
