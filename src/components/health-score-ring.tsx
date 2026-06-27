"use client";

import { cn } from "@/lib/utils";

interface HealthScoreRingProps {
  score: number;
  size?: "sm" | "md";
  gradientId?: string;
  className?: string;
}

export function HealthScoreRing({
  score,
  size = "md",
  gradientId = "healthGradient",
  className,
}: HealthScoreRingProps) {
  const radius = size === "sm" ? 28 : 36;
  const dimension = size === "sm" ? "size-16" : "size-24";
  const scoreText = size === "sm" ? "text-lg" : "text-2xl";
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center", dimension, className)}>
      <svg className={cn("-rotate-90", dimension)} viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-secondary"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.72 0.17 162)" />
            <stop offset="100%" stopColor="oklch(0.65 0.18 250)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold tabular-nums", scoreText)}>{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}
