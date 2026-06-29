'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { fetchRepositoryAnalysisAction } from '@/actions/fetchRepositoryAnalysis';
import AiSettingsSheet from '@/components/ai-settings-sheet';
import { AiLoadingPanel } from '@/components/ai-loading-panel';
import Header from '@/components/header';
import DashboardHome from '@/components/dashboard-home';
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
import {
  getEffectiveAiConfig,
  isAiConfigReady,
  type StoredAiConfig,
} from '@/lib/ai/client-settings';
import { clearPlanReview } from '@/lib/actions/plan-review-storage';
import {
  isWorkflowStateError,
  workflowStateErrorMessage,
} from '@/lib/workflow-state/errors';
import {
  saveDocPlanContext,
  saveIssuePlanContext,
} from '@/lib/workflow-state/context-storage';
import {
  loadDashboardSession,
  saveDashboardSession,
} from '@/lib/workflow-state/dashboard-session-storage';
import { getDashboardHref } from '@/lib/dashboard-href';
import { friendlyErrorMessage } from '@/types/dashboard-analysis';
import type { DashboardAnalysisResult, DashboardErrorCode, DashboardSession } from '@/types/dashboard-analysis';
import type { ClientSessionUser } from '@/lib/auth';
import AutoFixCandidates from '@/components/auto-fix-candidates';
import { normalizeBriefing } from '@/lib/maintainer-briefing-utils';
import type { DocPlanContext, IssuePlanContext } from '@/types/doc-plan-review';
import { useAiStream } from '@/hooks/use-ai-stream';
import { useRecentRepositories } from '@/hooks/use-recent-repositories';
import { maintainerBriefingSchema } from '@/types/maintainer-briefing';
import { trimAnalysisForClient } from '@/lib/repository-analysis-utils';
import type { RepositoryAnalysis } from '@/types/repository-analysis';

interface DashboardProps {
  user: ClientSessionUser | null;
  initialRepositoryRef?: string;
}

type DashboardPhase = 'idle' | 'ready' | 'loading' | 'error' | 'success';

