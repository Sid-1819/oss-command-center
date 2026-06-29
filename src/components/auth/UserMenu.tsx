import { signOutUser } from "@/actions/auth";
import type { ClientSessionUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-full p-0 hover:bg-white/5"
          aria-label="Account menu"
        >
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name ?? user.username}
              className="size-8 rounded-full border border-white/[0.08] object-cover"
            />
          ) : (
            <div className="flex size-8 items-center justify-center rounded-full border border-white/[0.08] bg-secondary text-[10px] font-medium">
              {getInitials(user.name, user.username)}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium text-foreground">
            {user.name ?? user.username}
          </p>
          <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOutUser} className="w-full">
            <button type="submit" className="w-full cursor-pointer text-left">
              Log out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
