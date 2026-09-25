"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

type NumberInputProps = Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  value: number;
  onValueChange: (value: number) => void;
};

/**
 * Numeric input that shows an empty field (placeholder "0") instead of a literal 0, so the
 * user can type straight away. While focused it keeps the raw text, so partial entries like
 * "0." or "1." aren't reformatted mid-typing.
 */
export function NumberInput({ value, onValueChange, placeholder = "0", onBlur, ...props }: NumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const display = draft ?? (value === 0 || Number.isNaN(value) ? "" : String(value));

  return (
    <Input
      type="number"
      inputMode="decimal"
      step="any"
      {...props}
      value={display}
      placeholder={placeholder}
      onChange={(e) => {
        setDraft(e.target.value);
        onValueChange(e.target.value === "" ? 0 : Number(e.target.value));
      }}
      onBlur={(e) => {
        setDraft(null);
        onBlur?.(e);
      }}
    />
  );
}
