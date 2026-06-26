'use client';

import { Zap, TrendingUp, Clock, Calendar, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/section-header';

function HealthRing({ score }: { score: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex size-24 items-center justify-center">
      <svg className="size-24 -rotate-90" viewBox="0 0 80 80">
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
          stroke="url(#healthGradient)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.72 0.17 162)" />
            <stop offset="100%" stopColor="oklch(0.65 0.18 250)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums">{score}</span>
        <span className="text-[10px] text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export default function MaintainerBriefing() {
  const healthScore = 78;
  const estimatedTime = 45;
  const lastAnalyzed = '2 hours ago';

  return (
    <Card className="glass-panel section-glow overflow-visible border-0 [--card-spacing:--spacing(6)]">
      <CardHeader className="pb-0">
        <SectionHeader
          icon={<Sparkles className="size-4" />}
          title="Maintainer Briefing"
          description="AI-generated analysis and recommendations for your repository"
          action={
            <Badge variant="outline" className="shrink-0 gap-1.5 border-white/[0.08] bg-secondary/50 text-muted-foreground">
              <Calendar className="size-3" />
              {lastAnalyzed}
            </Badge>
          }
        />
      </CardHeader>

      <CardContent className="pt-6">
        <div className="mb-8 rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5 p-5 ring-1 ring-white/[0.06]">
          <p className="text-[15px] leading-relaxed text-foreground/90">
            Your repository is in <span className="font-medium text-primary">good shape</span> with
            active maintenance. Recent merged PRs show feature development is on track.{' '}
            <span className="font-medium text-chart-4">3 high-priority issues</span> require attention
            before the next release. Documentation has drifted slightly from the latest API changes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="metric-tile flex items-center gap-4 md:col-span-1">
            <HealthRing score={healthScore} />
            <div>
              <div className="mb-1 flex items-center gap-1.5">
                <TrendingUp className="size-3.5 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Health Score</span>
              </div>
              <p className="text-sm font-medium text-foreground">Strong signals</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Active maintenance detected</p>
            </div>
          </div>

          <div className="metric-tile">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-chart-2/10 ring-1 ring-chart-2/20">
                <Clock className="size-4 text-chart-2" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Est. Maintenance Time</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tabular-nums">{estimatedTime}</span>
              <span className="text-sm text-muted-foreground">min</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">To address today&apos;s priorities</p>
          </div>

          <div className="metric-tile">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <Zap className="size-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Status</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-foreground">Active</span>
              <Badge className="bg-primary/15 text-primary hover:bg-primary/15">Healthy</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">3 high-priority items awaiting</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
