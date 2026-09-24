"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { changeMyPassword } from "@/actions/profile.actions";

export function ChangePasswordForm() {
  const t = useTranslations("profile.passwordForm");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error(t("errorRequired"));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t("errorPasswordLength"));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error(t("errorPasswordMatch"));
      return;
    }
    setIsSaving(true);
    const result = await changeMyPassword({ currentPassword, newPassword, confirmNewPassword });
    setIsSaving(false);
    if (!result.success) return toast.error(result.error);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    toast.success(t("saved"));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4.5 text-muted-foreground" aria-hidden="true" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-current-password">{t("currentPasswordLabel")}</Label>
            <InputGroup>
              <InputGroupInput
                id="profile-current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                autoComplete="current-password"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  onClick={() => setShowCurrent((v) => !v)}
                  aria-label={showCurrent ? t("hidePassword") : t("showPassword")}
                >
                  {showCurrent ? <EyeOff /> : <Eye />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-new-password">{t("newPasswordLabel")}</Label>
            <InputGroup>
              <InputGroupInput
                id="profile-new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                autoComplete="new-password"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  onClick={() => setShowNew((v) => !v)}
                  aria-label={showNew ? t("hidePassword") : t("showPassword")}
                >
                  {showNew ? <EyeOff /> : <Eye />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-confirm-password">{t("confirmPasswordLabel")}</Label>
            <InputGroup>
              <InputGroupInput
                id="profile-confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                autoComplete="new-password"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="button"
                  size="icon-xs"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? t("hidePassword") : t("showPassword")}
                >
                  {showConfirm ? <EyeOff /> : <Eye />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </div>
          <Button type="submit" variant="accent" className="w-fit" disabled={isSaving}>
            {isSaving ? t("saving") : t("save")}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
