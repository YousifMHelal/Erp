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

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    /** Applied to the header/cell wrapper. Use to hide lower-priority columns at the md breakpoint (768–1023px). */
    className?: string;
  }
}

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
  todayPurchases: string;
  todayPurchasesDelta: { value: string; tone: "success" | "danger" };
  invoiceCount: number;
  invoiceCountDelta: { value: string; tone: "success" | "danger" };
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

/** Pre-fill data for editing an existing sale/purchase (static-props only — Phase 2 has no real update action). */
export type InvoiceFormInitialData = {
  number: string;
  partyId?: string;
  cashboxId?: string;
  discountAmount: number;
  paidAmount: number;
  lines: InvoiceLineDraft[];
};

export type InvoiceFormProps = {
  documentType: InvoiceDocumentType;
  products: SearchableProduct[];
  partyOptions: EntityComboboxOption[];
  cashboxOptions: EntityComboboxOption[];
  /** When set, the form opens pre-filled for editing that invoice instead of starting blank. */
  initialInvoice?: InvoiceFormInitialData;
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
  onSave: (product: InventoryProductRow) => void;
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

export type InventoryMobileCardProps = {
  product: InventoryProductRow;
  onEdit: (product: InventoryProductRow) => void;
  onDelete: (product: InventoryProductRow) => void;
};

export type ProductDetailViewProps = {
  product: ProductDetail;
  movements: StockMovementRow[];
  priceHistory: PriceHistoryEntry[];
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

// --- Parties: customers/suppliers (P2-14/15) ---

export type PartyType = "CUSTOMER" | "SUPPLIER";

export type PartyListRow = {
  id: string;
  name: string;
  phone?: string;
  balance: string;
  isActive: boolean;
};

export type PartyFormDialogProps = {
  partyType: PartyType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  party?: PartyListRow & { address?: string; openingBalance?: string; notes?: string };
  onSave?: (party: { name: string; phone: string; address: string; openingBalance: string; notes: string }) => void;
};

export type PartyListProps = {
  partyType: PartyType;
  parties: PartyListRow[];
};

export type PartyRowActionsProps = {
  partyType: PartyType;
  party: PartyListRow;
  onEdit: (party: PartyListRow) => void;
  onDelete: (party: PartyListRow) => void;
};

export type PartyMobileCardProps = {
  party: PartyListRow;
  partyType: PartyType;
  onEdit: (party: PartyListRow) => void;
  onDelete: (party: PartyListRow) => void;
};

export type BalanceBadgeProps = {
  partyType: PartyType;
  balance: string;
};

export type PartyDetail = {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  balance: string;
  openingBalance: string;
  totalInvoiced: string;
  notes?: string;
  createdAt: string;
};

export type PartyInvoiceRow = {
  id: string;
  number: number;
  total: string;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  status: "CONFIRMED" | "CANCELLED";
  issuedAt: string;
};

export type PartyPaymentRow = {
  id: string;
  number: number;
  amount: string;
  cashboxName: string;
  occurredAt: string;
};

export type StatementLine = {
  id: string;
  date: string;
  description: string;
  debit: string;
  credit: string;
  balanceAfter: string;
};

export type PartyDetailViewProps = {
  partyType: PartyType;
  party: PartyDetail;
  invoices: PartyInvoiceRow[];
  payments: PartyPaymentRow[];
  statement: StatementLine[];
};

export type PartySummaryCardProps = {
  party: PartyDetail;
  partyType: PartyType;
  onEdit: () => void;
  onDelete: () => void;
};

export type CustomerInvoicesTabProps = { partyType: PartyType; invoices: PartyInvoiceRow[] };
export type CustomerPaymentsTabProps = { payments: PartyPaymentRow[] };
export type AccountStatementTabProps = { statement: StatementLine[]; onPrint: () => void };
export type StatementPrintDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (size: "A4" | "A5") => void;
};

// --- Cashboxes (P2-16) ---

export type CashboxSummary = {
  id: string;
  name: string;
  balance: string;
};

export type CashMovementType =
  | "SALE_PAYMENT"
  | "PURCHASE_PAYMENT"
  | "CUSTOMER_COLLECTION"
  | "SUPPLIER_PAYMENT"
  | "SALE_RETURN_REFUND"
  | "PURCHASE_RETURN_REFUND"
  | "OPENING"
  | "TRANSFER_IN"
  | "TRANSFER_OUT";

/** The kind of source document a movement's reference points to, when it can be resolved to a detail route. */
export type CashMovementRefType = "SALE" | "PURCHASE" | "COLLECTION" | "PAYMENT";

export type CashMovementRow = {
  id: string;
  cashboxName: string;
  type: CashMovementType;
  amount: number;
  balanceAfter: string;
  partyName?: string;
  refLabel: string;
  /** Document type the reference points to. Omitted when the reference can't resolve to a route yet (e.g. transfers). */
  refType?: CashMovementRefType;
  /** Id of the source document, used with refType to build the detail link. */
  refId?: string;
  createdAt: string;
};

export type CashboxSummaryStripProps = {
  cashboxes: CashboxSummary[];
  selectedId: string | undefined;
  onSelectCashbox: (id: string | undefined) => void;
};

export type CashboxBalanceCardProps = {
  label: string;
  balance: string;
};

export type CashMovementTableProps = {
  movements: CashMovementRow[];
};

export type CashboxesViewProps = {
  cashboxes: CashboxSummary[];
  movements: CashMovementRow[];
};

export type TransferCashDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashboxes: CashboxSummary[];
  onConfirm: (input: { fromCashboxId: string; toCashboxId: string; amount: number }) => void;
};

