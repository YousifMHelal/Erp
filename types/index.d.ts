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

// --- Dashboard (P2-5) ---

export type SalesTrendPoint = { date: string; total: number };
export type SalesTrendChartProps = { data: SalesTrendPoint[] };

export type QuickActionItem = { labelKey: string; href: string; icon: LucideIcon };
export type QuickActionsProps = { items: QuickActionItem[] };

export type LowStockItem = { id: string; name: string; stockQty: number; minStockQty: number; unitName: string };
export type LowStockPanelProps = { items: LowStockItem[] };

export type TopDebtorItem = { id: string; name: string; balance: string };
export type TopDebtorsPanelProps = { items: TopDebtorItem[] };

export type RecentInvoiceItem = {
  id: string;
  number: number;
  partyName: string;
  total: string;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  issuedAt: string;
};
export type RecentInvoicesProps = { items: RecentInvoiceItem[] };

export type KpiRowProps = {
  todaySales: string;
  todaySalesDelta: { value: string; tone: "success" | "danger" };
  invoiceCount: number;
  invoiceCountDelta: { value: string; tone: "success" | "danger" };
  lowStockCount: number;
  totalReceivables: string;
};

// --- New sale (P2-6) ---

export type UnitType = "BASE" | "SUB";

export type SearchableProduct = {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  baseUnitName: string;
  subUnitName: string;
  unitsPerBase: number;
  sellPricePerBase: string;
  sellPricePerSub: string;
  stockQty: number;
};

export type InvoiceLineDraft = {
  lineId: string;
  productId: string;
  productName: string;
  unitType: UnitType;
  baseUnitName: string;
  subUnitName: string;
  unitsPerBase: number;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type ProductSearchProps = {
  products: SearchableProduct[];
  onAddLine: (product: SearchableProduct) => void;
};

export type LineItemsTableProps = {
  lines: InvoiceLineDraft[];
  onUpdateLine: (lineId: string, patch: Partial<InvoiceLineDraft>) => void;
  onRemoveLine: (lineId: string) => void;
  activeLineId?: string;
};

export type LineRowProps = {
  line: InvoiceLineDraft;
  isActive: boolean;
  onUpdate: (patch: Partial<InvoiceLineDraft>) => void;
  onRemove: () => void;
};

export type TotalsPanelProps = {
  subtotal: number;
  discountAmount: number;
  onDiscountChange: (value: number) => void;
  total: number;
};

export type PaymentPanelProps = {
  cashboxOptions: EntityComboboxOption[];
  cashboxId: string | undefined;
  onCashboxChange: (id: string | undefined) => void;
  customerOptions: EntityComboboxOption[];
  customerId: string | undefined;
  onCustomerChange: (id: string | undefined) => void;
  paidAmount: number;
  onPaidAmountChange: (value: number) => void;
  total: number;
};

export type HotkeyBarProps = { className?: string };

export type SaveInvoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  onPrint: (size: "A4" | "A5" | "80mm") => void;
  onSkip: () => void;
};

export type InvoiceFormProps = {
  products: SearchableProduct[];
  customerOptions: EntityComboboxOption[];
  cashboxOptions: EntityComboboxOption[];
};

// --- Sales list (P2-7) ---

export type InvoiceListRow = {
  id: string;
  number: number;
  partyName: string;
  cashboxName: string;
  userName: string;
  total: string;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  status: "CONFIRMED" | "CANCELLED";
  issuedAt: string;
};

export type InvoiceListProps = {
  invoices: InvoiceListRow[];
  customerOptions: EntityComboboxOption[];
};

export type InvoiceFiltersProps = {
  search: string;
  onSearchChange: (value: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  customerId: string | undefined;
  onCustomerChange: (id: string | undefined) => void;
  customerOptions: EntityComboboxOption[];
  paymentStatus: string | undefined;
  onPaymentStatusChange: (value: string | undefined) => void;
};
