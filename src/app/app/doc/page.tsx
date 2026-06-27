import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import DocWorkflowPage from '@/components/doc/doc-workflow-page';
import { AiLoadingPanel } from '@/components/ai-loading-panel';
import { getLoginUrl } from '@/lib/auth';

export default async function DocPage() {
  const session = await auth();

  if (!session?.user?.id || !session.accessToken) {
    redirect(getLoginUrl('/app/doc'));
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-6">
          <AiLoadingPanel message="Loading workflow…" className="w-full max-w-md" />
        </div>
      }
    >
      <DocWorkflowPage />
    </Suspense>
  );
}
