"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { signInWithCredentials } from "@/actions/auth.actions";
import type { UsernameStepProps } from "@/types";

/** Roster-free login for public deployments (`loginMode = "username"`). */
export function UsernameStep({ callbackUrl }: UsernameStepProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signInWithCredentials({ username, password });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.replace(callbackUrl);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-6">
      <div className="text-center">
        <h1 className="text-h1">{t("usernameTitle")}</h1>
        <p className="text-body text-muted-foreground">{t("usernameSubtitle")}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="login-username">{t("usernameLabel")}</Label>
        <Input
          id="login-username"
          autoFocus
          autoComplete="username"
          dir="ltr"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t("usernamePlaceholder")}
          aria-invalid={error ? true : undefined}
          className="text-start"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="login-password">{t("passwordLabel")}</Label>
        <InputGroup>
          <InputGroupInput
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "login-error" : undefined}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="button"
              size="icon-xs"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        {error ? (
          <p id="login-error" role="alert" className="text-body-sm text-danger-fg">
            {error}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isPending || !username.trim() || !password}
        className="w-full"
      >
        {isPending ? t("signingIn") : t("signIn")}
      </Button>
    </form>
  );
}
