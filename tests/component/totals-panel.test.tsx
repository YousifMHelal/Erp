// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { TotalsPanel } from "@/components/shared/invoice/totals-panel";
import { renderWithIntl } from "./render";

describe("TotalsPanel", () => {
  it("renders the subtotal and total as formatted money", () => {
    renderWithIntl(
      <TotalsPanel subtotal={1000} discountAmount={0} onDiscountChange={vi.fn()} total={1000} />,
    );
    expect(screen.getAllByText(/1,000\.00 ج\.م/).length).toBeGreaterThan(0);
  });

  it("shows subtotal and total as different values when a discount is applied", () => {
    renderWithIntl(
      <TotalsPanel subtotal={200} discountAmount={30} onDiscountChange={vi.fn()} total={170} />,
    );
    expect(screen.getByText("200.00 ج.م")).toBeInTheDocument();
    expect(screen.getByText("170.00 ج.م")).toBeInTheDocument();
  });

  it("calls onDiscountChange with the new numeric value when the discount input changes", () => {
    const onDiscountChange = vi.fn();
    renderWithIntl(
      <TotalsPanel subtotal={500} discountAmount={0} onDiscountChange={onDiscountChange} total={500} />,
    );
    const discountInput = screen.getByLabelText("الخصم");
    fireEvent.change(discountInput, { target: { value: "50" } });
    expect(onDiscountChange).toHaveBeenCalledWith(50);
  });

  it("reflects the current discountAmount prop in the input value", () => {
    renderWithIntl(
      <TotalsPanel subtotal={500} discountAmount={75} onDiscountChange={vi.fn()} total={425} />,
    );
    const discountInput = screen.getByLabelText("الخصم") as HTMLInputElement;
    expect(discountInput.value).toBe("75");
  });
});
