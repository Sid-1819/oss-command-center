'use client';

import { AlertCircle, AlertOctagon, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

function getPriorityVariant(priority: string) {
  switch (priority) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'outline';
  }
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'high':
      return <AlertOctagon className="size-5" />;
    case 'medium':
      return <AlertCircle className="size-5" />;
    default:
      return <AlertCircle className="size-5" />;
  }
}

export default function TodaysPriorities() {
  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Today&apos;s Priorities</CardTitle>
        <CardDescription>Ranked by impact and urgency</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {priorities.map((item) => (
            <div
              key={item.id}
              className="border border-border rounded-lg p-4 transition-all hover:border-primary/50 group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5">{getPriorityIcon(item.priority)}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <Badge variant={getPriorityVariant(item.priority)}>
                      {item.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.reason}</p>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100"
                >
                  <ArrowRight className="size-4" data-icon="inline-end" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
