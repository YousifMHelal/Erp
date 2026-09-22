"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { signInWithCredentials } from "@/actions/auth.actions";
import { avatarColorClass, cn } from "@/lib/utils";
import type { PasswordStepProps } from "@/types";

export function PasswordStep({ user, callbackUrl, onBack }: PasswordStepProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const initials = user.displayName.trim().slice(0, 1);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signInWithCredentials({ userId: user.id, password });
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
      <button
        type="button"
        onClick={onBack}
        className="flex w-fit items-center gap-1.5 text-body-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        {t("backToUsers")}
      </button>

      <div className="flex flex-col items-center gap-3">
        <Avatar size="lg" className="size-16">
          <AvatarFallback
            className={cn("text-h2 font-semibold text-primary-foreground", avatarColorClass(user.id))}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="text-center">
          <p className="text-h3 font-semibold">{user.displayName}</p>
          <p className="text-body-sm text-muted-foreground">{user.roleName}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="login-password">{t("passwordLabel")}</Label>
        <InputGroup>
          <InputGroupInput
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "login-password-error" : undefined}
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
          <p id="login-password-error" role="alert" className="text-body-sm text-danger-fg">
            {error}
          </p>
        ) : null}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={isPending || password.length === 0}
        className="w-full"
      >
        {isPending ? t("signingIn") : t("signIn")}
      </Button>
    </form>
  );
}
