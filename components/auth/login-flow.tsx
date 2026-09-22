"use client";

import { useState } from "react";
import { UserTileGrid } from "@/components/auth/user-tile-grid";
import { PasswordStep } from "@/components/auth/password-step";
import { UsernameStep } from "@/components/auth/username-step";
import type { LoginFlowProps, LoginUserTile } from "@/types";

/**
 * Chooses the login surface from the shop's `loginMode` setting: the tile roster
 * for in-shop terminals, or a plain username field once the shop is public-facing.
 */
export function LoginFlow({ mode, users, callbackUrl }: LoginFlowProps) {
  const [selectedUser, setSelectedUser] = useState<LoginUserTile | null>(null);

  if (mode === "username") return <UsernameStep callbackUrl={callbackUrl} />;

  return selectedUser ? (
    <PasswordStep
      user={selectedUser}
      callbackUrl={callbackUrl}
      onBack={() => setSelectedUser(null)}
    />
  ) : (
    <UserTileGrid users={users} onSelect={setSelectedUser} />
  );
}
