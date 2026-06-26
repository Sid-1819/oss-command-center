'use client';

import { BookOpen, ArrowRight, FileWarning } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/section-header';
import { cn } from '@/lib/utils';

interface DocSuggestion {
  id: string;
  name: string;
  reason: string;
  severity: 'high' | 'medium' | 'low';
}

const suggestions: DocSuggestion[] = [
  {
    id: '1',
    name: 'README.md',
    reason: 'Quick start guide references deprecated API endpoints. Updated 6 weeks ago.',
    severity: 'high',
  },
  {
    id: '2',
    name: 'Installation Guide',
    reason: 'Node.js version requirement changed. Currently lists v18, should be v20+.',
    severity: 'high',
  },
  {
    id: '3',
    name: 'API Reference',
    reason: 'New streaming endpoint added but not documented. Review recent PRs.',
    severity: 'medium',
  },
  {
    id: '4',
    name: 'Contributing Guide',
    reason: 'Coding standards reference outdated TypeScript version.',
    severity: 'low',
  },
];

const severityConfig = {
  high: { variant: 'destructive' as const, accent: 'border-l-destructive/60' },
  medium: { variant: 'secondary' as const, accent: 'border-l-chart-3/60' },
  low: { variant: 'outline' as const, accent: 'border-l-muted-foreground/30' },
};

export default function DocumentationDrift() {
  const highCount = suggestions.filter((s) => s.severity === 'high').length;

  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <SectionHeader
          icon={<BookOpen className="size-4" />}
          title="Documentation Drift"
          description="Documentation likely needs updating"
          action={
            highCount > 0 ? (
              <Badge variant="destructive" className="gap-1">
                <FileWarning className="size-3" />
                {highCount} critical
              </Badge>
            ) : undefined
          }
        />
      </CardHeader>

      <CardContent>
        <div className="space-y-2.5">
          {suggestions.map((doc, index) => {
            const config = severityConfig[doc.severity];

            return (
              <div
                key={doc.id}
                className={cn(
                  'group list-item-interactive border-l-2',
                  config.accent,
                  'animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards'
                )}
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                        {doc.name}
                      </h3>
                      <Badge variant={config.variant} className="capitalize">
                        {doc.severity}
                      </Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{doc.reason}</p>
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
