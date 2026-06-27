"use client";

import { TrendingUp } from "lucide-react";
import { HealthScoreRing } from "@/components/health-score-ring";
import { cn } from "@/lib/utils";

interface HealthScoreDeltaProps {
  previousScore: number;
  newScore?: number;
  className?: string;
}

export function HealthScoreDelta({
  previousScore,
  newScore,
  className,
}: HealthScoreDeltaProps) {
  if (newScore === undefined || Number.isNaN(newScore)) {
    return null;
  }

  const delta = newScore - previousScore;
  const improved = delta > 0;
  const unchanged = delta === 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-border/40 bg-muted/20 p-4",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <HealthScoreRing score={newScore} size="sm" gradientId="healthDeltaGradient" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <TrendingUp
              className={cn(
                "size-3.5",
                improved ? "text-primary" : "text-muted-foreground",
              )}
            />
            <p className="text-sm font-medium">
              {unchanged
                ? "Repository health unchanged"
                : improved
                  ? "Repository health improved"
                  : "Repository health updated"}
            </p>
          </div>
          <p className="text-sm tabular-nums text-muted-foreground">
            <span className="font-medium text-foreground">{previousScore}</span>
            {" → "}
            <span className="font-medium text-foreground">{newScore}</span>
            {!unchanged ? (
              <span
                className={cn(
                  "ml-1.5 font-medium",
                  improved ? "text-primary" : "text-chart-4",
                )}
              >
                ({delta > 0 ? "+" : ""}
                {delta})
              </span>
            ) : null}
          </p>
        </div>
      </div>
    </div>
  );
}
