'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { analyzeRepositoryDashboard } from '@/actions/analyzeRepositoryDashboard';
import Header from '@/components/header';
import MaintainerBriefing from '@/components/maintainer-briefing';
import TodaysPriorities from '@/components/todays-priorities';
import ReleaseAssistant from '@/components/release-assistant';
import DocumentationDrift from '@/components/documentation-drift';
import ContributorOpportunities from '@/components/contributor-opportunities';
import RepositoryHealth from '@/components/repository-health';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { friendlyErrorMessage } from '@/types/dashboard-analysis';
import type { DashboardAnalysisResult } from '@/types/dashboard-analysis';
import type { ClientSessionUser } from '@/lib/auth';
import { clearPlanReview } from '@/lib/readme/plan-review-storage';
import {
  README_PLAN_CONTEXT_KEY,
  type ReadmePlanContext,
} from '@/types/readme-plan-review';

interface DashboardProps {
  user: ClientSessionUser | null;
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export default function Dashboard({ user }: DashboardProps) {
  const router = useRouter();
  const [repositoryRef, setRepositoryRef] = useState('');
  const [result, setResult] = useState<DashboardAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const hasSuccessfulResult = result?.success === true;
  const hasError = result?.success === false;
  const isEmpty = !hasSuccessfulResult && !isAnalyzing;

  useEffect(() => {
    if (!isAnalyzing) {
      return;
    }

    const startedAt = Date.now();

    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAnalyzing]);

  async function handleAnalyze() {
    const trimmedRef = repositoryRef.trim();

    if (!trimmedRef || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);
    setElapsedSeconds(0);
    setResult(null);

    try {
      const nextResult = await analyzeRepositoryDashboard(trimmedRef);
      setResult(nextResult);
    } catch {
      setResult({
        success: false,
        error: {
          message: 'The analysis request failed unexpectedly. Please try again.',
          code: 'UNKNOWN',
          status: 500,
        },
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  const analysis = hasSuccessfulResult ? result.analysis : undefined;
  const briefing = hasSuccessfulResult ? result.briefing : undefined;

  function handleUpdateReadme(suggestion: string) {
    if (!hasSuccessfulResult) {
      return;
    }

    clearPlanReview();

    const context: ReadmePlanContext = {
      repositoryRef: result.repositoryRef,
      suggestion,
      analysis: result.analysis,
      briefing: result.briefing,
      analyzedAt: result.analyzedAt,
    };

    sessionStorage.setItem(README_PLAN_CONTEXT_KEY, JSON.stringify(context));

    router.push(
      `/app/readme?repo=${encodeURIComponent(result.repositoryRef)}&suggestion=${encodeURIComponent(suggestion)}`,
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <Header
        user={user}
        repositoryRef={repositoryRef}
        onRepositoryRefChange={setRepositoryRef}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
        activeRepository={hasSuccessfulResult ? result.repositoryRef : undefined}
      />

      {hasError && (
        <div className="mx-auto w-full max-w-7xl px-6 pt-4">
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
            <AlertCircle />
            <AlertTitle>Analysis failed</AlertTitle>
            <AlertDescription>{friendlyErrorMessage(result.error)}</AlertDescription>
          </Alert>
        </div>
      )}

      {isAnalyzing && (
        <div className="mx-auto w-full max-w-7xl px-6 pt-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Spinner className="size-4" />
            <span>
              Fetching GitHub data and generating AI briefing… ({formatElapsed(elapsedSeconds)})
            </span>
          </div>
          <p className="mt-1 text-center text-xs text-muted-foreground/80">
            Large repositories may take 15–30 seconds. Recent issues and PRs are analyzed first.
          </p>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl px-6 py-10">
        <section className="mb-8">
          <MaintainerBriefing
            briefing={briefing}
            analyzedAt={hasSuccessfulResult ? result.analyzedAt : undefined}
            isLoading={isAnalyzing}
            isEmpty={isEmpty}
          />
        </section>

        <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <TodaysPriorities
              priorities={briefing?.priorities}
              isLoading={isAnalyzing}
              isEmpty={isEmpty}
            />
            <ReleaseAssistant
              release={briefing?.release}
              isLoading={isAnalyzing}
              isEmpty={isEmpty}
            />
          </div>

          <div className="space-y-5">
            <RepositoryHealth
              analysis={analysis}
              briefing={briefing}
              isLoading={isAnalyzing}
              isEmpty={isEmpty}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <DocumentationDrift
            documentation={briefing?.documentation}
            isLoading={isAnalyzing}
            isEmpty={isEmpty}
            onUpdateReadme={hasSuccessfulResult ? handleUpdateReadme : undefined}
          />
          <ContributorOpportunities
            opportunities={briefing?.contributorOpportunities}
            issues={analysis?.issues}
            isLoading={isAnalyzing}
            isEmpty={isEmpty}
          />
        </div>
      </main>
    </div>
  );
}
