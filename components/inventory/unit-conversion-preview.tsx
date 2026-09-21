import { useTranslations } from "next-intl";
import { Money } from "@/components/shared/money";
import type { UnitConversionPreviewProps } from "@/types";

export function UnitConversionPreview({
  baseUnitName,
  subUnitName,
  unitsPerBase,
  purchasePricePerBase,
  sellPricePerBase,
}: UnitConversionPreviewProps) {
  const t = useTranslations("inventory.form");
  const ratio = unitsPerBase > 0 ? unitsPerBase : 1;
  const purchasePricePerSub = purchasePricePerBase / ratio;
  const sellPricePerSub = sellPricePerBase / ratio;

  return (
    <div className="flex flex-col gap-2 rounded-md bg-muted p-3 text-body-sm">
      <p className="font-medium">
        {t("conversionSummary", { base: baseUnitName, sub: subUnitName, ratio: unitsPerBase || 1 })}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="text-caption text-muted-foreground">{t("purchasePricePerSub")}</span>
          <Money value={String(purchasePricePerSub || 0)} />
        </div>
        <div className="flex flex-col">
          <span className="text-caption text-muted-foreground">{t("sellPricePerSub")}</span>
          <Money value={String(sellPricePerSub || 0)} />
        </div>
      </div>
    </div>
  );
}
