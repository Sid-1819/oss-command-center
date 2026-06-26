'use client';

import { BookOpen, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

function getSeverityVariant(severity: string) {
  switch (severity) {
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

export default function DocumentationDrift() {
  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="size-5" />
          <div>
            <CardTitle>Documentation Drift</CardTitle>
            <CardDescription>Documentation likely needs updating</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {suggestions.map((doc) => (
            <div key={doc.id} className="border border-border rounded-lg p-4 group cursor-pointer transition-all hover:border-primary/50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                      {doc.name}
                    </h3>
                    <Badge variant={getSeverityVariant(doc.severity)}>
                      {doc.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{doc.reason}</p>
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
