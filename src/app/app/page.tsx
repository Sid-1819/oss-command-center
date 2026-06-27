import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLoginUrl } from "@/lib/auth";
import Workspace from "@/components/workspace";

export default async function AppPage() {
  const session = await auth();

  if (!session?.user?.id || !session.accessToken) {
    redirect(getLoginUrl("/app"));
  }

  return <Workspace user={session.user} />;
}
