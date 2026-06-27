'use client';

import { ExternalLink, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MaintenanceAction } from '@/types/execution-workflow';

interface PlanCardProps {
  action: MaintenanceAction;
}

export function PlanCard({ action }: PlanCardProps) {
  const typeIcons: Record<string, string> = {
    documentation: '📄',
    cleanup: '🧹',
    'update-deps': '📦',
    configuration: '⚙️',
  };

  const typeLabels: Record<string, string> = {
    documentation: 'Documentation',
    cleanup: 'Cleanup',
    'update-deps': 'Dependencies',
    configuration: 'Configuration',
  };

  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="secondary" className="w-fit">
                {typeLabels[action.type]}
              </Badge>
              <span className="text-2xl">{typeIcons[action.type]}</span>
            </div>
            <CardTitle className="text-lg">{action.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Repository context */}
        <div className="rounded-lg bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Repository</p>
          <a
            href={action.repositoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-primary hover:underline w-fit"
          >
            <code className="text-xs bg-black/20 px-2 py-1 rounded">{action.repository}</code>
            <ExternalLink className="size-3" />
          </a>
        </div>

        {/* AI Reasoning */}
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
          <div className="flex items-start gap-3">
            <Lightbulb className="size-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary mb-1">Why this action?</p>
              <p className="text-sm text-foreground leading-relaxed">{action.reasoning}</p>
            </div>
          </div>
        </div>

        {/* Change Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/40 p-3 text-center">
            <p className="text-2xl font-semibold text-primary">{action.proposedChanges.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Files Modified</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3 text-center">
            <p className="text-2xl font-semibold text-chart-3">
              {action.proposedChanges.reduce((sum, c) => sum + c.linesAdded, 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Lines Added</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3 text-center">
            <p className="text-2xl font-semibold text-destructive">
              {action.proposedChanges.reduce((sum, c) => sum + c.linesRemoved, 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Lines Removed</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">Status ready for review</p>
          <div className="flex items-center gap-1.5">
            <div className="size-2 bg-primary rounded-full animate-pulse" />
            <span className="text-xs font-medium text-primary capitalize">{action.status}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
