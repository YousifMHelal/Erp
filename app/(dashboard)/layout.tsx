import { AppShell } from "@/components/layout/app-shell";
import { getUnreadNotificationCount } from "@/actions/notifications.actions";
import type { RootLayoutProps } from "@/types";

export default async function DashboardLayout({ children }: RootLayoutProps) {
  const unreadNotificationCount = await getUnreadNotificationCount();
  return <AppShell unreadNotificationCount={unreadNotificationCount}>{children}</AppShell>;
}
