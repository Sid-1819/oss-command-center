import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LoginForm from "@/components/auth/LoginForm";
import { APP_PATH } from "@/lib/auth";
import { isDevTokenLoginAvailable } from "@/lib/auth/dev-credentials";

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
  const session = await auth();
  const { callbackUrl: rawCallbackUrl } = await searchParams;
  const callbackUrl = resolveCallbackUrl(rawCallbackUrl);

  if (session?.user?.id && session.accessToken) {
    redirect(callbackUrl);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -right-1/4 size-96 rounded-full bg-accent-primary/10 blur-3xl" />
        <div className="absolute -bottom-1/4 -left-1/4 size-96 rounded-full bg-accent-secondary/5 blur-3xl" />
      </div>

      <LoginForm
        callbackUrl={callbackUrl}
        devTokenAvailable={isDevTokenLoginAvailable()}
      />
    </main>
  );
}
