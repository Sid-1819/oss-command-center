'use client';

import { GitBranch, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';

interface HeaderProps {
  repositoryRef: string;
  onRepositoryRefChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  activeRepository?: string;
}

export default function Header({
  repositoryRef = '',
  onRepositoryRefChange,
  onAnalyze,
  isAnalyzing,
  activeRepository,
}: HeaderProps) {
  const canAnalyze = repositoryRef.trim().length > 0 && !isAnalyzing;

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3.5">
        <div className="flex shrink-0 items-center gap-3">
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/25">
            <GitBranch className="size-5 text-primary-foreground" />
            {activeRepository && (
              <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-75" />
              </span>
            )}
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              MaintainerOS
            </h1>
            <p className="text-[11px] text-muted-foreground">AI workspace for open source</p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center px-2 md:max-w-md">
          <Input
            value={repositoryRef}
            onChange={(event) => onRepositoryRefChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && canAnalyze) {
                onAnalyze();
              }
            }}
            placeholder="owner/repository"
            disabled={isAnalyzing}
            aria-label="Repository"
            className="h-8 border-white/[0.08] bg-secondary/50 font-mono text-xs placeholder:font-sans"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {activeRepository && (
            <Badge
              variant="outline"
              className="hidden border-primary/30 bg-primary/5 text-primary sm:flex"
            >
              <span className="mr-1.5 size-1.5 rounded-full bg-primary animate-pulse" />
              {activeRepository}
            </Badge>
          )}
          <Button
            size="sm"
            onClick={onAnalyze}
            disabled={!canAnalyze}
            className="gap-2 bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
          >
            {isAnalyzing ? (
              <>
                <Spinner className="size-3.5" />
                Analyzing…
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" data-icon="inline-start" />
                Analyze
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
