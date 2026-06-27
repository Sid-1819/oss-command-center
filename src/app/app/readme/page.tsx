import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import DocWorkflowPage from '@/components/doc/doc-workflow-page';
import { getLoginUrl } from '@/lib/auth';
import { Spinner } from '@/components/ui/spinner';

export default async function ReadmePage() {
  const session = await auth();

  if (!session?.user?.id || !session.accessToken) {
    redirect(getLoginUrl('/app/readme'));
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="size-6" />
        </div>
      }
    >
      <DocWorkflowPage defaultFile="README.md" />
    </Suspense>
  );
}
