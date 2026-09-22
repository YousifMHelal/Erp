"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { EntityCombobox } from "@/components/shared/entity-combobox";
import type { SettingsUserFormDialogProps } from "@/types";
import { saveSettingsUser } from "@/actions/settings.actions";

export function UserFormDialog({ open, onOpenChange, roleOptions, user, onSave }: SettingsUserFormDialogProps) {
  const t = useTranslations("settings.users.form");
  const isEdit = !!user;

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleId, setRoleId] = useState<string | undefined>(
    roleOptions.find((r) => r.label === user?.roleName)?.value,
  );
  const [isActive, setIsActive] = useState(user?.isActive ?? true);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() || !username.trim()) {
      toast.error(t("errorRequired"));
      return;
    }
    if (!isEdit && !password) {
      toast.error(t("errorPasswordRequired"));
      return;
    }
    if (password && password.length < 8) {
      toast.error(t("errorPasswordLength"));
      return;
    }
    if (!roleId) return toast.error(t("errorRequired"));
    const saved = await saveSettingsUser(user?.id, { displayName, username, password: password || undefined, roleId, isActive });
    if (!saved.success) return toast.error(saved.error);
    onSave(saved.data);
    toast.success(isEdit ? t("updateSuccess") : t("createSuccess"));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("createTitle")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-display-name">
              {t("nameLabel")} <span className="text-accent">*</span>
            </Label>
            <Input
              id="user-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("namePlaceholder")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-username">
              {t("usernameLabel")} <span className="text-accent">*</span>
            </Label>
            <Input
              id="user-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("usernamePlaceholder")}
              dir="ltr"
              className="text-end"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-password">
              {isEdit ? t("passwordLabelEdit") : t("passwordLabel")}
              {!isEdit && <span className="text-accent"> *</span>}
            </Label>
            <InputGroup>
              <InputGroupInput
                id="user-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                autoComplete="new-password"
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
            {isEdit && <p className="text-caption text-muted-foreground">{t("passwordHintEdit")}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>{t("roleLabel")}</Label>
            <EntityCombobox options={roleOptions} value={roleId} onChange={setRoleId} placeholder={t("rolePlaceholder")} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="user-active">{t("statusLabel")}</Label>
            <Switch id="user-active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" variant="accent">
              {t("save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
