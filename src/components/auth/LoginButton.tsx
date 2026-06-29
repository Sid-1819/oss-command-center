import { signInWithGitHub } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { APP_PATH } from "@/lib/auth";

interface LoginButtonProps {
  callbackUrl?: string;
}

export default function LoginButton({ callbackUrl = APP_PATH }: LoginButtonProps) {
  return (
    <form action={signInWithGitHub.bind(null, callbackUrl)}>
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="gap-2 border-white/[0.08] bg-secondary/50"
      >
        Sign in
      </Button>
    </form>
  );
}
