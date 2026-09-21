import type { ReactNode } from "react";

export type ProvidersProps = { children: ReactNode };
export type RootLayoutProps = { children: ReactNode };

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

// --- Layout ---

import type { LucideIcon } from "lucide-react";

export type NavItem = {
  labelKey: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  labelKey: string;
  items: NavItem[];
};

export type SidebarProps = { className?: string };
export type SidebarNavProps = { onNavigate?: () => void };
export type TopbarProps = { className?: string };
export type AppShellProps = { children: ReactNode };
export type UserMenuProps = { className?: string };
export type BreadcrumbItem = { labelKey: string; href?: string };

// --- Data table ---

import type { ColumnDef, Table as TanstackTable } from "@tanstack/react-table";

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  /** Renders one mobile stacked card per row, below 768px. */
  renderMobileCard: (row: TData) => ReactNode;
  getRowId?: (row: TData) => string;
  isLoading?: boolean;
  skeletonRowCount?: number;
  emptyState?: ReactNode;
  toolbar?: ReactNode;
  footerRow?: ReactNode;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (selectedIds: string[]) => void;
  pageCount?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  totalCount?: number;
  className?: string;
};

export type DataTablePaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  totalCount?: number;
  pageSize?: number;
};

export type DataTableToolbarProps = {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  actions?: ReactNode;
};

export type DataTableEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export type DataTableSkeletonProps = {
  columnCount: number;
  rowCount?: number;
};

export type UseDataTableOptions<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  getRowId?: (row: TData) => string;
  enableRowSelection?: boolean;
};

export type DataTableInstance<TData> = TanstackTable<TData>;

// --- Shared UI parts (P2-3) ---

export type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
};

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  isPending?: boolean;
  onConfirm: () => void;
};

export type DateRange = { from?: Date; to?: Date };

export type DateRangePickerProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
};

export type EntityComboboxOption = { value: string; label: string; description?: string };

export type EntityComboboxProps = {
  options: EntityComboboxOption[];
  value?: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
};

export type StatCardProps = {
  label: string;
  value: ReactNode;
  delta?: { value: string; tone: "success" | "danger" };
  icon?: LucideIcon;
  sparkline?: ReactNode;
};

// --- Auth (P2-4) ---

export type LoginUserTile = {
  id: string;
  displayName: string;
  roleName: string;
  avatarColor: string;
};

export type UserTileGridProps = {
  users: LoginUserTile[];
  onSelect: (user: LoginUserTile) => void;
};

export type UserTileProps = {
  user: LoginUserTile;
  onSelect: () => void;
};

export type PasswordStepProps = {
  user: LoginUserTile;
  onBack: () => void;
};
