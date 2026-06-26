'use client';

import { FileText, CheckCircle2, Sparkles, Rocket } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/section-header';

export default function ReleaseAssistant() {
  return (
    <Card className="glass-panel glass-panel-hover border-0">
      <CardHeader>
        <SectionHeader
          icon={<Rocket className="size-4" />}
          title="Release Assistant"
          description="Generate release documentation"
          action={
            <Badge className="gap-1.5 bg-primary/15 text-primary hover:bg-primary/15">
              <CheckCircle2 className="size-3" />
              Ready
            </Badge>
          }
        />
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 ring-1 ring-primary/20">
          <div className="absolute -right-4 -top-4 size-24 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 ring-1 ring-primary/30">
              <CheckCircle2 className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Release Ready — v3.1</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                All critical issues resolved · Feature set stable
              </p>
            </div>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          The repository is ready for a v3.1 release. All security patches have been merged, and the
          feature set is stable. Consider including the new streaming API and performance improvements
          in the release notes.
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-white/[0.08] bg-secondary/40 hover:bg-secondary/70"
          >
            <FileText className="size-3.5" data-icon="inline-start" />
            Release Notes
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-white/[0.08] bg-secondary/40 hover:bg-secondary/70"
          >
            <Sparkles className="size-3.5" data-icon="inline-start" />
            CHANGELOG
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
