import { GitBranch } from "lucide-react";
import Link from "next/link";
import { signInWithDevToken, signInWithGitHub } from "@/actions/auth";
import { Button } from "@/components/ui/button";

interface LoginFormProps {
  callbackUrl: string;
  devTokenAvailable: boolean;
}

export default function LoginForm({
  callbackUrl,
  devTokenAvailable,
}: LoginFormProps) {
  return (
    <div className="glass-panel w-full max-w-md p-8">
      <div className="mb-8 text-center">
        <Link href="/landing" className="inline-flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-accent-primary to-accent-secondary text-white">
            <GitBranch className="size-4" />
          </div>
          <span className="font-heading text-lg font-bold">MaintainerOS</span>
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Sign in to your workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect GitHub to manage repositories, triage issues, and run AI workflows.
        </p>
      </div>

      <div className="space-y-3">
        {devTokenAvailable ? (
          <form action={signInWithDevToken.bind(null, callbackUrl)}>
            <Button
              type="submit"
              className="h-11 w-full bg-accent-primary text-black hover:bg-accent-primary/90"
            >
              Continue with dev token
            </Button>
          </form>
        ) : null}

        <form action={signInWithGitHub.bind(null, callbackUrl)}>
          <Button
            type="submit"
            variant={devTokenAvailable ? "outline" : "default"}
            className={
              devTokenAvailable
                ? "h-11 w-full border-white/10 bg-transparent hover:bg-white/5"
                : "h-11 w-full bg-accent-primary text-black hover:bg-accent-primary/90"
            }
          >
            Continue with GitHub
          </Button>
        </form>
      </div>

      {devTokenAvailable ? (
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Development mode uses <code className="text-foreground">GITHUB_TOKEN</code> from your local{" "}
          <code className="text-foreground">.env</code> file.
        </p>
      ) : null}
    </div>
  );
}
