import Link from "next/link";
import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export default async function GlobalNotFound() {
  const t = await getTranslations("errorBoundary");

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <EmptyState
        icon={<SearchX className="size-6" aria-hidden="true" />}
        title={t("notFoundTitle")}
        description={t("notFoundDescription")}
        action={
          <Button asChild>
            <Link href="/">{t("backToDashboard")}</Link>
          </Button>
        }
      />
    </div>
  );
}
