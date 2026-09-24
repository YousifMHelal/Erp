// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { LineItemsTable } from "@/components/shared/invoice/line-items-table";
import { renderWithIntl } from "./render";
import type { InvoiceLineDraft } from "@/types";

function makeLine(overrides: Partial<InvoiceLineDraft> = {}): InvoiceLineDraft {
  return {
    lineId: "line-1",
    productId: "p1",
    productName: "أرز أبو كاس 1 كجم",
    unitType: "SUB",
    baseUnitName: "كرتونة",
    subUnitName: "كيس",
    unitsPerBase: 10,
    qty: 2,
    unitPrice: 55,
    lineTotal: 110,
    ...overrides,
  };
}

describe("LineItemsTable", () => {
  it("shows an empty state with no lines", () => {
    renderWithIntl(
      <LineItemsTable lines={[]} onUpdateLine={vi.fn()} onRemoveLine={vi.fn()} />,
    );
    expect(screen.getByText("لم تتم إضافة أصناف بعد")).toBeInTheDocument();
  });

  it("renders one row per line with its product name", () => {
    renderWithIntl(
      <LineItemsTable
        lines={[makeLine(), makeLine({ lineId: "line-2", productName: "سكر خشن 1 كجم" })]}
        onUpdateLine={vi.fn()}
        onRemoveLine={vi.fn()}
      />,
    );
    expect(screen.getAllByText("أرز أبو كاس 1 كجم").length).toBeGreaterThan(0);
    expect(screen.getAllByText("سكر خشن 1 كجم").length).toBeGreaterThan(0);
  });

  it("sums line totals into the subtotal footer", () => {
    renderWithIntl(
      <LineItemsTable
        lines={[makeLine({ lineTotal: 110 }), makeLine({ lineId: "line-2", lineTotal: 40 })]}
        onUpdateLine={vi.fn()}
        onRemoveLine={vi.fn()}
      />,
    );
    // 110 + 40 = 150
    expect(screen.getAllByText(/150\.00/).length).toBeGreaterThan(0);
  });

  it("calls onRemoveLine with the right lineId when a line's delete control fires", () => {
    const onRemoveLine = vi.fn();
    renderWithIntl(
      <LineItemsTable
        lines={[makeLine({ lineId: "line-42" })]}
        onUpdateLine={vi.fn()}
        onRemoveLine={onRemoveLine}
      />,
    );
    const deleteButtons = screen.getAllByRole("button", { name: /حذف السطر/ });
    fireEvent.click(deleteButtons[0]!);
    expect(onRemoveLine).toHaveBeenCalledWith("line-42");
  });
});
