'use client';

import { ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface DiffPreviewProps {
  diff: string;
  fileName: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function DiffLine({ line }: { line: string }) {
  if (line.startsWith('+') && !line.startsWith('+++')) {
    return (
      <div className="text-chart-3 bg-chart-3/10 px-2">{line}</div>
    );
  }

  if (line.startsWith('-') && !line.startsWith('---')) {
    return (
      <div className="text-destructive bg-destructive/10 px-2">{line}</div>
    );
  }

  if (line.startsWith('---') || line.startsWith('+++')) {
    return (
      <div className="text-muted-foreground bg-muted/30 px-2 font-semibold">{line}</div>
    );
  }

  return <div className="text-foreground/70 px-2">{line}</div>;
}

export function DiffPreview({ diff, fileName, isExpanded, onToggle }: DiffPreviewProps) {
  const lines = diff.split('\n').filter((line, index, array) => {
    return line.length > 0 || index < array.length - 1;
  });

  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <div
          className="flex cursor-pointer items-center justify-between"
          onClick={onToggle}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onToggle();
            }
          }}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Unified Diff</CardTitle>
            <Badge variant="outline">{fileName}</Badge>
          </div>
          <ChevronDown
            className={`size-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </CardHeader>

      {isExpanded ? (
        <CardContent>
          <div className="max-h-96 overflow-auto rounded-lg border border-muted/30 bg-black/40 font-mono text-xs">
            {lines.map((line, index) => (
              <DiffLine key={`${index}-${line.slice(0, 20)}`} line={line} />
            ))}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
