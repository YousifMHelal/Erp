"use client";

import { useTransition } from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/actions/auth.actions";
import { avatarColorClass, cn } from "@/lib/utils";
import type { UserMenuProps } from "@/types";

export function UserMenu({ className }: UserMenuProps) {
  const t = useTranslations("layout");
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const displayName = session?.user?.displayName;
  const initials = displayName?.trim().slice(0, 1);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("userMenuLabel")}
          className={cn("min-h-11 min-w-11 rounded-full", className)}
        >
          <Avatar>
            <AvatarFallback
              className={cn(
                "text-primary-foreground",
                session?.user?.id ? avatarColorClass(session.user.id) : "bg-primary",
              )}
            >
              {initials ?? <UserIcon className="size-4" aria-hidden="true" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{displayName ?? t("userMenuLabel")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserIcon />
          {t("profile")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isPending}
          onSelect={(event) => {
            event.preventDefault();
            startTransition(() => signOutAction());
          }}
        >
          <LogOut />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
