"use client";

import { useRef, useState, useTransition } from "react";
import { AlertTriangle, BellRing, DatabaseBackup, Download, Eye, EyeOff, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { restoreBackup, saveBackupReminder } from "@/actions/backup.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { BackupReminderSettings } from "@/types";

const CONFIRM_PHRASE = "استعادة النسخة الاحتياطية";
const WEEKDAY_KEYS = ["0", "1", "2", "3", "4", "5", "6"] as const;
const MONTH_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

/** 24h "HH:mm" slots every 30 minutes, shown as 12h ص/م in the trigger via formatHourLabel. */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? "00" : "30";
  return `${String(hours).padStart(2, "0")}:${minutes}`;
});

function formatTimeLabel(value: string): string {
  const [hoursStr, minutes] = value.split(":");
  const hours = Number(hoursStr);
  const period = hours < 12 ? "ص" : "م";
  const twelveHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelveHour}:${minutes} ${period}`;
}

export function BackupPanel({ reminder }: { reminder: BackupReminderSettings }) {
  const t = useTranslations("settings.backup");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | undefined>();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  const [frequency, setFrequency] = useState(reminder.frequency);
  const [time, setTime] = useState(reminder.time);
  const [dayOfWeek, setDayOfWeek] = useState(reminder.dayOfWeek ?? 0);
  const [dayOfMonth, setDayOfMonth] = useState(reminder.dayOfMonth ?? 1);
  const [isSavingReminder, startSavingReminder] = useTransition();

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
      anchor.download = filenameMatch?.[1] ?? "erp-backup.json";
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

  function handleSaveReminder() {
    startSavingReminder(async () => {
      const result = await saveBackupReminder({
        frequency,
        time,
        dayOfWeek: frequency === "weekly" ? dayOfWeek : undefined,
        dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success(t("reminderSaved"));
    });
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="size-5 text-muted-foreground" />
            {t("reminderTitle")}
          </CardTitle>
          <CardDescription>{t("reminderDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label>{t("reminderFrequencyLabel")}</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as BackupReminderSettings["frequency"])}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">{t("reminderFrequency.off")}</SelectItem>
                  <SelectItem value="daily">{t("reminderFrequency.daily")}</SelectItem>
                  <SelectItem value="weekly">{t("reminderFrequency.weekly")}</SelectItem>
                  <SelectItem value="monthly">{t("reminderFrequency.monthly")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {frequency !== "off" && (
              <div className="flex flex-col gap-1.5">
                <Label>{t("reminderTimeLabel")}</Label>
                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {TIME_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {formatTimeLabel(option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {frequency === "weekly" && (
              <div className="flex flex-col gap-1.5">
                <Label>{t("reminderDayOfWeekLabel")}</Label>
                <Select value={String(dayOfWeek)} onValueChange={(v) => setDayOfWeek(Number(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAY_KEYS.map((key) => (
                      <SelectItem key={key} value={key}>
                        {t(`weekdays.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {frequency === "monthly" && (
              <div className="flex flex-col gap-1.5">
                <Label>{t("reminderDayOfMonthLabel")}</Label>
                <Select value={String(dayOfMonth)} onValueChange={(v) => setDayOfMonth(Number(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {MONTH_DAYS.map((day) => (
                      <SelectItem key={day} value={String(day)}>
                        {t("reminderDayOfMonthOption", { day })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button type="button" variant="accent" className="w-fit" disabled={isSavingReminder} onClick={handleSaveReminder}>
            {t("reminderSave")}
          </Button>
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
