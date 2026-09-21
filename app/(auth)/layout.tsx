import type { RootLayoutProps } from "@/types";

export default function AuthLayout({ children }: RootLayoutProps) {
  return <div className="min-h-dvh bg-background">{children}</div>;
}
