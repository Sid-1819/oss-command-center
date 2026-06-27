import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import IssueWorkflowPage from '@/components/issue/issue-workflow-page';
import { AiLoadingPanel } from '@/components/ai-loading-panel';
import { getLoginUrl } from '@/lib/auth';

export default async function IssuePage() {
  const session = await auth();

  if (!session?.user?.id || !session.accessToken) {
    redirect(getLoginUrl('/app/issue'));
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-6">
          <AiLoadingPanel message="Loading workflow…" className="w-full max-w-md" />
        </div>
      }
    >
      <IssueWorkflowPage />
    </Suspense>
  );
}