// --- Collections/payments (P2-17) ---

export type MoneyDocumentType = "COLLECTION" | "PAYMENT";

export type MoneyDocumentRow = {
  id: string;
  number: number;
  partyName: string;
  cashboxName: string;
  amount: string;
  status: "CONFIRMED" | "CANCELLED";
  occurredAt: string;
};

export type MoneyDocumentListProps = {
  documentType: MoneyDocumentType;
  documents: MoneyDocumentRow[];
};

export type MoneyDocumentRowActionsProps = {
  documentType: MoneyDocumentType;
  document: MoneyDocumentRow;
  onEdit: (document: MoneyDocumentRow) => void;
  onDelete: (document: MoneyDocumentRow) => void;
};

export type MoneyDocumentEditDialogProps = {
  documentType: MoneyDocumentType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: MoneyDocumentRow | undefined;
  onSave: (id: string, amount: string) => void;
};

export type PartyBalancePreviewProps = {
  documentType: MoneyDocumentType;
  partyName: string;
  currentBalance: string;
  amount: number;
};

export type PartyWithBalanceOption = EntityComboboxOption & { balance: string };

export type MoneyDocumentFormProps = {
  documentType: MoneyDocumentType;
  partyOptions: PartyWithBalanceOption[];
  cashboxOptions: EntityComboboxOption[];
};

// --- Reports (P2-18) ---

export type ReportKey =
  | "sales"
  | "purchases"
  | "inventory"
  | "customers"
  | "suppliers"
  | "cashboxes"
  | "collections"
  | "payments"
  | "profit-loss";

export type ReportPickerItem = {
  key: ReportKey;
  icon: LucideIcon;
};

export type ReportShellProps = {
  reportKey: ReportKey;
  children: ReactNode;
};

export type ReportFiltersBarProps = {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
};

export type ReportTableColumn = { key: string; label: string; align?: "start" | "end" };
export type ReportTableProps = {
  columns: ReportTableColumn[];
  rows: Record<string, ReactNode>[];
  footerRow?: Record<string, ReactNode>;
};

export type ReportChartPoint = { label: string; value: number };
export type ReportChartProps = { title: string; data: ReportChartPoint[] };

// --- Notifications & audit log (P2-19) ---

export type NotificationSeverity = "INFO" | "WARNING" | "CRITICAL";
export type NotificationType = "LOW_STOCK" | "OUT_OF_STOCK" | "CUSTOMER_BALANCE" | "SUPPLIER_BALANCE" | "SYSTEM";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  body: string;
  entityHref?: string;
  isRead: boolean;
  createdAt: string;
};

export type NotificationListProps = {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete: (id: string) => void;
};

export type NotificationListItemProps = {
  notification: NotificationItem;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
};

export type AuditLogRow = {
  id: string;
  userName: string;
  action: string;
  entityLabel: string;
  createdAt: string;
  beforeJson?: Record<string, unknown>;
  afterJson?: Record<string, unknown>;
};

export type AuditLogListProps = {
  entries: AuditLogRow[];
};

export type AuditDiffDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: AuditLogRow | undefined;
};

// --- Settings (P2-20) ---

export type ShopProfile = {
  name: string;
  phone: string;
  address: string;
  taxNote?: string;
  invoiceFooter?: string;
};

export type PrintPreferences = {
  defaultPrintSize: "A4" | "A5" | "80mm";
  defaultCashboxId: string;
};

export type SettingsUserRow = {
  id: string;
  displayName: string;
  username: string;
  roleName: string;
  isActive: boolean;
  lastLoginAt?: string;
};

