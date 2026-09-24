"use client";

import { useRef, useState } from "react";
import { Camera, IdCard, UserRound, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
    <Card className="overflow-hidden py-0">
      <div className="flex flex-col items-center gap-4 bg-secondary/60 px-6 py-8 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-start">
        <div className="group relative shrink-0">
          <Avatar className="size-24 border-4 border-card shadow-md">
            <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
            <AvatarFallback className={cn("text-primary-foreground text-h1", avatarColorClass(profile.id))}>
              {displayName.trim().slice(0, 1) || <UserRound className="size-8" aria-hidden="true" />}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label={t("avatarUpload")}
            className="absolute bottom-0 end-0 flex size-8 items-center justify-center rounded-full border-2 border-card bg-accent text-accent-foreground shadow-sm transition-colors duration-200 hover:bg-teal-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Camera className="size-4" aria-hidden="true" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
            aria-label={t("avatarUpload")}
          />
        </div>
        <div className="flex min-w-0 flex-col items-center gap-1.5 sm:items-start">
          <p className="line-clamp-1 text-h2 text-foreground" title={displayName}>
            {displayName || t("namePlaceholder")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <Badge variant="secondary" className="gap-1">
              <IdCard className="size-3" aria-hidden="true" />
              {profile.roleName}
            </Badge>
            <span dir="ltr" className="text-body-sm text-muted-foreground">
              @{username || profile.username}
            </span>
          </div>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-auto gap-1 px-1.5 py-1 text-caption text-muted-foreground hover:text-danger-fg"
              onClick={() => setAvatarUrl(undefined)}
            >
              <X className="size-3.5" aria-hidden="true" />
              {t("avatarRemove")}
            </Button>
          )}
        </div>
      </div>

      <Separator />

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IdCard className="size-4.5 text-muted-foreground" aria-hidden="true" />
          {t("title")}
        </CardTitle>
        <CardDescription>{t("avatarHint")}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4 pb-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          </div>
          <Button type="submit" variant="accent" className="w-fit" disabled={isSaving}>
            {isSaving ? t("saving") : t("save")}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
