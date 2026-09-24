"use client";

import { useRef, useState } from "react";
import { UserRound, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMyProfile } from "@/actions/profile.actions";
import { avatarColorClass, cn } from "@/lib/utils";
import type { ProfileFormProps } from "@/types";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ACCEPTED_AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function ProfileForm({ profile }: ProfileFormProps) {
  const t = useTranslations("profile.form");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername] = useState(profile.username);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(profile.avatarUrl);
  const [isSaving, setIsSaving] = useState(false);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      toast.error(t("avatarInvalidType"));
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error(t("avatarTooLarge"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() || !username.trim()) {
      toast.error(t("errorRequired"));
      return;
    }
    setIsSaving(true);
    const saved = await updateMyProfile({ displayName, username, avatarUrl: avatarUrl ?? null });
    setIsSaving(false);
    if (!saved.success) return toast.error(saved.error);
    setDisplayName(saved.data.displayName);
    setUsername(saved.data.username);
    setAvatarUrl(saved.data.avatarUrl);
    toast.success(t("saved"));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>{t("avatarLabel")}</Label>
            <div className="flex items-center gap-3">
              <Avatar className="size-16">
                <AvatarImage src={avatarUrl} alt={displayName} />
                <AvatarFallback className={cn("text-primary-foreground", avatarColorClass(profile.id))}>
                  <UserRound className="size-6" aria-hidden="true" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    {t("avatarUpload")}
                  </Button>
                  {avatarUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("avatarRemove")}
                      onClick={() => setAvatarUrl(undefined)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
                <span className="text-caption text-muted-foreground">{t("avatarHint")}</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
                aria-label={t("avatarUpload")}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-display-name">
              {t("nameLabel")} <span className="text-accent">*</span>
            </Label>
            <Input
              id="profile-display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("namePlaceholder")}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-username">
              {t("usernameLabel")} <span className="text-accent">*</span>
            </Label>
            <Input
              id="profile-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("usernamePlaceholder")}
              dir="ltr"
              className="text-end"
            />
          </div>
          <Button type="submit" variant="accent" className="w-fit" disabled={isSaving}>
            {t("save")}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
