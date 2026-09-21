"use client";

import { useRef, useState, type Ref } from "react";
import { PackageSearch, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Card } from "@/components/ui/card";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMergedRef } from "@/hooks/use-merged-ref";
import type { ProductSearchProps, SearchableProduct } from "@/types";

export function ProductSearch({ products, onAddLine, ref }: ProductSearchProps & { ref?: Ref<HTMLInputElement> }) {
  const t = useTranslations("invoices.form");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRef(ref, inputRef);

  const filtered = query.trim()
    ? products.filter(
        (p) =>
          p.name.includes(query) ||
          p.sku.toLowerCase().includes(query.toLowerCase()) ||
          p.barcode?.includes(query),
      )
    : products;

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const exactBarcode = products.find((p) => p.barcode === query.trim());
    if (exactBarcode) {
      onAddLine(exactBarcode);
      setQuery("");
      setOpen(false);
    }
  }

  function handleSelect(product: SearchableProduct) {
    onAddLine(product);
    setQuery("");
    inputRef.current?.focus();
  }

  return (
    <Popover open={open && query.trim().length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <InputGroup>
          <InputGroupInput
            ref={mergedRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={t("productSearchPlaceholder")}
            aria-label={t("productSearchPlaceholder")}
          />
          <InputGroupAddon>
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          </InputGroupAddon>
        </InputGroup>
      </PopoverAnchor>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) max-h-80 overflow-y-auto p-2"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {filtered.length === 0 ? (
          <EmptyState icon={<PackageSearch className="size-6" />} title={t("noProductsFound")} />
        ) : (
          <div className="flex flex-col gap-1.5">
            {filtered.map((product) => (
              <ProductSearchResult key={product.id} product={product} onSelect={() => handleSelect(product)} />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function ProductSearchResult({ product, onSelect }: { product: SearchableProduct; onSelect: () => void }) {
  const t = useTranslations("invoices.form");
  const outOfStock = product.stockQty <= 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={outOfStock}
      className={cn(
        "w-full text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        outOfStock && "opacity-50",
      )}
    >
      <Card className="transition-colors duration-200 hover:bg-muted" size="sm">
        <div className="flex items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-body-sm font-medium">{product.name}</span>
            <span className="text-caption text-muted-foreground">
              {product.sku} · {formatNumber(product.stockQty)} {product.subUnitName}
              {outOfStock && ` · ${t("outOfStock")}`}
            </span>
          </div>
          <Money value={product.pricePerSub} className="shrink-0 text-body-sm font-medium" />
        </div>
      </Card>
    </button>
  );
}
