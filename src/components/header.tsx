'use client';

import { GitBranch, Sparkles } from 'lucide-react';
import LoginButton from '@/components/auth/LoginButton';
import UserMenu from '@/components/auth/UserMenu';
import RepositoryPicker from '@/components/repository-picker';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import type { ClientSessionUser } from '@/lib/auth';

interface HeaderProps {
  user: ClientSessionUser | null;
  repositoryRef: string;
  onRepositoryRefChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  activeRepository?: string;
  aiSettings?: React.ReactNode;
  demoMode?: boolean;
  variant?: 'home' | 'workspace';
}

export default function Header({
  user,
  repositoryRef = '',
  onRepositoryRefChange,
  onAnalyze,
  isAnalyzing,
  activeRepository,
  aiSettings,
  demoMode = false,
  variant = 'workspace',
}: HeaderProps) {
  const isLoggedIn = user !== null;
  const isHome = variant === 'home';
  const canAnalyze =
    isLoggedIn && repositoryRef.trim().length > 0 && !isAnalyzing;

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
            <p className="text-[11px] text-muted-foreground">
              {demoMode ? 'Demo workspace' : 'AI workspace for open source'}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center px-2 md:max-w-md">
          {!isLoggedIn ? (
            <LoginButton />
          ) : isHome ? null : (
            <RepositoryPicker
              value={repositoryRef}
              onSelect={onRepositoryRefChange}
              disabled={isAnalyzing || demoMode}
            />
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {aiSettings}
          {isLoggedIn && user ? <UserMenu user={user} /> : null}
          {!isHome && activeRepository ? (
            <Badge
              variant="outline"
              className="hidden border-primary/30 bg-primary/5 text-primary sm:flex"
            >
              <span className="mr-1.5 size-1.5 rounded-full bg-primary animate-pulse" />
              {activeRepository}
            </Badge>
          ) : null}
          {!isHome ? (
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
                  {demoMode ? 'Load demo' : 'Analyze'}
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
