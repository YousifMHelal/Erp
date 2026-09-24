// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { PermissionMatrix } from "@/components/settings/permission-matrix";
import { PERMISSION_GROUPS } from "@/lib/permissions";
import { renderWithIntl } from "./render";

// Use a small, real slice of the actual permission catalogue rather than fabricating
// a shape that could drift from what the app really produces.
const saleGroup = PERMISSION_GROUPS.find((g) => g.key === "sale")!;
const inventoryGroup = PERMISSION_GROUPS.find((g) => g.key === "inventory")!;

describe("PermissionMatrix", () => {
  it("renders a checkbox per action across all given groups", () => {
    renderWithIntl(
      <PermissionMatrix
        groups={[saleGroup, inventoryGroup]}
        grantedKeys={new Set()}
        onToggle={vi.fn()}
      />,
    );
    const totalActions = saleGroup.actions.length + inventoryGroup.actions.length;
    expect(screen.getAllByRole("checkbox")).toHaveLength(totalActions);
  });

  it("checks exactly the boxes whose keys are in grantedKeys", () => {
    renderWithIntl(
      <PermissionMatrix
        groups={[saleGroup]}
        grantedKeys={new Set(["sale.view", "sale.create"])}
        onToggle={vi.fn()}
      />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    const checkedCount = checkboxes.filter((cb) => cb.getAttribute("data-state") === "checked").length;
    expect(checkedCount).toBe(2);
  });

  it("calls onToggle with the exact permission key when a checkbox is clicked", () => {
    const onToggle = vi.fn();
    renderWithIntl(
      <PermissionMatrix groups={[saleGroup]} grantedKeys={new Set()} onToggle={onToggle} />,
    );
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[0]!);
    expect(onToggle).toHaveBeenCalledWith(saleGroup.actions[0]!.key);
  });

  it("disables every checkbox when readOnly is true", () => {
    renderWithIntl(
      <PermissionMatrix groups={[saleGroup]} grantedKeys={new Set()} onToggle={vi.fn()} readOnly />,
    );
    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).toBeDisabled();
    }
  });

  it("does not disable checkboxes when readOnly is omitted", () => {
    renderWithIntl(
      <PermissionMatrix groups={[saleGroup]} grantedKeys={new Set()} onToggle={vi.fn()} />,
    );
    for (const checkbox of screen.getAllByRole("checkbox")) {
      expect(checkbox).not.toBeDisabled();
    }
  });
});
