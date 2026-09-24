"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShopProfile } from "@/types";
import { saveShopProfile } from "@/actions/settings.actions";

export function ShopProfileForm({ profile }: { profile: ShopProfile }) {
  const t = useTranslations("settings.profile");
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [address, setAddress] = useState(profile.address);
  const [taxNote, setTaxNote] = useState(profile.taxNote ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await saveShopProfile({ name, phone, address, taxNote, invoiceFooter: profile.invoiceFooter ?? "" });
    if (!result.success) return toast.error(result.error);
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
            <Label htmlFor="shop-name">{t("nameLabel")}</Label>
            <Input id="shop-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shop-phone">{t("phoneLabel")}</Label>
              <Input
                id="shop-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                dir="ltr"
                className="text-end tabular-nums"
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="shop-address">{t("addressLabel")}</Label>
              <Input id="shop-address" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="off" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="shop-tax-note">{t("taxNoteLabel")}</Label>
            <Input id="shop-tax-note" value={taxNote} onChange={(e) => setTaxNote(e.target.value)} placeholder={t("taxNotePlaceholder")} autoComplete="off" />
          </div>
          <Button type="submit" variant="accent" className="w-fit">
            {t("save")}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
