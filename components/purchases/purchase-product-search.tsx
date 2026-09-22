"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { PackageSearch, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Card } from "@/components/ui/card";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { searchPurchaseProducts } from "@/actions/purchases.actions";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useMergedRef } from "@/hooks/use-merged-ref";
import { formatNumber } from "@/lib/format";
import type { SaleProductOption, SaleProductSearchProps } from "@/types";

/** Server-backed product search for the purchase form — priced from purchase price. No stock cap: buying adds stock. */
export function PurchaseProductSearch({
  onAddLine,
  ref,
}: SaleProductSearchProps & { ref?: Ref<HTMLInputElement> }) {
  const t = useTranslations("invoices.form");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SaleProductOption[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRef(ref, inputRef);

  const requestIdRef = useRef(0);
  const onAddLineRef = useRef(onAddLine);
  useEffect(() => {
    onAddLineRef.current = onAddLine;
  });

  const runSearch = useDebouncedCallback((value: string) => {
    const requestId = ++requestIdRef.current;
    void searchPurchaseProducts(value).then((result) => {
      if (requestId !== requestIdRef.current) return;
      if (!result.success) {
        setResults([]);
        return;
      }
      const [only] = result.data;
      if (result.data.length === 1 && only?.exactBarcodeMatch) {
        onAddLineRef.current(only);
        setQuery("");
        setResults([]);
        setOpen(false);
        return;
      }
      setResults(result.data);
    });
  }, 250);

  function handleChange(value: string) {
    setQuery(value);
    setOpen(true);
    runSearch(value.trim());
  }

  function handleSelect(product: SaleProductOption) {
    onAddLine(product);
    setQuery("");
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const first = results[0];
    if (first) handleSelect(first);
  }

  return (
    <Popover open={open && query.trim().length > 0} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <InputGroup>
          <InputGroupInput
            ref={mergedRef}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
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
        {results.length === 0 ? (
          <EmptyState icon={<PackageSearch className="size-6" />} title={t("noProductsFound")} />
        ) : (
          <div className="flex flex-col gap-1.5">
            {results.map((product) => (
              <PurchaseProductResult key={product.id} product={product} onSelect={() => handleSelect(product)} />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function PurchaseProductResult({
  product,
  onSelect,
}: {
  product: SaleProductOption;
  onSelect: () => void;
}) {
  const stock = Number(product.stockQty);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <Card className="transition-colors duration-200 hover:bg-muted" size="sm">
        <div className="flex items-center justify-between gap-2 px-4">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-body-sm font-medium">{product.name}</span>
            <span className="text-caption text-muted-foreground">
              {product.sku} · {formatNumber(stock)} {product.subUnitName}
            </span>
          </div>
          <Money value={product.pricePerSub} className="shrink-0 text-body-sm font-medium" />
        </div>
      </Card>
    </button>
  );
}
