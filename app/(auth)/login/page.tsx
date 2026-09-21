"use client";

import { useState } from "react";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LoginBrandPanel } from "@/components/auth/login-brand-panel";
import { UserTileGrid } from "@/components/auth/user-tile-grid";
import { PasswordStep } from "@/components/auth/password-step";
import type { LoginUserTile } from "@/types";

const SAMPLE_USERS: LoginUserTile[] = [
  { id: "1", displayName: "أحمد سعيد", roleName: "مدير", avatarColor: "#2A2F6B" },
  { id: "2", displayName: "منى فتحي", roleName: "محاسب", avatarColor: "#14B8A6" },
  { id: "3", displayName: "كريم عادل", roleName: "كاشير", avatarColor: "#5F6ABB" },
  { id: "4", displayName: "سارة حسن", roleName: "كاشير", avatarColor: "#0E9788" },
];

export default function LoginPage() {
  const [selectedUser, setSelectedUser] = useState<LoginUserTile | null>(null);

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <LoginBrandPanel />
      <div className="relative flex flex-col items-center justify-center gap-8 px-4 py-12">
        <div className="absolute end-4 top-4">
          <ThemeToggle />
        </div>
        {selectedUser ? (
          <PasswordStep user={selectedUser} onBack={() => setSelectedUser(null)} />
        ) : (
          <UserTileGrid users={SAMPLE_USERS} onSelect={setSelectedUser} />
        )}
      </div>
    </div>
  );
}