export default function Dashboard({
  user,
  initialRepositoryRef = '',
}: DashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const repoFromUrl = searchParams.get('repo')?.trim() ?? '';
  const [repositoryRef, setRepositoryRef] = useState(
    initialRepositoryRef || repoFromUrl,
  );
  const [result, setResult] = useState<DashboardAnalysisResult | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(user !== null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [aiConfig, setAiConfig] = useState(getEffectiveAiConfig());
  const [showSettingsPrompt, setShowSettingsPrompt] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const pendingAnalysisRef = useRef<{
    analysis: RepositoryAnalysis;
    repositoryRef: string;
  } | null>(null);

  const persistDashboardSession = useCallback(
    async (session: DashboardSession) => {
      try {
        await saveDashboardSession(session);
        router.replace(getDashboardHref(session.repositoryRef), { scroll: false });
      } catch {
        // Keep the dashboard usable even if persistence fails.
      }
    },
    [router],
  );

  const { submit: submitBriefing, object: streamingBriefing } = useAiStream({
    api: '/api/ai/maintainer-briefing',
    schema: maintainerBriefingSchema,
    onFinish: async ({ object, error }) => {
      const pending = pendingAnalysisRef.current;

      if (!pending) {
        setIsAnalyzing(false);
        return;
      }

      if (!object || error) {
        setResult({
          success: false,
          error: {
            message: error?.message ?? 'Failed to generate maintainer briefing.',
            code: 'AI_ERROR',
            status: 500,
          },
        });
        pendingAnalysisRef.current = null;
        setIsAnalyzing(false);
        return;
      }

      const briefing = normalizeBriefing(object);

      const nextResult: DashboardAnalysisResult = {
        success: true,
        analysis: trimAnalysisForClient(pending.analysis, briefing),
        briefing,
        analyzedAt: new Date().toISOString(),
        repositoryRef: pending.repositoryRef,
      };

      setResult(nextResult);
      pendingAnalysisRef.current = null;
      setIsAnalyzing(false);
      if (nextResult.success) {
        await persistDashboardSession({ ...nextResult });
      }
    },
    onError: (error) => {
      setResult({
        success: false,
        error: {
          message: error.message,
          code: 'AI_ERROR',
          status: 500,
        },
      });
      pendingAnalysisRef.current = null;
      setIsAnalyzing(false);
    },
  });

  const hasSuccessfulResult = result?.success === true;
  const hasError = result?.success === false;
  const trimmedRef = repositoryRef.trim();

  const phase: DashboardPhase = isRestoringSession || isAnalyzing
    ? 'loading'
    : hasSuccessfulResult
      ? 'success'
      : hasError
        ? 'error'
        : trimmedRef
          ? 'ready'
          : 'idle';

  const showHome = phase === 'idle' || phase === 'ready' || phase === 'error';
  const showGrid = phase === 'success';
  const canAnalyze =
    user !== null && trimmedRef.length > 0 && !isAnalyzing;

  const { recentRepos, recordRecent } = useRecentRepositories(user?.id);

  useEffect(() => {
    if (!user) {
      setIsRestoringSession(false);
      return;
    }

    let cancelled = false;

    async function restoreSession() {
      setIsRestoringSession(true);

      try {
        const session = await loadDashboardSession();
        if (cancelled || !session) {
          return;
        }

        if (repoFromUrl && repoFromUrl !== session.repositoryRef) {
          return;
        }

        setRepositoryRef(session.repositoryRef);
        setResult({
          success: true,
          analysis: session.analysis,
          briefing: session.briefing,
          analyzedAt: session.analyzedAt,
          repositoryRef: session.repositoryRef,
        });
      } catch {
        // Fall back to the repo picker when session restore fails.
      } finally {
        if (!cancelled) {
          setIsRestoringSession(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [repoFromUrl, user]);

  useEffect(() => {
    if (!hasSuccessfulResult || !user?.id) {
      return;
    }

    recordRecent(result.repositoryRef);
  }, [hasSuccessfulResult, result, user?.id, recordRecent]);

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

  async function handleAnalyze() {
    const trimmedRef = repositoryRef.trim();

    if (!trimmedRef || isAnalyzing) {
      return;
    }

    if (!isAiConfigReady(aiConfig)) {
      setShowSettingsPrompt(true);
      return;
    }

    setIsAnalyzing(true);
    setElapsedSeconds(0);
    setResult(null);

    try {
      const fetchResult = await fetchRepositoryAnalysisAction(trimmedRef);

      if (!fetchResult.success) {
        setResult({
          success: false,
          error: {
            ...fetchResult.error,
            code: fetchResult.error.code as DashboardErrorCode,
          },
        });
        setIsAnalyzing(false);
        return;
      }

      pendingAnalysisRef.current = {
        analysis: fetchResult.analysis,
        repositoryRef: fetchResult.repositoryRef,
      };

      submitBriefing({
        analysis: fetchResult.analysis,
        aiConfig,
        forceRefresh: true,
      });
    } catch {
      setResult({
        success: false,
        error: {
          message: 'The analysis request failed unexpectedly. Please try again.',
          code: 'UNKNOWN',
          status: 500,
        },
      });
      pendingAnalysisRef.current = null;
      setIsAnalyzing(false);
    }
  }

  const analysis = hasSuccessfulResult ? result.analysis : undefined;
  const briefing = hasSuccessfulResult ? result.briefing : undefined;

  async function handleUpdateDoc(targetFile: string, suggestion: string) {
    if (!hasSuccessfulResult) return;

    setWorkflowError(null);

    try {
      await clearPlanReview();

      const context: DocPlanContext = {
        repositoryRef: result.repositoryRef,
        targetFile,
        suggestion,
        analysis: result.analysis,
        briefing: result.briefing,
        analyzedAt: result.analyzedAt,
        aiConfig,
      };

      await saveDocPlanContext(context);

      router.push(
        `/app/doc?repo=${encodeURIComponent(result.repositoryRef)}&file=${encodeURIComponent(targetFile)}&suggestion=${encodeURIComponent(suggestion)}`,
      );
    } catch (error) {
      setWorkflowError(
        isWorkflowStateError(error)
          ? workflowStateErrorMessage(error)
          : 'Failed to start doc update workflow.',
      );
    }
  }

  async function handleReviewFix(issueNumber: number) {
    if (!hasSuccessfulResult) return;

    setWorkflowError(null);

    try {
      const context: IssuePlanContext = {
        repositoryRef: result.repositoryRef,
        issueNumber,
        analysis: result.analysis,
        briefing: result.briefing,
        analyzedAt: result.analyzedAt,
        aiConfig,
      };

      await saveIssuePlanContext(context);

      router.push(
        `/app/issue?repo=${encodeURIComponent(result.repositoryRef)}&issue=${encodeURIComponent(String(issueNumber))}&analyze=1`,
      );
    } catch (error) {
      setWorkflowError(
        isWorkflowStateError(error)
          ? workflowStateErrorMessage(error)
          : 'Failed to start issue fix workflow.',
      );
    }
  }

  return (
    <div className="min-h-screen text-foreground">
      <Header
        user={user}
        repositoryRef={repositoryRef}
        onRepositoryRefChange={setRepositoryRef}
        onAnalyze={() => void handleAnalyze()}
        isAnalyzing={isAnalyzing}
        hasAnalysisResult={hasSuccessfulResult}
        aiSettings={<AiSettingsSheet onSaved={handleAiConfigSaved} />}
        variant={showGrid ? 'workspace' : 'home'}
      />

      {workflowError ? (
        <div className="mx-auto w-full max-w-7xl px-6 pt-4">
          <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
            <AlertCircle />
            <AlertTitle>Workflow unavailable</AlertTitle>
            <AlertDescription>{workflowError}</AlertDescription>
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
                Choose MaintainerOS AI for analysis, or connect your own provider in settings.
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

      {isRestoringSession || isAnalyzing ? (
        <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col items-center justify-center px-6 py-12">
          <AiLoadingPanel
            message={
              isRestoringSession
                ? 'Restoring your workspace…'
                : 'Fetching GitHub data and generating AI briefing…'
            }
            repositoryRef={trimmedRef || undefined}
            elapsedSeconds={isAnalyzing ? elapsedSeconds : undefined}
            streamingSummary={
              isAnalyzing && typeof streamingBriefing?.summary === 'string'
                ? streamingBriefing.summary
                : undefined
            }
          />
        </main>
      ) : null}

      {showHome && user ? (
        <DashboardHome
          user={user}
          repositoryRef={repositoryRef}
          onRepositoryRefChange={setRepositoryRef}
          onAnalyze={() => void handleAnalyze()}
          isAnalyzing={isAnalyzing}
          canAnalyze={canAnalyze}
          recentRepos={recentRepos}
          onSelectRecent={setRepositoryRef}
        />
      ) : null}

      {showGrid ? (
      <main className="mx-auto w-full max-w-7xl px-6 py-10">
        <section className="mb-8">
          <MaintainerBriefing
            briefing={briefing}
            analyzedAt={hasSuccessfulResult ? result.analyzedAt : undefined}
            isLoading={isAnalyzing}
            isEmpty={false}
          />
        </section>

        <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TodaysPriorities
              priorities={briefing?.priorities}
              repository={analysis?.repository}
              issues={analysis?.issues}
              isLoading={isAnalyzing}
              isEmpty={false}
            />
          </div>
          <div>
            <MergeQueue
              pullRequests={analysis?.repository.openPullRequests ?? 0}
              isLoading={isAnalyzing}
              isEmpty={false}
            />
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <MaintenanceQueue
            release={briefing?.release}
            documentation={briefing ? normalizeBriefing(briefing).documentation : undefined}
            isLoading={isAnalyzing}
            isEmpty={false}
            onUpdateDoc={hasSuccessfulResult ? (file, sugg) => void handleUpdateDoc(file, sugg) : undefined}
          />
          <SecurityOverview analysis={analysis} isLoading={isAnalyzing} isEmpty={false} />
        </div>

        <div className="mb-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ReleaseAssistant
              release={briefing?.release}
              isLoading={isAnalyzing}
              isEmpty={false}
            />
          </div>
          <div>
            <RepositoryHealth
              analysis={analysis}
              briefing={briefing}
              isLoading={isAnalyzing}
              isEmpty={false}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <AutoFixCandidates
            briefing={briefing}
            isLoading={isAnalyzing}
            isEmpty={false}
            onReviewFix={hasSuccessfulResult ? (num) => void handleReviewFix(num) : undefined}
          />
          <ContributorOpportunities
            opportunities={briefing?.contributorOpportunities}
            issues={analysis?.issues}
            repository={analysis?.repository}
            isLoading={isAnalyzing}
            isEmpty={false}
          />
        </div>
      </main>
      ) : null}
    </div>
  );
}
