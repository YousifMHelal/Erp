"use client";

import { AlignJustify, Rows3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/shared/app-tooltip";
import { useUiStore } from "@/stores/ui.store";

export function DataTableDensityToggle() {
  const t = useTranslations("dataTable");
  const density = useUiStore((s) => s.density);
  const setDensity = useUiStore((s) => s.setDensity);

  const isCompact = density === "compact";

  return (
    <AppTooltip content={isCompact ? t("densityComfortable") : t("densityCompact")}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => setDensity(isCompact ? "comfortable" : "compact")}
        aria-label={t("density")}
      >
        {isCompact ? <Rows3 className="size-4" /> : <AlignJustify className="size-4" />}
      </Button>
    </AppTooltip>
  );
}
