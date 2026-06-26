'use client';

import { AlertCircle, AlertOctagon, ArrowRight, ListTodo } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/section-header';
import { cn } from '@/lib/utils';

interface PriorityItem {
  id: string;
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

const priorities: PriorityItem[] = [
  {
    id: '1',
    title: 'Review PR #421 - Add streaming support',
    reason: 'Critical performance improvement awaiting final review. 3 maintainers requested changes.',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Update README after merged features',
    reason: 'Recent feature merges (hydration, RSC) not documented in quickstart guide.',
    priority: 'medium',
  },
  {
    id: '3',
    title: 'Triage 12 new issues',
    reason: 'Issues queue growing. Most are support questions needing initial response.',
    priority: 'medium',
  },
  {
    id: '4',
    title: 'Label Issue #231 as "Good First Issue"',
    reason: 'Great beginner-friendly task for new contributors. Well scoped and documented.',
    priority: 'low',
  },
];

const priorityConfig = {
  high: {
    variant: 'destructive' as const,
    icon: AlertOctagon,
    accent: 'border-l-destructive/60',
    dot: 'bg-destructive',
  },
  medium: {
    variant: 'secondary' as const,
    icon: AlertCircle,
    accent: 'border-l-chart-3/60',
    dot: 'bg-chart-3',
  },
  low: {
    variant: 'outline' as const,
    icon: AlertCircle,
    accent: 'border-l-muted-foreground/40',
    dot: 'bg-muted-foreground',
  },
};

export default function TodaysPriorities() {
  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <SectionHeader
          icon={<ListTodo className="size-4" />}
          title="Today's Priorities"
          description="Ranked by impact and urgency"
          action={
            <Badge variant="outline" className="border-white/[0.08] bg-secondary/50 tabular-nums">
              {priorities.length} items
            </Badge>
          }
        />
      </CardHeader>

      <CardContent>
        <div className="space-y-2.5">
          {priorities.map((item, index) => {
            const config = priorityConfig[item.priority];
            const Icon = config.icon;

            return (
              <div
                key={item.id}
                className={cn(
                  'group list-item-interactive border-l-2',
                  config.accent,
                  'animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards'
                )}
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary ring-1 ring-white/[0.06]">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-start justify-between gap-3">
                      <h3 className="text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                        {item.title}
                      </h3>
                      <Badge variant={config.variant} className="shrink-0 capitalize">
                        <span className={cn('mr-1 size-1.5 rounded-full', config.dot)} />
                        {item.priority}
                      </Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{item.reason}</p>
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
