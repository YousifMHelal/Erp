"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errorBoundary");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={<AlertTriangle className="size-6" aria-hidden="true" />}
      title={t("title")}
      description={t("description")}
      action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => reset()}>
            {t("retry")}
          </Button>
          <Button asChild>
            <Link href="/">{t("backToDashboard")}</Link>
          </Button>
        </div>
      }
    />
  );
}
