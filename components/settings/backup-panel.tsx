"use client";

import { useRef, useState } from "react";
import { AlertTriangle, DatabaseBackup, Download, Eye, EyeOff, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { restoreBackup } from "@/actions/backup.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";

const CONFIRM_PHRASE = "استعادة النسخة الاحتياطية";

export function BackupPanel() {
  const t = useTranslations("settings.backup");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | undefined>();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const response = await fetch("/api/backup/export");
      if (!response.ok) {
        toast.error(t("exportFailed"));
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch = /filename="([^"]+)"/.exec(disposition);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filenameMatch?.[1] ?? "teba-backup.json";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toast.success(t("exportSuccess"));
    } catch {
      toast.error(t("exportFailed"));
    } finally {
      setIsExporting(false);
    }
  }

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPendingFile(file);
    setPassword("");
    setConfirmText("");
    setDialogOpen(true);
  }

  function closeDialog(open: boolean) {
    if (isRestoring) return;
    setDialogOpen(open);
    if (!open) setPendingFile(undefined);
  }

  async function handleRestore() {
    if (!pendingFile || confirmText !== CONFIRM_PHRASE || !password) return;
    setIsRestoring(true);
    try {
      const fileContent = await pendingFile.text();
      const result = await restoreBackup({ password, fileContent });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t("restoreSuccess"));
      setDialogOpen(false);
      setPendingFile(undefined);
      window.location.assign("/");
    } finally {
      setIsRestoring(false);
    }
  }

  const canRestore = confirmText === CONFIRM_PHRASE && password.length > 0 && !isRestoring;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseBackup className="size-5 text-muted-foreground" />
            {t("title")}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-body font-medium">{t("exportTitle")}</p>
              <p className="text-body-sm text-muted-foreground">{t("exportDescription")}</p>
            </div>
            <Button type="button" variant="accent" onClick={handleExport} disabled={isExporting} className="w-fit">
              <Download />
              {isExporting ? t("exporting") : t("exportAction")}
            </Button>
          </div>
          <div className="flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-body font-medium">{t("restoreTitle")}</p>
              <p className="text-body-sm text-muted-foreground">{t("restoreDescription")}</p>
            </div>
            <Button type="button" variant="destructive" onClick={() => fileInputRef.current?.click()} className="w-fit">
              <Upload />
              {t("restoreAction")}
            </Button>
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileChosen} />
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-danger-fg">
              <AlertTriangle className="size-5" />
              {t("restoreDialogTitle")}
            </DialogTitle>
            <DialogDescription>{t("restoreDialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p className="rounded-md bg-danger-bg px-3 py-2 text-body-sm text-danger-fg">
              {t("restoreWarning", { fileName: pendingFile?.name ?? "" })}
            </p>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="backup-restore-password">{t("passwordLabel")}</Label>
              <InputGroup>
                <InputGroupInput
                  id="backup-restore-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
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
              <Label htmlFor="backup-restore-confirm">{t("confirmLabel", { phrase: CONFIRM_PHRASE })}</Label>
              <Input
                id="backup-restore-confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={CONFIRM_PHRASE}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => closeDialog(false)} disabled={isRestoring}>
              {t("cancel")}
            </Button>
            <Button type="button" variant="destructive" onClick={handleRestore} disabled={!canRestore}>
              {isRestoring ? t("restoring") : t("restoreConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
