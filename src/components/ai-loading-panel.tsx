'use client';

import { useEffect, useState } from 'react';
import { getRandomAiLoadingFact } from '@/lib/ai/loading-facts';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

interface AiLoadingPanelProps {
  message: string;
  elapsedSeconds?: number;
  className?: string;
  compact?: boolean;
}

export function AiLoadingPanel({
  message,
  elapsedSeconds,
  className,
  compact = false,
}: AiLoadingPanelProps) {
  const [fact, setFact] = useState(() => getRandomAiLoadingFact());

  useEffect(() => {
    setFact(getRandomAiLoadingFact());
    const intervalId = window.setInterval(() => {
      setFact(getRandomAiLoadingFact());
    }, 8000);

    return () => window.clearInterval(intervalId);
  }, []);

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
      <p className="max-w-md text-xs italic leading-relaxed text-muted-foreground/80">{fact}</p>
    </div>
  );
}