export type PermissionGroupKey =
  | "sale"
  | "purchase"
  | "return"
  | "inventory"
  | "customer"
  | "supplier"
  | "cashbox"
  | "collection"
  | "payment"
  | "report"
  | "user"
  | "role"
  | "audit"
  | "settings";

export type PermissionAction = {
  key: string;
  labelKey: string;
};

export type PermissionGroup = {
  key: PermissionGroupKey;
  labelKey: string;
  actions: PermissionAction[];
};

export type RoleRow = {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  userCount: number;
};

export type PermissionMatrixProps = {
  groups: PermissionGroup[];
  grantedKeys: Set<string>;
  onToggle: (permissionKey: string) => void;
  readOnly?: boolean;
};

export type CategoryRow = { id: string; name: string; description?: string; productCount: number };
export type SettingsCashboxRow = { id: string; name: string; description?: string; isActive: boolean; sortOrder: number };

// --- Print templates (P2-21) ---

export type PrintShopInfo = {
  name: string;
  phone: string;
  /** Second contact number, e.g. a landline alongside a mobile — shown next to `phone` when present. */
  phone2?: string;
  address: string;
  taxNote?: string;
  invoiceFooter?: string;
  /** Data URL (base64) held in local state — no real upload/storage in Phase 2. */
  logoDataUrl?: string;
};

/** A named staff contact line shown in the print header, e.g. "أ/محمد فوزي : 01110292946". */
export type PrintStaffContact = {
  name: string;
  phone: string;
};

export type PrintInvoiceLine = {
  /** Internal product/item code (رقم الصنف), shown as the rightmost table column. */
  productCode?: string;
  productName: string;
  unitName: string;
  qty: number;
  unitPrice: string;
  lineTotal: string;
};

export type PrintInvoiceData = {
  shop: PrintShopInfo;
  documentTypeLabel: string;
  number: number;
  issuedAt: string;
  /** Invoice time, shown alongside the date (الوقت). */
  issuedTime?: string;
  cashierName: string;
  /** Additional named staff/contact lines shown in the header, e.g. sales reps. */
  staffContacts?: PrintStaffContact[];
  partyLabel: string;
  partyName: string;
  /** Party's company/entity name, shown above partyName when they differ (e.g. "شركة الخلود..."). */
  partyCompanyName?: string;
  partyPhone?: string;
  partyAddress?: string;
  lines: PrintInvoiceLine[];
  subtotal: string;
  discountAmount: string;
  total: string;
  paidAmount: string;
  remainingAmount: string;
  /** Party's account balance before this invoice (الرصيد السابق). Omit when not tracked/relevant. */
  previousBalance?: string;
  /** Party's account balance after this invoice (الرصيد الحالى). Omit when not tracked/relevant. */
  currentBalance?: string;
};

export type PrintLayoutProps = { data: PrintInvoiceData };

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
  /** Overrides the default documentType-based "new" button label, e.g. "مرتجع جديد" for returns lists. */
  newInvoiceLabel?: string;
};

export type QuickDateRangePreset = "TODAY" | "THIS_WEEK" | "THIS_MONTH";

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
  onEdit?: () => void;
  onDelete?: () => void;
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

export type DateRangePresetPickerProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
};

// --- Settings: users/categories/cashboxes dialogs (added by print-template + CRUD task) ---

export type SettingsUserFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleOptions: EntityComboboxOption[];
  user?: SettingsUserRow;
  onSave: (user: SettingsUserRow) => void;
};

export type CategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: CategoryRow;
  onSave: (category: CategoryRow) => void;
};

export type SettingsCashboxFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cashbox?: SettingsCashboxRow;
  onSave: (cashbox: SettingsCashboxRow) => void;
};

// --- Print template customizer (settings, P2-21) ---

export type PrintLineColumnKey = "productCode" | "unitName" | "sku" | "discount";

export type PrintLineColumnConfig = {
  key: PrintLineColumnKey;
  labelKey: string;
  visible: boolean;
};

export type PrintTemplateSettings = {
  templateName: string;
  shop: PrintShopInfo;
  lineColumns: PrintLineColumnConfig[];
};

export type PrintTemplateFormProps = {
  template: PrintTemplateSettings;
};

export type PrintTemplatePreviewProps = {
  template: PrintTemplateSettings;
  size: "A4" | "A5" | "80mm";
};

export type PrintLineColumnListProps = {
  columns: PrintLineColumnConfig[];
  onToggle: (key: PrintLineColumnKey) => void;
  onMove: (key: PrintLineColumnKey, direction: "up" | "down") => void;
};
