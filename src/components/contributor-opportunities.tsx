'use client';

import { Code2, ArrowRight, Zap, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/section-header';
import { cn } from '@/lib/utils';

interface Opportunity {
  id: string;
  issueNumber: number;
  title: string;
  reason: string;
  effort: 'small' | 'medium' | 'large';
}

const opportunities: Opportunity[] = [
  {
    id: '1',
    issueNumber: 892,
    title: 'Add dark mode toggle to sidebar',
    reason: 'Great UI/UX task for beginners. Clear acceptance criteria and isolated component.',
    effort: 'small',
  },
  {
    id: '2',
    issueNumber: 1043,
    title: 'Create TypeScript example in docs',
    reason: 'Perfect for learning project structure. No dependencies on other systems.',
    effort: 'medium',
  },
  {
    id: '3',
    issueNumber: 756,
    title: 'Add unit tests for utils/helpers',
    reason: 'Self-contained testing task. Great way to learn test patterns used in codebase.',
    effort: 'small',
  },
  {
    id: '4',
    issueNumber: 1101,
    title: 'Improve error messages',
    reason: 'Improve developer experience by making error messages more helpful.',
    effort: 'medium',
  },
];

const effortConfig = {
  small: { variant: 'default' as const, label: 'Small effort', color: 'text-primary' },
  medium: { variant: 'secondary' as const, label: 'Medium effort', color: 'text-chart-3' },
  large: { variant: 'destructive' as const, label: 'Large effort', color: 'text-destructive' },
};

export default function ContributorOpportunities() {
  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <SectionHeader
          icon={<Users className="size-4" />}
          title="Contributor Opportunities"
          description="Beginner-friendly issues to invite contributors"
          action={
            <Badge variant="outline" className="gap-1 border-white/[0.08] bg-secondary/50">
              <Code2 className="size-3" />
              {opportunities.length} open
            </Badge>
          }
        />
      </CardHeader>

      <CardContent>
        <div className="space-y-2.5">
          {opportunities.map((opp, index) => {
            const config = effortConfig[opp.effort];

            return (
              <div
                key={opp.id}
                className={cn(
                  'group list-item-interactive animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards'
                )}
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground ring-1 ring-white/[0.06]">
                        #{opp.issueNumber}
                      </span>
                      <h3 className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                        {opp.title}
                      </h3>
                    </div>
                    <p className="mb-2.5 text-xs leading-relaxed text-muted-foreground">
                      {opp.reason}
                    </p>
                    <Badge variant={config.variant}>
                      <Zap className={cn('size-3', config.color)} data-icon="inline-start" />
                      {config.label}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
