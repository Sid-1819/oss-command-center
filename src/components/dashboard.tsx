'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { analyzeRepositoryDashboard } from '@/actions/analyzeRepositoryDashboard';
import AiSettingsSheet from '@/components/ai-settings-sheet';
import Header from '@/components/header';
import MaintainerBriefing from '@/components/maintainer-briefing';
import TodaysPriorities from '@/components/todays-priorities';
import ReleaseAssistant from '@/components/release-assistant';
import ContributorOpportunities from '@/components/contributor-opportunities';
import RepositoryHealth from '@/components/repository-health';
import MergeQueue from '@/components/merge-queue';
import MaintenanceQueue from '@/components/maintenance-queue';
import SecurityOverview from '@/components/security-overview';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  getEffectiveAiConfig,
  isAiConfigReady,
  type StoredAiConfig,
} from '@/lib/ai/client-settings';
import { friendlyErrorMessage } from '@/types/dashboard-analysis';
import type { DashboardAnalysisResult } from '@/types/dashboard-analysis';
import type { ClientSessionUser } from '@/lib/auth';
import AutoFixCandidates from '@/components/auto-fix-candidates';
import { normalizeBriefing } from '@/lib/maintainer-briefing-utils';
import { clearPlanReview } from '@/lib/actions/plan-review-storage';
import {
  DOC_PLAN_CONTEXT_KEY,
  ISSUE_PLAN_CONTEXT_KEY,
  type DocPlanContext,
  type IssuePlanContext,
} from '@/types/doc-plan-review';

interface DashboardProps {
  user: ClientSessionUser | null;
  initialRepositoryRef?: string;
  demoMode?: boolean;
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

export default function Dashboard({
  user,
  initialRepositoryRef = '',
  demoMode = false,
}: DashboardProps) {
  const router = useRouter();
  const [repositoryRef, setRepositoryRef] = useState(initialRepositoryRef);
  const [result, setResult] = useState<DashboardAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [aiConfig, setAiConfig] = useState(getEffectiveAiConfig());
  const [showSettingsPrompt, setShowSettingsPrompt] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);

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

  const handleAiConfigSaved = useCallback((config: StoredAiConfig) => {
    setAiConfig(config);
    setShowSettingsPrompt(false);
  }, []);

