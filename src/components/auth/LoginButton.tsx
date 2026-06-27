import { signInWithGitHub } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export default function LoginButton() {
  return (
    <form action={signInWithGitHub}>
      <Button
        type="submit"
        size="sm"
        variant="outline"
        className="gap-2 border-white/[0.08] bg-secondary/50"
      >
        Continue with GitHub
      </Button>
    </form>
  );
}
