import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DashboardShell from "@/components/dashboard-shell";
import { getLoginUrl } from "@/lib/auth";

export default async function AppPage() {
  const session = await auth();

  if (!session?.user?.id || !session.accessToken) {
    redirect(getLoginUrl("/app"));
  }

  return <DashboardShell />;
}
