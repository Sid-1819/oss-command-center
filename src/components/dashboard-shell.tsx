import { Suspense } from "react";
import { auth } from "@/auth";
import Dashboard from "@/components/dashboard";
import { AiLoadingPanel } from "@/components/ai-loading-panel";
import { toClientSession } from "@/lib/auth";

export default async function DashboardShell() {
  const session = await auth();
  const user = toClientSession(session);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center px-6">
          <AiLoadingPanel message="Loading dashboard…" className="w-full max-w-md" />
        </div>
      }
    >
      <Dashboard user={user} />
    </Suspense>
  );
}