  async function handleAnalyze(options?: { refresh?: boolean }) {
    const trimmedRef = repositoryRef.trim();

    if (!trimmedRef || isAnalyzing) {
      return;
    }

    if (!demoMode && !isAiConfigReady(aiConfig)) {
      setShowSettingsPrompt(true);
      return;
    }

    setIsAnalyzing(true);
    setElapsedSeconds(0);
    setResult(null);

    try {
      const nextResult = await analyzeRepositoryDashboard({
        repositoryRef: trimmedRef,
        aiConfig: demoMode ? { provider: 'mock' } : aiConfig,
        forceRefresh: options?.refresh ?? forceRefresh,
        demoMode,
      });
      setResult(nextResult);
      setForceRefresh(false);
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

  function handleUpdateDoc(targetFile: string, suggestion: string) {
    if (!hasSuccessfulResult) return;

    clearPlanReview();

    const context: DocPlanContext = {
      repositoryRef: result.repositoryRef,
      targetFile,
      suggestion,
      analysis: result.analysis,
      briefing: result.briefing,
      analyzedAt: result.analyzedAt,
      aiConfig: demoMode ? { provider: 'mock' } : aiConfig,
      demoMode,
    };

    sessionStorage.setItem(DOC_PLAN_CONTEXT_KEY, JSON.stringify(context));

    router.push(
      `/app/doc?repo=${encodeURIComponent(result.repositoryRef)}&file=${encodeURIComponent(targetFile)}&suggestion=${encodeURIComponent(suggestion)}${demoMode ? '&demo=1' : ''}`,
    );
  }

  function handleReviewFix(issueNumber: number) {
    if (!hasSuccessfulResult) return;

    const context: IssuePlanContext = {
      repositoryRef: result.repositoryRef,
      issueNumber,
      analysis: result.analysis,
      briefing: result.briefing,
      analyzedAt: result.analyzedAt,
      aiConfig: demoMode ? { provider: 'mock' } : aiConfig,
      demoMode,
    };

    sessionStorage.setItem(ISSUE_PLAN_CONTEXT_KEY, JSON.stringify(context));

    router.push(
      `/app/issue?repo=${encodeURIComponent(result.repositoryRef)}&issue=${encodeURIComponent(String(issueNumber))}${demoMode ? '&demo=1' : ''}`,
    );
  }

  return (
    <div className="min-h-screen text-foreground">
      <Header
        user={user}
        repositoryRef={repositoryRef}
        onRepositoryRefChange={setRepositoryRef}
        onAnalyze={() => void handleAnalyze()}
        isAnalyzing={isAnalyzing}
        activeRepository={hasSuccessfulResult ? result.repositoryRef : undefined}
        aiSettings={<AiSettingsSheet onSaved={handleAiConfigSaved} />}
        demoMode={demoMode}
      />

      {demoMode ? (
        <div className="mx-auto w-full max-w-7xl px-6 pt-4">
          <Alert className="border-primary/30 bg-primary/5">
            <AlertTitle>Demo mode</AlertTitle>
            <AlertDescription>
              Fixture data only — no GitHub or AI API calls. Try doc updates and auto-fix flows
              end-to-end.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      {showSettingsPrompt ? (
        <div className="mx-auto w-full max-w-7xl px-6 pt-4">
          <Alert className="border-amber-500/30 bg-amber-500/10">
            <AlertCircle />
            <AlertTitle>AI provider required</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-2">
              <span>
                Choose Mock mode for free local testing, or paste your Gemini API key.
              </span>
              <AiSettingsSheet onSaved={handleAiConfigSaved} />
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

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
              {demoMode
                ? `Loading demo briefing… (${formatElapsed(elapsedSeconds)})`
                : `Fetching GitHub data and generating AI briefing… (${formatElapsed(elapsedSeconds)})`}
            </span>
          </div>
        </div>
      )}

      {hasSuccessfulResult ? (
        <div className="mx-auto flex w-full max-w-7xl justify-end px-6 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setForceRefresh(true);
              void handleAnalyze({ refresh: true });
            }}
            disabled={isAnalyzing}
          >
            Re-analyze (bypass cache)
          </Button>
        </div>
      ) : null}

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
          <div className="lg:col-span-2">
            <TodaysPriorities
              priorities={briefing?.priorities}
              isLoading={isAnalyzing}
              isEmpty={isEmpty}
            />
          </div>
          <div>
            <MergeQueue
              pullRequests={analysis?.repository.openPullRequests ?? 0}
              isLoading={isAnalyzing}
              isEmpty={isEmpty}
            />
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <MaintenanceQueue
            release={briefing?.release}
            documentation={briefing ? normalizeBriefing(briefing).documentation : undefined}
            isLoading={isAnalyzing}
            isEmpty={isEmpty}
            onUpdateDoc={hasSuccessfulResult ? handleUpdateDoc : undefined}
          />
          <SecurityOverview analysis={analysis} isLoading={isAnalyzing} isEmpty={isEmpty} />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ReleaseAssistant
              release={briefing?.release}
              isLoading={isAnalyzing}
              isEmpty={isEmpty}
            />
          </div>
          <div>
            <RepositoryHealth
              analysis={analysis}
              briefing={briefing}
              isLoading={isAnalyzing}
              isEmpty={isEmpty}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <AutoFixCandidates
            briefing={briefing}
            isLoading={isAnalyzing}
            isEmpty={isEmpty}
            onReviewFix={hasSuccessfulResult ? handleReviewFix : undefined}
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
