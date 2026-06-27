'use client';

import { FileText, Lightbulb, Rocket, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { RecommendedAction } from '@/types/action-run';

interface NextRecommendedActionsProps {
  actions: RecommendedAction[];
  onExecuteReadme?: (suggestion: string) => void;
}

const categoryLabels: Record<RecommendedAction['category'], string> = {
  documentation: 'Documentation',
  priority: 'Priority',
  release: 'Release',
  contributor: 'Contributor',
  recommendation: 'Recommendation',
};

function CategoryIcon({ category }: { category: RecommendedAction['category'] }) {
  switch (category) {
    case 'documentation':
      return <FileText className="size-4 text-primary" />;
    case 'priority':
      return <Lightbulb className="size-4 text-chart-3" />;
    case 'release':
      return <Rocket className="size-4 text-chart-4" />;
    case 'contributor':
      return <Users className="size-4 text-chart-2" />;
    default:
      return <Lightbulb className="size-4 text-muted-foreground" />;
  }
}

export function NextRecommendedActions({
  actions,
  onExecuteReadme,
}: NextRecommendedActionsProps) {
  if (actions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No additional recommended actions at this time.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <div
          key={action.id}
          className="rounded-lg border border-border/40 bg-muted/20 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <CategoryIcon category={action.category} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium">{action.title}</p>
                <Badge variant="outline" className="text-xs">
                  {categoryLabels[action.category]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{action.reason}</p>
              {action.executable && action.actionType === 'readme' && action.payload ? (
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => onExecuteReadme?.(action.payload!.suggestion)}
                >
                  Update README
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
