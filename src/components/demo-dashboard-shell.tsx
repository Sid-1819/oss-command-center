import { auth } from "@/auth";
import Dashboard from "@/components/dashboard";
import { toClientSession } from "@/lib/auth";

interface DemoDashboardShellProps {
  repositoryRef: string;
}

export default async function DemoDashboardShell({
  repositoryRef,
}: DemoDashboardShellProps) {
  const session = await auth();
  const user = toClientSession(session);

  return (
    <Dashboard user={user} initialRepositoryRef={repositoryRef} demoMode />
  );
}
