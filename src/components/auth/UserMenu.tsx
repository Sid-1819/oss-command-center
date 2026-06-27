import { signOutUser } from "@/actions/auth";
import type { ClientSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

interface UserMenuProps {
  user: ClientSessionUser;
}

function getInitials(name: string | null | undefined, username: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  }

  return username.slice(0, 2).toUpperCase();
}

export default function UserMenu({ user }: UserMenuProps) {
  return (
    <div className="hidden items-center gap-2 sm:flex">
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.image}
          alt={user.name ?? user.username}
          className="size-7 rounded-full border border-white/[0.08] object-cover"
        />
      ) : (
        <div className="flex size-7 items-center justify-center rounded-full border border-white/[0.08] bg-secondary text-[10px] font-medium">
          {getInitials(user.name, user.username)}
        </div>
      )}
      <div className="min-w-0 text-right">
        {user.name ? (
          <p className="truncate text-xs font-medium text-foreground">{user.name}</p>
        ) : null}
        <p className="truncate text-[11px] text-muted-foreground">@{user.username}</p>
      </div>
      <form action={signOutUser}>
        <Button
          type="submit"
          size="sm"
          variant="ghost"
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          Log out
        </Button>
      </form>
    </div>
  );
}
