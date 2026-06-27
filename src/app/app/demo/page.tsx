import { redirect } from "next/navigation";
import { auth } from "@/auth";
import DemoDashboardShell from "@/components/demo-dashboard-shell";
import { getLoginUrl } from "@/lib/auth";
import { DEMO_REPOSITORY_REF } from "@/lib/demo/mock-execution";

export default async function DemoAppPage() {
  const session = await auth();

  if (!session?.user?.id || !session.accessToken) {
    redirect(getLoginUrl("/app/demo"));
  }

  return <DemoDashboardShell repositoryRef={DEMO_REPOSITORY_REF} />;
}
