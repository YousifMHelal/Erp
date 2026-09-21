import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserTileProps } from "@/types";

export function UserTile({ user, onSelect }: UserTileProps) {
  const initials = user.displayName.trim().slice(0, 1);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex min-h-11 flex-col items-center gap-2 rounded-md p-3 text-center transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Avatar size="lg" className="size-16">
        <AvatarFallback
          style={{ backgroundColor: user.avatarColor }}
          className="text-h2 font-semibold text-white"
        >
          {initials}
        </AvatarFallback>
      </Avatar>
      <span className="flex flex-col">
        <span className="text-body-sm font-medium text-foreground">{user.displayName}</span>
        <span className="text-caption text-muted-foreground">{user.roleName}</span>
      </span>
    </button>
  );
}
