'use client';

import { useState } from 'react';
import { ChevronDown, File, Plus, Minus, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { FileChange } from '@/types/execution-workflow';

interface ChangesetPreviewProps {
  changes: FileChange[];
  isExpanded: boolean;
  onToggle: () => void;
}

export function ChangesetPreview({ changes, isExpanded, onToggle }: ChangesetPreviewProps) {
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  const toggleFile = (path: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const actionIcons = {
    create: <Plus className="size-4 text-chart-3" />,
    modify: <Edit2 className="size-4 text-primary" />,
    delete: <Minus className="size-4 text-destructive" />,
  };

  const actionLabels = {
    create: 'Created',
    modify: 'Modified',
    delete: 'Deleted',
  };

  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <div className="flex items-center justify-between cursor-pointer" onClick={onToggle}>
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Proposed Changes</CardTitle>
            <Badge variant="outline">{changes.length} files</Badge>
          </div>
          <ChevronDown
            className={`size-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-2">
          {changes.map((change) => (
            <div key={change.path} className="space-y-2">
              <div
                className="group list-item-interactive flex items-center justify-between cursor-pointer"
                onClick={() => toggleFile(change.path)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <File className="size-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-black/20 px-2 py-1 rounded truncate">
                        {change.path}
                      </code>
                      {actionIcons[change.action]}
                      <Badge variant="ghost" className="text-xs">
                        {actionLabels[change.action]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{change.summary}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {change.linesAdded > 0 && (
                    <span className="text-xs font-medium text-chart-3">+{change.linesAdded}</span>
                  )}
                  {change.linesRemoved > 0 && (
                    <span className="text-xs font-medium text-destructive">-{change.linesRemoved}</span>
                  )}
                  <ChevronDown
                    className={`size-4 transition-transform ${
                      expandedFiles[change.path] ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {expandedFiles[change.path] && (
                <div className="ml-4 rounded-lg bg-muted/20 p-3 space-y-2">
                  {change.action === 'create' && change.afterContent && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-chart-3">New Content</p>
                      <pre className="text-xs bg-black/40 rounded p-2 overflow-auto max-h-48 text-foreground/80">
                        {change.afterContent}
                      </pre>
                    </div>
                  )}

                  {change.action === 'modify' && (
                    <div className="space-y-2">
                      {change.beforeContent && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-destructive">Before</p>
                          <pre className="text-xs bg-black/40 rounded p-2 overflow-auto max-h-32 text-foreground/60">
                            {change.beforeContent}
                          </pre>
                        </div>
                      )}
                      {change.afterContent && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-chart-3">After</p>
                          <pre className="text-xs bg-black/40 rounded p-2 overflow-auto max-h-32 text-foreground/80">
                            {change.afterContent}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {change.action === 'delete' && change.beforeContent && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-destructive">Deleted Content</p>
                      <pre className="text-xs bg-black/40 rounded p-2 overflow-auto max-h-48 text-foreground/60">
                        {change.beforeContent}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
