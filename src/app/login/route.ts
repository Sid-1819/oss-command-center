import { NextRequest } from "next/server";
import { auth, signIn } from "@/auth";
import { APP_PATH } from "@/lib/auth";
import { redirect } from "next/navigation";

function resolveCallbackUrl(callbackUrl: string | null): string {
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return APP_PATH;
  }

  return callbackUrl;
}

export async function GET(request: NextRequest) {
  const callbackUrl = resolveCallbackUrl(request.nextUrl.searchParams.get("callbackUrl"));
  const session = await auth();

  if (session?.user) {
    redirect(callbackUrl);
  }

  await signIn("github", { redirectTo: callbackUrl });
}
