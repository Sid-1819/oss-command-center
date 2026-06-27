'use client';

import { useState } from 'react';
import { Zap, GitBranch, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ExecutionControlsProps {
  isExecuting: boolean;
  canExecute: boolean;
  onExecute: () => void;
  onCancel: () => void;
}

export function ExecutionControls({
  isExecuting,
  canExecute,
  onExecute,
  onCancel,
}: ExecutionControlsProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [useNewBranch, setUseNewBranch] = useState(false);

  return (
    <Card className="glass-panel border-0">
      <CardHeader>
        <p className="text-sm font-medium">Ready to Execute?</p>
        <p className="text-xs text-muted-foreground mt-1">
          Review all proposed changes above. Once executed, changes will be applied to your repository.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Safety Options */}
        <div className="space-y-3">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="w-full rounded-lg border border-border/50 bg-muted/20 p-3 text-left hover:bg-muted/30 transition-colors"
          >
            <p className="text-sm font-medium text-foreground">Execution Options</p>
            <p className="text-xs text-muted-foreground mt-0.5">Choose how to apply changes</p>
          </button>

          {showOptions && (
            <div className="space-y-2 rounded-lg bg-muted/10 border border-border/30 p-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useNewBranch}
                  onChange={(e) => setUseNewBranch(e.target.checked)}
                  className="size-4 rounded"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Create new branch</p>
                  <p className="text-xs text-muted-foreground">
                    Creates a feature branch instead of modifying main
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isExecuting}
            className="w-full"
          >
            Cancel
          </Button>

          <Button
            onClick={onExecute}
            disabled={isExecuting || !canExecute}
            className={`w-full ${!canExecute ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isExecuting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Executing...
              </>
            ) : (
              <>
                <Zap className="size-4 mr-2" />
                Execute Now
              </>
            )}
          </Button>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/30">
          <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 text-center">
            <p className="text-2xl">🔒</p>
            <p className="text-xs font-medium text-primary mt-1">Sandboxed</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tested safely</p>
          </div>
          <div className="rounded-lg bg-chart-3/5 border border-chart-3/10 p-3 text-center">
            <p className="text-2xl">↩️</p>
            <p className="text-xs font-medium text-chart-3 mt-1">Reversible</p>
            <p className="text-xs text-muted-foreground mt-0.5">Can rollback</p>
          </div>
          <div className="rounded-lg bg-accent/5 border border-accent/10 p-3 text-center">
            <p className="text-2xl">👁️</p>
            <p className="text-xs font-medium text-accent-foreground mt-1">Reviewable</p>
            <p className="text-xs text-muted-foreground mt-0.5">Create PR</p>
          </div>
        </div>

        {!canExecute && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3">
            <p className="text-sm text-destructive font-medium">
              ⚠️ Cannot execute: Please fix failed pre-flight checks first.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
