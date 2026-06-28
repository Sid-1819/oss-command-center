'use client';

import { useEffect, useState } from 'react';
import { GitBranch } from 'lucide-react';
import { getRandomAiLoadingFact } from '@/lib/ai/loading-facts';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export interface StreamingStep {
  rationale?: string;
  operation?: string;
  section?: string;
  content?: string;
}

interface AiLoadingPanelProps {
  message: string;
  elapsedSeconds?: number;
  className?: string;
  compact?: boolean;
  repositoryRef?: string;
  streamingSummary?: string;
  streamingSteps?: StreamingStep[];
  providerLabel?: string;
}

function StreamingPreview({
  streamingSummary,
  streamingSteps,
  providerLabel,
  compact = false,
}: {
  streamingSummary?: string;
  streamingSteps?: StreamingStep[];
  providerLabel?: string;
  compact?: boolean;
}) {
  const hasSummary = Boolean(streamingSummary?.trim());
  const hasSteps = Boolean(streamingSteps && streamingSteps.length > 0);

  if (!hasSummary && !hasSteps) {
    return null;
  }

  return (
    <div
      className={cn(
        'w-full rounded-xl border border-border/60 bg-secondary/30 text-left',
        compact ? 'mt-3 px-4 py-3' : 'mt-4 px-5 py-4',
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {hasSteps ? 'Drafting plan' : 'Drafting briefing'}
        </p>
      </div>

      {providerLabel ? (
        <p className="mb-2 text-xs text-muted-foreground/70">Provider: {providerLabel}</p>
      ) : null}

      {hasSummary ? (
        <p
          className={cn(
            'leading-relaxed text-foreground/90',
            compact ? 'text-sm' : 'text-sm md:text-base',
          )}
        >
          {streamingSummary}
          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
        </p>
      ) : null}

      {hasSteps ? (
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {streamingSteps!.map((step, index) => (
            <li
              key={`${step.operation ?? 'step'}-${index}`}
              className="rounded-md border border-border/60 bg-background/40 px-2.5 py-1.5"
            >
              {step.operation ? (
                <span className="font-medium text-foreground/80">{step.operation}</span>
              ) : null}
              {step.section ? (
                <span className="ml-1 text-muted-foreground">· {step.section}</span>
              ) : null}
              {step.rationale ? (
                <p className="mt-0.5 line-clamp-2 italic">{step.rationale}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function AiLoadingPanel({
  message,
  elapsedSeconds,
  className,
  compact = false,
  repositoryRef,
  streamingSummary,
  streamingSteps,
  providerLabel,
}: AiLoadingPanelProps) {
  const [fact, setFact] = useState(() => getRandomAiLoadingFact());

  useEffect(() => {
    setFact(getRandomAiLoadingFact());
    const intervalId = window.setInterval(() => {
      setFact(getRandomAiLoadingFact());
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, []);

  const statusLine = (
    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
      <Spinner className={compact ? 'size-4' : 'size-5'} />
      <span>
        {message}
        {elapsedSeconds !== undefined ? ` (${formatElapsed(elapsedSeconds)})` : null}
      </span>
    </div>
  );

  const factLine = (
    <p
      className={cn(
        'text-xs italic leading-relaxed text-muted-foreground/80',
        compact ? 'mt-3 text-center' : 'mt-6 max-w-md text-center',
      )}
    >
      {fact}
    </p>
  );

  const streamingPreview = (
    <StreamingPreview
      streamingSummary={streamingSummary}
      streamingSteps={streamingSteps}
      providerLabel={providerLabel}
      compact={compact}
    />
  );

  if (compact) {
    return (
      <div className={cn('w-full', className)}>
        {statusLine}
        {streamingPreview}
        {factLine}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'glass-panel flex w-full flex-col items-center p-8 md:p-12',
        className,
      )}
    >
      {repositoryRef ? (
        <div className="mb-6 flex items-center gap-2 rounded-full border border-border/60 bg-secondary/40 px-3 py-1.5 text-sm text-muted-foreground">
          <GitBranch className="size-3.5 shrink-0 text-primary" />
          <span className="font-mono text-foreground">{repositoryRef}</span>
        </div>
      ) : null}

      {statusLine}
      {streamingPreview}
      {factLine}
    </div>
  );
}
