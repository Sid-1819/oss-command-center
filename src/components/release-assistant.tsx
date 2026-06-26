'use client';

import { FileText, CheckCircle2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ReleaseAssistant() {
  const isReleaseReady = true;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Release Assistant</CardTitle>
        <CardDescription>Generate release documentation</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Release Status */}
        <Alert className="bg-secondary border-border">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full flex items-center justify-center bg-primary/20">
              <CheckCircle2 className="size-5 text-primary" />
            </div>
            <AlertDescription>
              <p className="text-sm font-semibold text-foreground">Release Ready</p>
              <p className="text-xs text-muted-foreground">All critical issues resolved</p>
            </AlertDescription>
          </div>
        </Alert>

        {/* AI Explanation */}
        <div>
          <p className="text-sm text-foreground/80 leading-relaxed">
            The repository is ready for a v3.1 release. All security patches have been merged, and the feature set is stable. Consider including the new streaming API and performance improvements in the release notes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="sm" className="flex items-center justify-center gap-2">
            <FileText className="size-4" data-icon="inline-start" />
            Release Notes
          </Button>
          <Button variant="outline" size="sm" className="flex items-center justify-center gap-2">
            <Sparkles className="size-4" data-icon="inline-start" />
            CHANGELOG
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
