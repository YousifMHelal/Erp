"use client";

import { useEffect, useRef, useState, type Ref } from "react";
import { PackageSearch, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Card } from "@/components/ui/card";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { searchSaleProducts } from "@/actions/sales.actions";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import { useMergedRef } from "@/hooks/use-merged-ref";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SaleProductOption, SaleProductSearchProps } from "@/types";

/**
 * Server-backed product search for the sale form. A scanned barcode comes back as a
 * single `exactBarcodeMatch` result and is added to the invoice without a click, which
 * is what makes scanning at the counter a one-motion action.
 */
export function SaleProductSearch({
  onAddLine,
  ref,
}: SaleProductSearchProps & { ref?: Ref<HTMLInputElement> }) {
  const t = useTranslations("invoices.form");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SaleProductOption[]>([]);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRef(ref, inputRef);

  // Guards against an older, slower search overwriting a newer one's results.
  const requestIdRef = useRef(0);
  const onAddLineRef = useRef(onAddLine);
  useEffect(() => {
    onAddLineRef.current = onAddLine;
  });

  function loadDefaultResults() {
    void searchSaleProducts("").then((result) => {
      if (result.success) setResults(result.data);
    });
  }

  // Auto-focus and load the full product list on mount so the counter can start
  // scanning or browsing immediately without typing anything first.
  useEffect(() => {
    inputRef.current?.focus();
    setOpen(true);
    loadDefaultResults();
  }, []);

  const runSearch = useDebouncedCallback((value: string) => {
    const requestId = ++requestIdRef.current;
    void searchSaleProducts(value).then((result) => {
      if (requestId !== requestIdRef.current) return;
      if (!result.success) {
        setResults([]);
        return;
      }
      // A scan resolves to exactly one product — add it and clear for the next scan.
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
    setOpen(true);
    loadDefaultResults();
    inputRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const first = results[0];
    if (first && Number(first.stockQty) > 0) handleSelect(first);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <InputGroup>
          <InputGroupInput
            ref={mergedRef}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => {
              setOpen(true);
              if (!query.trim()) loadDefaultResults();
            }}
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
              <SaleProductResult
                key={product.id}
                product={product}
                onSelect={() => handleSelect(product)}
              />
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function SaleProductResult({
  product,
  onSelect,
}: {
  product: SaleProductOption;
  onSelect: () => void;
}) {
  const t = useTranslations("invoices.form");
  const stock = Number(product.stockQty);
  const outOfStock = stock <= 0;

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
        <div className="flex items-center gap-3 px-4">
          <span className="shrink-0 text-caption whitespace-nowrap text-muted-foreground">{product.sku}</span>
          <span className="min-w-0 flex-1 truncate text-body-sm font-medium">{product.name}</span>
          <span className="shrink-0 whitespace-nowrap text-caption tabular-nums text-muted-foreground">
            {formatNumber(stock)} {product.subUnitName}
            {outOfStock && ` · ${t("outOfStock")}`}
          </span>
          <Money value={product.pricePerSub} className="shrink-0 text-body-sm font-medium" />
        </div>
      </Card>
    </button>
  );
}
