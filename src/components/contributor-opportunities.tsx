'use client';

import { Code2, ArrowRight, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

function getEffortVariant(effort: string) {
  switch (effort) {
    case 'small':
      return 'default';
    case 'medium':
      return 'secondary';
    case 'large':
      return 'destructive';
    default:
      return 'outline';
  }
}

function getEffortLabel(effort: string) {
  switch (effort) {
    case 'small':
      return 'Small effort';
    case 'medium':
      return 'Medium effort';
    case 'large':
      return 'Large effort';
    default:
      return 'Unknown';
  }
}

export default function ContributorOpportunities() {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Code2 className="size-5" />
          <div>
            <CardTitle>Contributor Opportunities</CardTitle>
            <CardDescription>Beginner-friendly issues to invite contributors</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              className="border border-border rounded-lg p-4 group cursor-pointer hover:border-primary/50 transition-all bg-secondary"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-muted-foreground">#{opp.issueNumber}</span>
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {opp.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">{opp.reason}</p>
                  <Badge variant={getEffortVariant(opp.effort)}>
                    <Zap className="size-3 mr-1" data-icon="inline-start" />
                    {getEffortLabel(opp.effort)}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100"
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
