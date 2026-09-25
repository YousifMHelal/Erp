import { AppShell } from "@/components/layout/app-shell";
import { getUnreadNotificationCount } from "@/actions/notifications.actions";
import { getCurrentUser } from "@/lib/auth-guard";
import type { RootLayoutProps } from "@/types";

export default async function DashboardLayout({ children }: RootLayoutProps) {
  const [unreadNotificationCount, user] = await Promise.all([getUnreadNotificationCount(), getCurrentUser()]);
  const currentUser = user
    ? { id: user.id, displayName: user.displayName, avatarUrl: user.avatarUrl ?? undefined }
    : undefined;
  return (
    <AppShell unreadNotificationCount={unreadNotificationCount} currentUser={currentUser}>
      {children}
    </AppShell>
  );
}
