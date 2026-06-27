'use client';

import { BookOpen, ArrowRight, FileWarning } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/section-header';
import {
  DashboardEmptyState,
  type DashboardSectionStateProps,
} from '@/components/dashboard-section-state';
import { normalizeDocumentationFiles } from '@/lib/maintainer-briefing-utils';
import type { MaintainerBriefing } from '@/types/maintainer-briefing';

interface DocumentationDriftProps extends DashboardSectionStateProps {
  documentation?: MaintainerBriefing['documentation'];
  onUpdateDoc?: (targetFile: string, suggestion: string) => void;
}

function DocumentationDriftSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-16 rounded-xl" />
      ))}
    </div>
  );
}

export default function DocumentationDrift({
  documentation,
  isLoading,
  isEmpty,
  onUpdateDoc,
}: DocumentationDriftProps) {
  const fileSuggestions = documentation
    ? normalizeDocumentationFiles(documentation).flatMap((file) =>
        file.suggestions.map((suggestion) => ({
          path: file.path,
          suggestion,
        })),
      )
    : [];
  const canUpdate = Boolean(onUpdateDoc) && !isLoading && !isEmpty;

  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <SectionHeader
          icon={<BookOpen className="size-4" />}
          title="Documentation Drift"
          description="Documentation likely needs updating"
          action={
            documentation?.outdated ? (
              <Badge variant="destructive" className="gap-1">
                <FileWarning className="size-3" />
                {fileSuggestions.length} suggestion{fileSuggestions.length === 1 ? '' : 's'}
              </Badge>
            ) : undefined
          }
        />
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <DocumentationDriftSkeleton />
        ) : isEmpty || !documentation ? (
          <DashboardEmptyState />
        ) : fileSuggestions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No documentation updates suggested.
          </p>
        ) : (
          <div className="space-y-2.5">
            {fileSuggestions.map((item, index) => (
              <div
                key={`${item.path}-${item.suggestion}-${index}`}
                className="group list-item-interactive border-l-2 border-l-chart-3/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{item.path}</p>
                    <p className="text-sm font-medium leading-relaxed text-foreground transition-colors group-hover:text-primary">
                      {item.suggestion}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!canUpdate}
                    onClick={() => onUpdateDoc?.(item.path, item.suggestion)}
                    className="shrink-0 gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    Update {item.path}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
