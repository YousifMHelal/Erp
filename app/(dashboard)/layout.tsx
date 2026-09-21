import { AppShell } from "@/components/layout/app-shell";
import type { RootLayoutProps } from "@/types";

export default function DashboardLayout({ children }: RootLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
