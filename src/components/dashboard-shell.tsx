import { auth } from "@/auth";
import Dashboard from "@/components/dashboard";
import { toClientSession } from "@/lib/auth";

export default async function DashboardShell() {
  const session = await auth();
  const user = toClientSession(session);

  return <Dashboard user={user} />;
}
