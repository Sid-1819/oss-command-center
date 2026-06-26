'use client';

import { Zap, TrendingUp, Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function MaintainerBriefing() {
  const healthScore = 78;
  const estimatedTime = 45;
  const lastAnalyzed = '2 hours ago';

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl lg:text-3xl">Maintainer Briefing</CardTitle>
            <CardDescription className="mt-2">AI-generated analysis and recommendations for your repository</CardDescription>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="size-3" />
            {lastAnalyzed}
          </div>
        </div>
      </CardHeader>

      <Separator className="bg-border" />

      <CardContent className="pt-6">
        {/* Summary Section */}
        <div className="mb-8 pb-8 border-b border-border">
          <p className="text-base leading-relaxed text-foreground/90">
            Your repository is in good shape with active maintenance. Recent merged PRs show feature development is on track. 3 high-priority issues require attention before the next release. Documentation has drifted slightly from the latest API changes. Consider scheduling time to address contributor feedback and triage new issues.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Health Score */}
          <div className="bg-secondary rounded-lg p-6 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="size-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Repository Health Score</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{healthScore}</span>
              <span className="text-sm text-muted-foreground mb-1">/100</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Strong maintenance signals detected</p>
          </div>

          {/* Estimated Time */}
          <div className="bg-secondary rounded-lg p-6 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <Clock className="size-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Est. Maintenance Time</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold">{estimatedTime}</span>
              <span className="text-sm text-muted-foreground mb-1">minutes</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3">To address today&apos;s priorities</p>
          </div>

          {/* Status */}
          <div className="bg-secondary rounded-lg p-6 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <div className="size-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <Zap className="size-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Status</span>
            </div>
            <p className="text-base font-semibold text-foreground">Active</p>
            <p className="text-xs text-muted-foreground mt-3">3 high-priority items awaiting</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
