'use client';

import { FileText, CheckCircle2, Sparkles } from 'lucide-react';

export default function ReleaseAssistant() {
  const isReleaseReady = true;

  return (
    <div className="bg-card-bg border border-card-border rounded-2xl p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Release Assistant</h2>
          <p className="text-sm text-text-muted">Generate release documentation</p>
        </div>
      </div>

      {/* Release Status */}
      <div className="bg-background/40 rounded-lg p-4 border border-card-border/50 mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isReleaseReady ? 'bg-accent-primary/20' : 'bg-yellow-500/20'
            }`}
          >
            <CheckCircle2 className={`w-5 h-5 ${isReleaseReady ? 'text-accent-primary' : 'text-yellow-400'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold">Release Ready</p>
            <p className="text-xs text-text-muted">All critical issues resolved</p>
          </div>
        </div>
      </div>

      {/* AI Explanation */}
      <div className="mb-6">
        <p className="text-sm text-foreground/80 leading-relaxed">
          The repository is ready for a v3.1 release. All security patches have been merged, and the feature set is stable. Consider including the new streaming API and performance improvements in the release notes.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-accent-primary/10 border border-accent-primary/30 hover:bg-accent-primary/20 rounded-lg text-sm font-medium text-accent-primary transition-colors">
          <FileText className="w-4 h-4" />
          Release Notes
        </button>
        <button className="flex items-center justify-center gap-2 px-4 py-3 bg-accent-secondary/10 border border-accent-secondary/30 hover:bg-accent-secondary/20 rounded-lg text-sm font-medium text-accent-secondary transition-colors">
          <Sparkles className="w-4 h-4" />
          CHANGELOG
        </button>
      </div>
    </div>
  );
}
