import { redirect } from "next/navigation";
import { APP_PATH, getLoginUrl } from "@/lib/auth";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

function resolveCallbackUrl(callbackUrl?: string): string {
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return APP_PATH;
  }

  return callbackUrl;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl: rawCallbackUrl } = await searchParams;
  redirect(getLoginUrl(resolveCallbackUrl(rawCallbackUrl)));
}
