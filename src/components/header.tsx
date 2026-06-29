'use client';

import { GitBranch, Sparkles } from 'lucide-react';
import LoginButton from '@/components/auth/LoginButton';
import UserMenu from '@/components/auth/UserMenu';
import RepositoryPicker from '@/components/repository-picker';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import type { ClientSessionUser } from '@/lib/auth';

interface HeaderProps {
  user: ClientSessionUser | null;
  repositoryRef: string;
  onRepositoryRefChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  hasAnalysisResult?: boolean;
  aiSettings?: React.ReactNode;
  variant?: 'home' | 'workspace';
}

export default function Header({
  user,
  repositoryRef = '',
  onRepositoryRefChange,
  onAnalyze,
  isAnalyzing,
  hasAnalysisResult = false,
  aiSettings,
  variant = 'workspace',
}: HeaderProps) {
  const isLoggedIn = user !== null;
  const isHome = variant === 'home';
  const canAnalyze =
    isLoggedIn && repositoryRef.trim().length > 0 && !isAnalyzing;

  const analyzeLabel = hasAnalysisResult ? 'Re-analyze' : 'Analyze';

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3">
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="relative flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-2 shadow-md shadow-primary/20">
            <GitBranch className="size-4 text-primary-foreground" />
            {isAnalyzing ? (
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary ring-2 ring-background">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-75" />
              </span>
            ) : null}
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold tracking-tight text-foreground">
              MaintainerOS
            </h1>
            {isHome ? (
              <p className="text-[10px] text-muted-foreground">
                AI workspace for open source
              </p>
            ) : null}
          </div>
        </div>

        {!isLoggedIn ? (
          <div className="ml-auto">
            <LoginButton />
          </div>
        ) : (
          <>
            {!isHome ? (
              <RepositoryPicker
                value={repositoryRef}
                onSelect={onRepositoryRefChange}
                disabled={isAnalyzing}
              />
            ) : null}

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              {aiSettings}
              {user ? <UserMenu user={user} /> : null}
              {!isHome ? (
                <Button
                  size="sm"
                  variant={hasAnalysisResult ? 'outline' : 'default'}
                  onClick={onAnalyze}
                  disabled={!canAnalyze}
                  className={
                    hasAnalysisResult
                      ? 'gap-1.5'
                      : 'gap-1.5 bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/90'
                  }
                >
                  {isAnalyzing ? (
                    <>
                      <Spinner className="size-3.5" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" data-icon="inline-start" />
                      {analyzeLabel}
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
