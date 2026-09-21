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

// --- Invoice (shared sales/purchases, P2-6/9) ---

export type InvoiceDocumentType = "SALE" | "PURCHASE";

export type UnitType = "BASE" | "SUB";

export type SearchableProduct = {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  baseUnitName: string;
  subUnitName: string;
  unitsPerBase: number;
  pricePerBase: string;
  pricePerSub: string;
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
  documentType: InvoiceDocumentType;
  cashboxOptions: EntityComboboxOption[];
  cashboxId: string | undefined;
  onCashboxChange: (id: string | undefined) => void;
  partyOptions: EntityComboboxOption[];
  partyId: string | undefined;
  onPartyChange: (id: string | undefined) => void;
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
  documentType: InvoiceDocumentType;
  products: SearchableProduct[];
  partyOptions: EntityComboboxOption[];
  cashboxOptions: EntityComboboxOption[];
};

// --- Returns (P2-10) ---

export type ReturnDocumentType = "SALE_RETURN" | "PURCHASE_RETURN";

export type OriginalInvoiceOption = {
  id: string;
  number: number;
  partyName: string;
  issuedAt: string;
  total: string;
};

export type OriginalInvoiceLine = {
  id: string;
  productId: string;
  productName: string;
  unitName: string;
  qtyInvoiced: number;
  qtyAlreadyReturned: number;
  unitPrice: string;
};

export type ReturnLineDraft = {
  lineId: string;
  productId: string;
  productName: string;
  unitName: string;
  maxReturnableQty: number;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type OriginalInvoicePickerProps = {
  options: OriginalInvoiceOption[];
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
};

export type ReturnLinesTableProps = {
  lines: ReturnLineDraft[];
  onUpdateQty: (lineId: string, qty: number) => void;
};

export type ReturnFormProps = {
  documentType: ReturnDocumentType;
  originalInvoices: OriginalInvoiceOption[];
  originalInvoiceLines: Record<string, OriginalInvoiceLine[]>;
  cashboxOptions: EntityComboboxOption[];
};

// --- Inventory (P2-11/12/13) ---

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type InventoryProductRow = {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryName: string;
  stockQty: number;
  baseUnitName: string;
  subUnitName: string;
  unitsPerBase: number;
  purchasePricePerBase: string;
  sellPricePerBase: string;
  avgCostPerSub: string;
  minStockQty: number;
  isActive: boolean;
};

export type InventoryValueSummaryProps = {
  totalCostValue: string;
  totalSaleValue: string;
  productCount: number;
  lowStockCount: number;
  outOfStockCount: number;
};

export type InventoryFiltersProps = {
  categoryOptions: EntityComboboxOption[];
  categoryId: string | undefined;
  onCategoryChange: (id: string | undefined) => void;
  stockStatus: StockStatus | undefined;
  onStockStatusChange: (status: StockStatus | undefined) => void;
};

export type StockStatusBadgeProps = { status: StockStatus };

export type ProductGeneralTabProps = {
  categoryOptions: EntityComboboxOption[];
};

export type UnitConversionPreviewProps = {
  baseUnitName: string;
  subUnitName: string;
  unitsPerBase: number;
  purchasePricePerBase: number;
  sellPricePerBase: number;
};

export type ProductFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryOptions: EntityComboboxOption[];
  product?: InventoryProductRow;
};

export type ProductDetail = InventoryProductRow & {
  notes?: string;
  createdAt: string;
};

export type ProductSummaryCardProps = { product: ProductDetail };

export type StockMovementRow = {
  id: string;
  type: "PURCHASE" | "SALE" | "SALE_RETURN" | "PURCHASE_RETURN" | "STOCKTAKE" | "OPENING";
  qtyInSub: number;
  balanceAfter: number;
  refLabel: string;
  createdAt: string;
};

export type StockMovementTableProps = { movements: StockMovementRow[] };

export type PriceHistoryEntry = {
  id: string;
  changedAt: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  changedByName: string;
};

export type ProductPriceHistoryProps = { entries: PriceHistoryEntry[] };

export type InventoryGridProps = {
  products: InventoryProductRow[];
  categoryOptions: EntityComboboxOption[];
};

// --- Stocktake (P2-13) ---

export type StocktakeStatus = "DRAFT" | "CONFIRMED" | "CANCELLED";

export type StocktakeListRow = {
  id: string;
  number: number;
  status: StocktakeStatus;
  lineCount: number;
  totalDifference: number;
  createdByName: string;
  createdAt: string;
};

export type StocktakeLineDraft = {
  id: string;
  productId: string;
  productName: string;
  unitName: string;
  systemQty: number;
  countedQty: number | null;
};

export type StocktakeSheetProps = {
  lines: StocktakeLineDraft[];
  onUpdateCounted: (lineId: string, countedQty: number | null) => void;
};

export type StocktakeLineRowProps = {
  line: StocktakeLineDraft;
  onUpdateCounted: (countedQty: number | null) => void;
};

export type StocktakeDiffSummaryProps = {
  lines: StocktakeLineDraft[];
};

export type NewStocktakeViewProps = {
  initialLines: StocktakeLineDraft[];
};

// --- Sales/purchases list (P2-7/9) ---

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
  documentType: InvoiceDocumentType;
  invoices: InvoiceListRow[];
  partyOptions: EntityComboboxOption[];
  /** Route to create a new document. Omit to hide the "new" action (e.g. returns, which are created from an original invoice picker instead). */
  newInvoiceHref?: string;
  /** Base path for row/detail links, e.g. "/sales" or "/sales-returns". Defaults by documentType when omitted. */
  detailBasePath?: string;
};

// --- Invoice detail (P2-8) ---

export type InvoiceDetailLine = {
  id: string;
  productName: string;
  unitName: string;
  qty: number;
  unitPrice: string;
  lineTotal: string;
};

export type InvoiceDetail = {
  id: string;
  number: number;
  type: "SALE" | "PURCHASE" | "SALE_RETURN" | "PURCHASE_RETURN";
  status: "CONFIRMED" | "CANCELLED";
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  partyName: string;
  partyPhone?: string;
  partyBalance?: string;
  cashboxName: string;
  userName: string;
  issuedAt: string;
  subtotal: string;
  discountAmount: string;
  total: string;
  paidAmount: string;
  remainingAmount: string;
  notes?: string;
  lines: InvoiceDetailLine[];
  cancelledAt?: string;
  cancelledByName?: string;
  cancelReason?: string;
};

export type InvoiceHeaderCardProps = { invoice: InvoiceDetail };
export type InvoicePartyCardProps = { invoice: InvoiceDetail };
export type InvoiceLinesTableProps = { lines: InvoiceDetailLine[] };
export type InvoiceTotalsCardProps = { invoice: InvoiceDetail };
export type InvoiceDetailViewProps = { invoice: InvoiceDetail };

export type InvoiceActionsBarProps = {
  invoice: InvoiceDetail;
  onPrint: () => void;
  onCancel: () => void;
};
export type PrintSizeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (size: "A4" | "A5" | "80mm") => void;
};
export type CancelInvoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  onConfirm: (reason: string) => void;
};

export type InvoiceFiltersProps = {
  documentType: InvoiceDocumentType;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  partyId: string | undefined;
  onPartyChange: (id: string | undefined) => void;
  partyOptions: EntityComboboxOption[];
  paymentStatus: string | undefined;
  onPaymentStatusChange: (value: string | undefined) => void;
};
