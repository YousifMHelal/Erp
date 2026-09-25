"use client";

import { useTransition } from "react";
import { LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export function UserMenu({ className, currentUser }: UserMenuProps) {
  const t = useTranslations("layout");
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  // Prefer the fresh DB copy from the layout: the session token keeps the name from login time.
  const displayName = currentUser?.displayName ?? session?.user?.displayName;
  const userId = currentUser?.id ?? session?.user?.id;
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
            {currentUser?.avatarUrl && (
              <AvatarImage src={currentUser.avatarUrl} alt={displayName ?? ""} className="object-cover" />
            )}
            <AvatarFallback
              className={cn(
                "text-primary-foreground",
                userId ? avatarColorClass(userId) : "bg-primary",
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
        <DropdownMenuItem asChild>
          <Link href="/settings/profile">
            <UserIcon />
            {t("profile")}
          </Link>
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
