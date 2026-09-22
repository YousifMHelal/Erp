import { getPublicLoginOptions } from "@/lib/login-options";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LoginBrandPanel } from "@/components/auth/login-brand-panel";
import { LoginFlow } from "@/components/auth/login-flow";
import type { LoginPageProps } from "@/types";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [{ mode, users }, params] = await Promise.all([
    getPublicLoginOptions(),
    searchParams,
  ]);
  const callbackUrl =
    typeof params.callbackUrl === "string" && params.callbackUrl.startsWith("/")
      ? params.callbackUrl
      : "/";

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <LoginBrandPanel />
      <div className="relative flex flex-col items-center justify-center gap-8 px-4 py-12">
        <div className="absolute end-4 top-4">
          <ThemeToggle />
        </div>
        <LoginFlow mode={mode} users={users} callbackUrl={callbackUrl} />
      </div>
    </div>
  );
}
