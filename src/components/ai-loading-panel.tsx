'use client';

import { useEffect, useState } from 'react';
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
  streamingSummary?: string;
  streamingSteps?: StreamingStep[];
  providerLabel?: string;
}

export function AiLoadingPanel({
  message,
  elapsedSeconds,
  className,
  compact = false,
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

  const streamingContent =
    streamingSummary || (streamingSteps && streamingSteps.length > 0) ? (
      <div className="mt-2 w-full max-w-lg space-y-2 text-left">
        {providerLabel ? (
          <p className="text-xs text-muted-foreground/70">Provider: {providerLabel}</p>
        ) : null}
        {streamingSummary ? (
          <p className="text-sm text-foreground/90">{streamingSummary}</p>
        ) : null}
        {streamingSteps && streamingSteps.length > 0 ? (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {streamingSteps.map((step, index) => (
              <li key={`${step.operation ?? 'step'}-${index}`} className="rounded-md border border-border/60 px-2 py-1">
                {step.operation ? (
                  <span className="font-medium text-foreground/80">{step.operation}</span>
                ) : null}
                {step.section ? <span className="ml-1 text-muted-foreground">· {step.section}</span> : null}
                {step.rationale ? (
                  <p className="mt-0.5 line-clamp-2 italic">{step.rationale}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    ) : null;

  if (compact) {
    return (
      <div className={cn('space-y-1 text-center', className)}>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          <span>
            {message}
            {elapsedSeconds !== undefined ? ` (${formatElapsed(elapsedSeconds)})` : null}
          </span>
        </div>
        {streamingContent}
        <p className="text-xs italic text-muted-foreground/80">{fact}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'glass-panel flex flex-col items-center justify-center gap-3 p-12 text-center',
        className,
      )}
    >
      <Spinner className="size-6" />
      <p className="text-sm text-muted-foreground">
        {message}
        {elapsedSeconds !== undefined ? ` (${formatElapsed(elapsedSeconds)})` : null}
      </p>
      {streamingContent}
      <p className="max-w-md text-xs italic leading-relaxed text-muted-foreground/80">{fact}</p>
    </div>
  );
}
