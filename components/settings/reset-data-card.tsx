"use client";

import { useState } from "react";
import { AlertTriangle, Eye, EyeOff, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { resetAllData } from "@/actions/backup.actions";
import { signOutAction } from "@/actions/auth.actions";
import { RESET_DATA_CONFIRM_PHRASE } from "@/lib/validations";

export function ResetDataCard() {
  const t = useTranslations("settings.resetData");
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  function openDialog() {
    setPassword("");
    setConfirmText("");
    setShowPassword(false);
    setOpen(true);
  }

  async function handleReset() {
    setIsResetting(true);
    try {
      const result = await resetAllData({ password, confirmPhrase: confirmText });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t("success"));
      // The signed-in account no longer exists — end the session and go to login.
      await signOutAction();
    } finally {
      setIsResetting(false);
    }
  }

  const canReset = confirmText === RESET_DATA_CONFIRM_PHRASE && password.length > 0 && !isResetting;

  return (
    <>
      <Card className="border-danger-fg/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-danger-fg">
            <AlertTriangle className="size-5" aria-hidden="true" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="destructive" onClick={openDialog} className="w-fit">
            <Trash2 />
            {t("action")}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(next) => !isResetting && setOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-danger-fg">
              <AlertTriangle className="size-5" aria-hidden="true" />
              {t("dialogTitle")}
            </DialogTitle>
            <DialogDescription>{t("dialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p className="rounded-md bg-danger-bg px-3 py-2 text-body-sm text-danger-fg">{t("warning")}</p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reset-data-password">{t("passwordLabel")}</Label>
              <InputGroup>
                <InputGroupInput
                  id="reset-data-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
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
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reset-data-confirm">{t("confirmLabel", { phrase: RESET_DATA_CONFIRM_PHRASE })}</Label>
              <Input
                id="reset-data-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={RESET_DATA_CONFIRM_PHRASE}
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isResetting}>
              {t("cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleReset} disabled={!canReset}>
              {isResetting ? t("resetting") : t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
