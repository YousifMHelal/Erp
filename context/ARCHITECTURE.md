# ARCHITECTURE — Teba (طيبة)

> **Scope statement:** Teba is a production-grade, Arabic-only (RTL) retail shop ERP covering sales, purchases, inventory, customers, suppliers, cashboxes, collections/payments, reports, users/permissions, audit log, and notifications — built as a single Next.js application backed by PostgreSQL.

Source of truth for the domain: [`Docs/PRD — Retail Shop ERP.md`](../Docs/PRD%20—%20Retail%20Shop%20ERP.md).
Visual/UX inspiration (behaviour, not aesthetics): the Sahl (سهل) desktop ERP screenshots in [`inspiration/`](../inspiration/).

Related docs: [BUILD_PLAN.md](./BUILD_PLAN.md) · [UI_DESIGN_RULES.md](./UI_DESIGN_RULES.md) · [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md) · [MEMORY.md](./MEMORY.md) · [AGENTS.md](./AGENTS.md)

---

## 1. In scope / Out of scope

### In scope (v1 — the entire PRD)

| # | Area | PRD § |
|---|------|-------|
| 1 | Sales invoices (create, list, detail, edit, cancel) | §2, §3 |
| 2 | Credit sales — partial / zero payment, customer balance | §2 |
| 3 | Purchase invoices (create, list, detail, edit, cancel) | §4 |
| 4 | Inventory & products (inventory page *is* the product page) | §5 |
| 5 | Two-level unit system + conversion ratio per product | §5 |
| 6 | Customers — profile, invoices, payments, balance, statement | §6 |
| 7 | Suppliers — profile, invoices, payments, balance, statement | §7 |
| 8 | Cashboxes — unlimited, aggregate + per-box views, movements | §8 |
| 9 | Customer collections (قبض) & supplier payments (صرف) | §9 |
| 10 | Reports hub — 9 report types incl. Profit & Loss | §10 |
| 11 | Interactive invoice detail page + print + PDF + WhatsApp | §11 |
| 12 | Users, fully-custom roles, granular permissions | §12 |
| 13 | Audit log with before/after values | §13 |
| 14 | Notifications (low stock, out of stock, balances) | §14 |
| 15 | Sales returns (مرتجع بيع) & purchase returns (مرتجع شراء) | §15 |
| 16 | Stocktaking / inventory adjustment (جرد) | §5, §15 |
| 17 | Dashboard — KPIs + quick-action launcher | *(added)* |
| 18 | Settings — shop profile, categories, cashboxes, print prefs | *(added)* |

### Out of scope (v1)

- Multi-tenancy / multi-shop. Single shop, single organisation.
- Multi-warehouse (Sahl has مخزن switching). One implicit stock location.
- Multi-currency. EGP only.
- Sales-rep commissions (مندوب بيع), instalments (أقساط), cheques (شيكات).
- Full double-entry general ledger / chart of accounts. Teba tracks balances per party and per cashbox, not T-accounts.
- Product images, product expiry/serial tracking.
- Email sending, SMS, WhatsApp Business API (share is a `wa.me` link only).
- Offline mode / PWA / service workers.
- Mobile native app.

> Anything in "out of scope" that becomes required must be added to [MEMORY.md](./MEMORY.md) as a new decision **before** it is built.

---

## 2. Locked tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | **Next.js 15 (App Router)** | Server Components by default; `"use client"` only where interaction demands it |
| Language | **TypeScript, `strict: true`** | `noUncheckedIndexedAccess` on |
| Styling | **Tailwind CSS v4** | CSS-first config in `app/globals.css`, `@theme` tokens |
| Components | **shadcn/ui** | Restyled via tokens — never stock slate |
| Tables | **TanStack Table v8** | Wrapped in one `DataTable` component |
| Charts | **Recharts** | Line (trends), Bar (comparisons), via shadcn `chart` wrapper |
| Icons | **lucide-react** | Never emoji |
| ORM | **Prisma 6** | `Decimal` for all money/quantity |
| Database | **PostgreSQL 16** | Local Docker now → Neon/Supabase on Vercel later |
| Validation | **Zod** | Single file `lib/validations.ts` |
| Forms | **react-hook-form** + `@hookform/resolvers/zod` | Via shadcn `<Form>` |
| Auth | **NextAuth v5 (Auth.js)** | Credentials provider, JWT session, `bcryptjs` hashing |
| State (client) | **Zustand** | Only for genuinely client-side state (see §7.1) |
| i18n | **next-intl** | Single locale `ar`, dictionary-driven — **no hardcoded strings** |
| Theme | **next-themes** | `class` strategy, light + dark, system default |
| Toasts | **Sonner** | shadcn-wrapped |
| Dates | **date-fns** + `date-fns/locale/ar-EG` | Gregorian, `dd/MM/yyyy` |
| PDF | **@react-pdf/renderer** | A4 invoice, server-rendered in a route handler |
| Fonts | **IBM Plex Sans Arabic** (self-hosted via `next/font/local`) | Arabic + Latin, tabular numerals for money |
| Testing | **Vitest** + **@testing-library/react** + **Playwright** | Final phase only |
| Lint/format | **ESLint** (next/core-web-vitals) + **Prettier** + `prettier-plugin-tailwindcss` | |

### Added beyond the original brief — called out explicitly

These are not in the user's stack table; each is here because the app genuinely needs it:

1. **next-intl** — rule 12 forbids hardcoded strings. Even at one locale, every string lives in `messages/ar.json`. Also makes adding EN later a content task, not a refactor.
2. **TanStack Table** — every major screen is a filterable, sortable grid. Hand-rolling this 12 times violates rule 4.
3. **Recharts** — dashboard and reports need charts.
4. **@react-pdf/renderer** — A4 PDF export is a hard requirement; browser print alone can't produce a file to share.
5. **bcryptjs** — password hashing for the credentials provider.
6. **date-fns** — date ranges appear on every report and list filter.
7. **next-themes** — theme toggle is a stated requirement.
8. **Docker Compose** — reproducible local Postgres so `npm run db:up` just works.

### Deliberately *not* added

- No file storage (S3/UploadThing) — v1 stores no uploads. Shop logo is a settings string path only.
- No email provider — statements are shared via print/PDF/WhatsApp link.
- No payment gateway — cashboxes are internal records, not real payment rails.
- No Redis — Next.js caching + `revalidatePath` is sufficient at single-shop scale.

---

## 3. Folder structure

No `src/`. App code sits at the project root.

```
teba/
├── app/
│   ├── layout.tsx                    # <html dir="rtl" lang="ar">, fonts, providers
│   ├── globals.css                   # Tailwind v4 @theme tokens (single source of design truth)
│   ├── not-found.tsx
│   ├── error.tsx
│   │
│   ├── (auth)/
│   │   └── login/
│   │       ├── page.tsx              # user tile grid → password
│   │       └── loading.tsx
│   │
│   └── (dashboard)/                  # authenticated shell: sidebar + topbar
│       ├── layout.tsx
│       ├── page.tsx                  # / — KPI dashboard + quick actions
│       │
│       ├── sales/
│       │   ├── page.tsx              # invoice list + filters
│       │   ├── new/page.tsx          # POS-style create screen
│       │   └── [id]/
│       │       ├── page.tsx          # interactive invoice detail
│       │       └── edit/page.tsx
│       ├── sales-returns/
│       │   ├── page.tsx
│       │   ├── new/page.tsx
│       │   └── [id]/page.tsx
│       ├── purchases/                # mirrors sales/
│       ├── purchase-returns/         # mirrors sales-returns/
│       │
│       ├── inventory/
│       │   ├── page.tsx              # the products page (PRD §5: no separate products page)
│       │   ├── [id]/page.tsx         # product detail + movement history
│       │   └── stocktake/
│       │       ├── page.tsx          # list of stocktakes
│       │       └── new/page.tsx      # counting sheet
│       │
│       ├── customers/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx         # profile, invoices, payments, statement
│       ├── suppliers/                # mirrors customers/
│       │
│       ├── cashboxes/
│       │   └── page.tsx              # aggregate by default, filter to one box
│       ├── collections/              # قبض — customer collections
│       │   ├── page.tsx
│       │   └── new/page.tsx
│       ├── payments/                 # صرف — supplier payments
│       │   ├── page.tsx
│       │   └── new/page.tsx
│       │
│       ├── reports/
│       │   ├── page.tsx              # hub — report picker
│       │   └── [report]/page.tsx     # sales|purchases|inventory|customers|suppliers
│       │                             # |cashboxes|collections|payments|profit-loss
│       ├── notifications/page.tsx
│       ├── audit-log/page.tsx
│       └── settings/
│           ├── page.tsx              # shop profile, print prefs
│           ├── users/page.tsx
│           ├── roles/page.tsx        # permission matrix builder
│           ├── categories/page.tsx
│           └── cashboxes/page.tsx
│
├── app/api/
│   ├── auth/[...nextauth]/route.ts
│   └── invoices/[id]/pdf/route.ts    # the ONLY non-Server-Action endpoint: streams A4 PDF
│
├── actions/                          # Server Actions — one file per domain
│   ├── auth.actions.ts
│   ├── sales.actions.ts
│   ├── purchases.actions.ts
│   ├── returns.actions.ts
│   ├── inventory.actions.ts
│   ├── stocktake.actions.ts
│   ├── customers.actions.ts
│   ├── suppliers.actions.ts
│   ├── cashboxes.actions.ts
│   ├── collections.actions.ts
│   ├── payments.actions.ts
│   ├── reports.actions.ts
│   ├── users.actions.ts
│   ├── roles.actions.ts
│   └── settings.actions.ts
│
├── components/
│   ├── ui/                           # shadcn primitives (generated, then token-restyled)
│   ├── layout/                       # app-shell.tsx, sidebar.tsx, topbar.tsx,
│   │                                 # theme-toggle.tsx, user-menu.tsx, notification-bell.tsx
│   ├── shared/                       # data-table/, page-header.tsx, empty-state.tsx,
│   │                                 # money.tsx, stat-card.tsx, status-badge.tsx,
│   │                                 # date-range-picker.tsx, confirm-dialog.tsx,
│   │                                 # entity-combobox.tsx, kbd.tsx, skeletons/
│   ├── dashboard/                    # kpi-row.tsx, sales-trend-chart.tsx, low-stock-panel.tsx,
│   │                                 # top-debtors-panel.tsx, quick-actions.tsx, recent-invoices.tsx
│   ├── sales/                        # invoice-form.tsx, line-items-table.tsx, line-row.tsx,
│   │                                 # product-search.tsx, payment-panel.tsx, totals-panel.tsx,
│   │                                 # invoice-filters.tsx, invoice-detail/*, print/*
│   ├── purchases/ · returns/ · inventory/ · customers/ · suppliers/
│   ├── cashboxes/ · collections/ · payments/ · reports/ · settings/ · audit/ · notifications/
│   └── providers/                    # theme-provider.tsx, session-provider.tsx,
│                                     # intl-provider.tsx, hotkeys-provider.tsx
│
├── lib/
│   ├── prisma.ts                     # singleton client
│   ├── auth.ts                       # NextAuth config
│   ├── auth-guard.ts                 # requireAuth() / requirePermission()
│   ├── validations.ts                # ALL Zod schemas — single file, no exceptions
│   ├── permissions.ts                # PERMISSIONS catalogue + helpers
│   ├── money.ts                      # Decimal helpers, rounding, EGP formatting
│   ├── units.ts                      # base⇄sub conversion, price derivation
│   ├── pricing.ts                    # 3-tier selling-price suggestion (PRD §2)
│   ├── costing.ts                    # weighted moving average
│   ├── stock.ts                      # movement application + availability checks
│   ├── numbering.ts                  # per-type sequential document numbers
│   ├── audit.ts                      # writeAudit() with before/after diff
│   ├── notifications.ts              # generation + dedupe
│   ├── action-result.ts              # ActionResult<T> helpers
│   ├── format.ts                     # date/number/currency formatters (ar-EG)
│   ├── hotkeys.ts                    # F-key registry
│   └── utils.ts                      # cn()
│
├── hooks/                            # use-hotkeys.ts, use-debounce.ts,
│                                     # use-media-query.ts, use-confirm.ts
├── stores/                           # ui.store.ts, invoice-draft.store.ts
├── messages/ar.json                  # every user-facing string
├── i18n/request.ts
├── types/
│   └── index.d.ts                    # ALL shared TypeScript types — single file, no exceptions
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/fonts/
├── tests/                            # unit/ · e2e/
├── context/                          # these six planning docs
├── Docs/ · inspiration/
├── docker-compose.yml                # local postgres
├── middleware.ts                     # route protection
├── AGENTS.md                         # → points at context/AGENTS.md
└── .env.example
```

### Two structural rules with no exceptions

1. **`types/index.d.ts` holds every shared type.** Never co-locate an `interface` next to the component that uses it. Component `Props` types also live here, named `<ComponentName>Props`.
2. **`lib/validations.ts` holds every Zod schema.** Server Actions import from it and re-validate. No inline `z.object()` anywhere else.

---

## 4. Data model

IDs are **cuid**. Money and quantities are **`Decimal`** — never `Float`. Timestamps are `DateTime @default(now())`.

### 4.1 Core principle — the internal unit

> **Every quantity stored in the database is in the product's *sub-unit* (the smallest unit).**

A product declares a base unit (كرتونة), a sub unit (علبة), and `unitsPerBase` (10). The UI lets users transact in either unit; the Server Action converts to sub-units before writing. `Product.stockQty` is always sub-units. This is PRD §15's "consistent internal unit" requirement and it eliminates an entire class of rounding bug.

### 4.2 Entities

**`User`**
`id · username · displayName · passwordHash · avatarColor · roleId → Role · isActive · lastLoginAt · createdAt · updatedAt`
Shown as a tile on the login screen when `isActive`.

**`Role`**
`id · name · description · isSystem · permissions String[] · createdAt · updatedAt`
Fully custom. `permissions` holds keys from `lib/permissions.ts`. `isSystem` protects the bootstrap "مدير النظام" role from deletion. Users inherit role permissions; per-user overrides are **not** in v1.

**`Category`**
`id · name @unique · description? · createdAt`

**`Product`**
`id · sku @unique · barcode? @unique · name · categoryId? → Category`
`baseUnitName · subUnitName · unitsPerBase (Decimal, > 0)`
`purchasePricePerBase · sellPricePerBase (Decimal)`
`avgCostPerSub (Decimal, weighted moving average)`
`stockQty (Decimal, in sub-units) · minStockQty (Decimal, sub-units)`
`notes? · isActive · createdAt · updatedAt`
Derived (never stored): sub-unit prices = per-base ÷ `unitsPerBase`; stock value at cost = `stockQty × avgCostPerSub`; stock value at sale price = `stockQty × sellPricePerSub`; stock status from `stockQty` vs `minStockQty`.

**`Customer`** / **`Supplier`** (separate tables, identical shape)
`id · name · phone? · address? · openingBalance (Decimal) · balance (Decimal) · notes? · isActive · createdAt · updatedAt`
`balance` > 0 means the customer owes the shop / the shop owes the supplier. Maintained transactionally by every action that touches it.

**`Cashbox`**
`id · name · description? · openingBalance (Decimal) · balance (Decimal) · isActive · sortOrder · createdAt`

**`Invoice`** — one table for all four document types
`id · number (Int) · type (InvoiceType) · status (InvoiceStatus) · paymentStatus (PaymentStatus)`
`customerId? → Customer · supplierId? → Supplier · cashboxId → Cashbox`
`subtotal · discountAmount · total · paidAmount · remainingAmount (all Decimal)`
`notes? · issuedAt · createdById → User · cancelledAt? · cancelledById? · cancelReason?`
`originalInvoiceId? → Invoice` (a return points at the invoice it reverses)
`createdAt · updatedAt`
`@@unique([type, number])`

- `InvoiceType` = `SALE | PURCHASE | SALE_RETURN | PURCHASE_RETURN`
- `InvoiceStatus` = `CONFIRMED | CANCELLED`
- `PaymentStatus` = `PAID | PARTIAL | UNPAID`
- Exactly one of `customerId` / `supplierId` is set, enforced in the action layer.
- One cashbox per invoice (PRD §15). One invoice-level discount (PRD §15).

**`InvoiceLine`**
`id · invoiceId → Invoice · productId → Product`
`productName · unitName` (snapshot — the name at transaction time)
`unitType (BASE | SUB) · unitsPerBaseSnapshot (Decimal)`
`qtyInUnit (Decimal, as the user typed it) · qtyInSub (Decimal, canonical)`
`unitPrice (Decimal, price for one `unitType`) · lineTotal (Decimal)`
`costPerSubAtSale (Decimal)` — avg cost frozen at sale time, so P&L is historically correct
`sortOrder`
`isCurrent (Boolean)` — edits retain prior line snapshots; only current lines count toward the live invoice.
PRD §15: "every invoice stores the actual price used at the time of the transaction" — hence the snapshots.

**`StockMovement`** — append-only ledger, the single explanation for every stock change
`id · productId → Product · type (StockMovementType) · qtyInSub (Decimal, signed)`
`balanceAfter (Decimal) · unitCostPerSub (Decimal)`
`refType · refId` (polymorphic: invoice, stocktake) · `note? · createdById → User · createdAt`
`StockMovementType` = `PURCHASE | SALE | SALE_RETURN | PURCHASE_RETURN | STOCKTAKE | OPENING`

**`CashMovement`** — append-only ledger, the single explanation for every cashbox change
`id · cashboxId → Cashbox · type (CashMovementType) · amount (Decimal, signed)`
`balanceAfter (Decimal) · refType · refId · customerId? · supplierId? · note?`
`createdById → User · createdAt`
`CashMovementType` = `SALE_PAYMENT | PURCHASE_PAYMENT | CUSTOMER_COLLECTION | SUPPLIER_PAYMENT | SALE_RETURN_REFUND | PURCHASE_RETURN_REFUND | OPENING`
PRD §8: no generic cash in/out — every movement carries a party or an invoice reference.

**`PartyTransaction`** — append-only ledger for customer/supplier balances (drives the account statement, PRD §6/§7)
`id · partyType (CUSTOMER | SUPPLIER) · customerId? · supplierId?`
`type (INVOICE | PAYMENT | RETURN | OPENING) · debit (Decimal) · credit (Decimal) · balanceAfter (Decimal)`
`refType · refId · note? · occurredAt · createdById → User · createdAt`

**`Collection`** (قبض) / **`Payment`** (صرف)
`id · number (Int @unique) · customerId|supplierId · cashboxId → Cashbox`
`amount (Decimal) · note? · occurredAt · status (CONFIRMED | CANCELLED)`
`createdById → User · cancelledAt? · cancelledById? · createdAt`

**`Stocktake`**
`id · number (Int @unique) · status (DRAFT | CONFIRMED | CANCELLED) · note?`
`createdById → User · confirmedAt? · createdAt`

**`StocktakeLine`**
`id · stocktakeId → Stocktake · productId → Product`
`systemQtyInSub · countedQtyInSub · differenceInSub (all Decimal) · note?`

**`AuditLog`** (PRD §13)
`id · userId → User · action (String)` e.g. `sale.create`, `product.price.update`
`entityType · entityId · entityLabel`
`beforeJson Json? · afterJson Json?` — before/after values where applicable
`ipAddress? · createdAt`
Indexed on `[entityType, entityId]` and `[createdAt]`.

**`Notification`** (PRD §14)
`id · type (LOW_STOCK | OUT_OF_STOCK | CUSTOMER_BALANCE | SUPPLIER_BALANCE | SYSTEM)`
`severity (INFO | WARNING | CRITICAL) · titleKey · bodyParams Json`
`entityType? · entityId? · isRead · readAt? · dedupeKey @unique · createdAt`
`dedupeKey` prevents re-notifying the same product every page load.

**`Setting`** — single-row key/value store
`key @id · value Json · updatedAt`
Holds shop name, phone, address, logo path, default cashbox, default print size, tax note, invoice footer.

**`DocumentCounter`**
`type @id · lastNumber Int`
Incremented inside the same transaction as the document it numbers.

### 4.3 Transactional invariants

Every one of these runs inside a single `prisma.$transaction`:

**Confirm a sale invoice**
1. Re-validate payload against the Zod schema.
2. Assert permission `sale.create`.
3. For each line: load product, convert to sub-units, assert `stockQty >= qtyInSub` (**hard block**, PRD decision).
4. Decrement `Product.stockQty`; write a `SALE` `StockMovement`; freeze `costPerSubAtSale` from `avgCostPerSub`.
5. Compute `subtotal`, apply the single invoice discount → `total`.
6. `remainingAmount = total − paidAmount`; derive `paymentStatus`.
7. `paidAmount > 0` → increment cashbox, write `SALE_PAYMENT` `CashMovement`.
8. `remainingAmount > 0` → increment `Customer.balance`, write `PartyTransaction`.
9. Increment `DocumentCounter`.
10. Write `AuditLog`.

**Confirm a purchase invoice**
Same shape, inverted: stock **increases**; `avgCostPerSub` recomputed as
`(oldQty × oldAvg + newQty × newCost) ÷ (oldQty + newQty)`;
cashbox **decreases** by `paidAmount`; `Supplier.balance` increases by `remainingAmount`.

**Cancel any invoice**
Never deletes. Sets `status = CANCELLED`, writes compensating `StockMovement` / `CashMovement` / `PartyTransaction` rows, records `cancelReason` + `cancelledById`, writes `AuditLog`. Balances end where they started.

**Edit an invoice**
Modelled as full reversal + re-application inside one transaction, so the ledgers stay append-only and auditable. Requires `sale.edit` / `purchase.edit`.

---

## 5. Feature → component map

| Feature | Route | Key components |
|---------|-------|----------------|
| Login | `/login` | `UserTileGrid`, `UserTile`, `PasswordStep` (eye toggle), `LoginBrandPanel` |
| Dashboard | `/` | `KpiRow`, `StatCard` ×4, `SalesTrendChart`, `QuickActions`, `LowStockPanel`, `TopDebtorsPanel`, `RecentInvoices` |
| New sale | `/sales/new` | `InvoiceForm`, `EntityCombobox` (customer), `ProductSearch`, `LineItemsTable`, `LineRow` (unit dropdown), `TotalsPanel`, `PaymentPanel`, `CashboxSelect`, `SaveInvoiceDialog` (print prompt), `HotkeyBar` |
| Sales list | `/sales` | `DataTable`, `InvoiceFilters`, `DateRangePicker`, `StatusBadge`, `MoneyCell` |
| Invoice detail | `/sales/[id]` | `InvoiceHeaderCard`, `InvoicePartyCard`, `InvoiceLinesTable`, `InvoiceTotalsCard`, `InvoiceActionsBar`, `PrintSizeDialog` (A4/A5/80mm), `CancelInvoiceDialog`, `WhatsappShareButton` |
| Print | *(no route)* | `PrintLayoutA4`, `PrintLayoutA5`, `PrintLayout80mm` |
| PDF | `/api/invoices/[id]/pdf` | `InvoicePdfDocument` (A4 only) |
| Purchases | `/purchases/*` | Mirrors sales, supplier-bound |
| Returns | `/sales-returns/*`, `/purchase-returns/*` | `ReturnForm`, `OriginalInvoicePicker`, `ReturnLinesTable` |
| Inventory | `/inventory` | `DataTable`, `InventoryFilters`, `ProductFormDialog` (tabbed: عام / وحدات / أسعار), `UnitConversionPreview`, `StockStatusBadge`, `InventoryValueSummary` |
| Product detail | `/inventory/[id]` | `ProductSummaryCard`, `StockMovementTable`, `ProductPriceHistory` |
| Stocktake | `/inventory/stocktake/*` | `StocktakeSheet`, `StocktakeLineRow`, `StocktakeDiffSummary` |
| Customers | `/customers`, `/customers/[id]` | `DataTable`, `CustomerFormDialog`, `BalanceBadge`, `CustomerInvoicesTab`, `CustomerPaymentsTab`, `AccountStatementTab`, `StatementPrintDialog` |
| Suppliers | `/suppliers/*` | Mirrors customers |
| Cashboxes | `/cashboxes` | `CashboxSummaryStrip`, `CashboxFilter`, `CashMovementTable`, `CashboxBalanceCard` |
| Collections / Payments | `/collections/*`, `/payments/*` | `CollectionForm`, `PaymentForm`, `PartyBalancePreview`, `DataTable` |
| Reports | `/reports`, `/reports/[report]` | `ReportPicker`, `ReportShell`, `ReportFilters`, `ReportTable`, `ReportChart`, `ProfitLossReport`, `ExportButtons` |
| Notifications | `/notifications` | `NotificationBell`, `NotificationList`, `NotificationItem` |
| Audit log | `/audit-log` | `DataTable`, `AuditFilters`, `AuditDiffDialog` (before/after) |
| Settings | `/settings/*` | `ShopProfileForm`, `PrintPrefsForm`, `UsersTable`, `UserFormDialog`, `RolesTable`, `PermissionMatrix`, `CategoriesTable`, `CashboxesTable` |

---

## 6. Cross-cutting behaviours

### 6.1 Authentication & authorisation

- **Login:** `/login` renders a tile grid of active users (name + coloured monogram). Selecting a tile reveals a password field with a show/hide eye toggle. NextAuth credentials provider, `bcryptjs` compare.
- **Session:** JWT, 12-hour expiry, carries `userId`, `displayName`, `roleId`, `permissions[]`.
- **Route protection:** `middleware.ts` redirects unauthenticated requests to `/login`.
- **Permission checks happen in three places** and all three are required:
  1. `middleware.ts` — coarse route access.
  2. **Every Server Action** calls `requirePermission('x.y')` before touching data. This is the real boundary.
  3. UI — hides/disables controls the user can't use. Cosmetic only, never the enforcement point.
- **Known trade-off:** the tile grid publishes the staff roster to anyone who loads `/login`. Acceptable on a shop LAN; a `settings.loginMode = 'tiles' | 'username'` flag exists so it can be switched before the app goes on the public internet. Recorded in [MEMORY.md](./MEMORY.md).

### 6.2 Permission catalogue (`lib/permissions.ts`)

Grouped keys, rendered as the role-builder matrix:
`sale.*` (view, create, edit, cancel, print) · `purchase.*` · `return.*` · `inventory.*` (view, create, edit, adjustPrice, stocktake) · `customer.*` · `supplier.*` · `cashbox.*` · `collection.*` · `payment.*` · `report.*` (view, profitLoss, export) · `user.*` · `role.*` · `audit.view` · `settings.manage`

### 6.3 Data flow

- **Reads:** Server Components query Prisma directly, or call a `get*` function in `actions/`. No client-side fetching for initial page data.
- **Writes:** Server Actions only. Every action: `requirePermission` → `schema.parse` → `$transaction` → `writeAudit` → `revalidatePath` → return `ActionResult`.
- **`ActionResult<T>`** (`types/index.d.ts`): `{ success: true, data: T } | { success: false, error: string, fieldErrors?: Record<string,string[]> }`. Never throw across the action boundary; always return a shape the UI can render.
- **Route handlers** exist for exactly two things: NextAuth, and the PDF stream. Everything else is a Server Action.

### 6.4 Filtering, search, pagination

Every list screen reads its state from **URL search params** (`?q=&from=&to=&status=&page=`), so filters are shareable, bookmarkable, and survive refresh. Server-side filtering and pagination — never load a full table into the client. Product search is debounced 250 ms, server-side, matching name / SKU / barcode; an exact barcode match adds the line immediately.

### 6.5 Pricing suggestion (PRD §2)

`lib/pricing.ts` → `suggestSellPrice(productId, customerId)`, in strict order:
1. Last price this **customer** paid for this **product** (most recent confirmed sale line).
2. Else the latest general sale price for the product (most recent confirmed sale line, any customer).
3. Else `Product.sellPricePerBase`, converted to the selected unit.
The UI shows which tier fired, so the cashier understands the number.

### 6.6 Costing (weighted moving average)

`lib/costing.ts`. Recomputed on every confirmed purchase and purchase-return. `avgCostPerSub` is copied onto each sale line as `costPerSaleAtSale` at sale time, so Profit & Loss stays historically accurate even after later purchases move the average.

### 6.7 Document numbering

`DocumentCounter` incremented inside the document's own transaction. Per-type sequences: sale #1, purchase #1 coexist. Displayed as `#000123`.

### 6.8 Audit log

`lib/audit.ts` → `writeAudit({ action, entityType, entityId, entityLabel, before, after })`. Called by every mutating action. For updates it diffs before/after and stores both JSON blobs; the UI renders a field-by-field comparison.

### 6.9 Notifications

Generated server-side after the transactions that can trigger them (stock change → low/out of stock; balance change → party balance). `dedupeKey` (e.g. `low_stock:<productId>:<date>`) prevents duplicates. Bell in the topbar shows unread count.

### 6.10 Printing & sharing

- User picks size at print time: **A4 / A5 / 80 mm**. Default remembered in settings.
- Three print stylesheets/components; `@media print` hides the app shell.
- **PDF is always A4**, streamed from `/api/invoices/[id]/pdf`.
- WhatsApp = `wa.me` deep link with a text summary and, where applicable, the invoice number. No Business API.

### 6.11 Exports

Reports and list grids export to CSV (UTF-8 **with BOM**, so Arabic opens correctly in Excel) and to the A4 PDF path where a document makes sense.

### 6.12 Errors & loading

- Action results → **Sonner toasts** (success/error).
- Field errors → **inline** under the input, from `fieldErrors`.
- Initial loads → **skeletons** matching the real layout (`loading.tsx` per route).
- Mutations → button spinner + disabled state.
- `error.tsx` per route group; `not-found.tsx` for missing entities.

### 6.13 i18n

Locale `ar`, `dir="rtl"` set on `<html>`. Every string — labels, buttons, toasts, validation messages, empty states, placeholders, print templates — comes from `messages/ar.json`. A hardcoded Arabic (or English) string in a component is a build-breaking review failure.

### 6.14 Keyboard shortcuts (mirrors Sahl)

| Key | Action |
|-----|--------|
| `F2` | Focus product search |
| `F4` | Print |
| `F8` | Delete focused line |
| `F9` | Save |
| `F10` | New document |
| `F12` | Save + new |
| `Esc` | Close dialog / cancel |
| `Ctrl+K` | Global search |

Registered via `hooks/use-hotkeys.ts`, scoped per screen, never firing while a text input has focus (except `F*`). Hints render on buttons via `<Kbd>`.

### 6.15 Responsive

Mobile is a first-class target, not a shrunk desktop.

- **Sidebar:** icon rail ≥1024px, full labels ≥1280px, off-canvas Sheet below 1024px.
- **Tables:** real tables ≥768px; **stacked cards** below 768px — not a horizontal scroll bar.
- **New sale on mobile:** single column, sticky totals/pay bar pinned to the bottom.
- **Dialogs:** centred Dialog ≥768px, bottom Sheet below.
- **Filters:** inline row on desktop, collapsible Sheet on mobile.
- Breakpoints, per-component behaviour, and touch targets are specified in [UI_DESIGN_RULES.md](./UI_DESIGN_RULES.md).

---

## 7. State management

### 7.1 Where state lives — in priority order

1. **Server (Prisma)** — all domain data. Default.
2. **URL search params** — filters, pagination, active tab, date ranges.
3. **Server Action + `revalidatePath`** — mutations.
4. **`react-hook-form`** — form field state.
5. **Zustand** — only two stores, both genuinely client-only:
   - `ui.store.ts` — sidebar collapsed, table density preference, mobile nav open.
   - `invoice-draft.store.ts` — the in-progress invoice lines on the new-sale screen (survives accidental navigation before save).

Zustand is **not** a cache for server data. No `useEffect` + `fetch` for page data.

---

## 8. Non-negotiables

1. **No mock data. Ever.** Every value on screen comes from PostgreSQL via Prisma. `prisma/seed.ts` fills the dev database — that is the only "sample data" mechanism.
2. **No `src/` directory.** App code at project root.
3. **All shared TypeScript types live in `types/index.d.ts`.** Never co-located.
4. **All Zod schemas live in `lib/validations.ts`.** Never co-located, never inline.
5. **Every Server Action re-validates** with the same Zod schema the client used. Client validation is UX, never trust.
6. **Every Server Action checks permission** via `requirePermission()` before touching data.
7. **No hardcoded user-facing strings.** Everything through `messages/ar.json`.
8. **Logical CSS properties only** — `ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`. Physical `left`/`right`/`pl-`/`pr-` are forbidden in components; the layout must survive a direction flip.
9. **No hardcoded colours.** Only design tokens (`bg-primary`, `text-muted-foreground`, …). No `bg-blue-500`, no raw hex in a component.
10. **Money is `Decimal`,** never JS `number`, from database through to calculation. Format only at render.
11. **All stored quantities are in sub-units.** Convert at the boundary, never mid-calculation.
12. **No hard deletes on financial or inventory records.** Cancel/reverse with a reason and an audit trail.
13. **Multi-step writes run in one `prisma.$transaction`.** A sale that decrements stock but fails to record cash must not be possible.
14. **Every mutation writes an `AuditLog` row** with the acting user.
15. **Every input has a real placeholder** showing format or an example — never a restatement of the label. Every password input has a show/hide eye toggle.
16. **No mega-files.** A component over ~150 lines of JSX gets decomposed. Pages compose components; they don't contain the markup.
17. **Every interactive element** has visible hover, focus-visible, active, and disabled states, and a minimum 44×44 px touch target on mobile.
18. **Both themes and all three breakpoint bands are verified** before a screen is called done.
19. **`ui-ux-pro-max` and `frontend-design` are invoked** before building or reshaping any screen.
20. **Server Components by default.** `"use client"` only where interactivity requires it, pushed as far down the tree as possible.

---

## 9. PRD coverage matrix

| PRD § | Requirement | Where it lands |
|-------|-------------|----------------|
| §2 | Create sales invoice, customer select, product search, show-all-when-empty | `/sales/new`, `ProductSearch` |
| §2 | 3-tier price suggestion | `lib/pricing.ts` |
| §2 | One invoice-level discount | `Invoice.discountAmount`, `TotalsPanel` |
| §2 | One cashbox per invoice | `Invoice.cashboxId` (single FK) |
| §2 | Credit sales, partial/zero payment | `paidAmount` / `remainingAmount` / `PaymentStatus` |
| §2 | "Saved — print now?" prompt | `SaveInvoiceDialog` |
| §3 | Invoice list with all listed columns + filters | `/sales`, `InvoiceFilters` |
| §3 | Interactive detail page, not a PDF | `/sales/[id]` |
| §4 | Purchases mirror sales, supplier-bound | `/purchases/*` |
| §4 | Confirm → stock up, cashbox down, supplier balance up | `purchases.actions.ts` transaction |
| §5 | No separate products page | Product CRUD lives only on `/inventory` |
| §5 | Base/sub units + ratio, auto-derived prices | `Product`, `lib/units.ts`, `UnitConversionPreview` |
| §5 | Buy in base, sell in sub | `InvoiceLine.unitType`, per-line dropdown |
| §5 | Inventory columns incl. avg cost + both stock values | `/inventory` DataTable |
| §5 | Min stock → notification | `lib/notifications.ts` |
| §6 | Customer page: invoices, payments, balance, statement, total purchases, send | `/customers/[id]` tabs |
| §7 | Suppliers, same | `/suppliers/[id]` |
| §8 | Unlimited cashboxes; aggregate default, per-box on filter | `/cashboxes` |
| §8 | No cash movement without a party or invoice | `CashMovement.refType` + party FK, enforced in actions |
| §9 | Collections ↑cashbox ↓customer balance; payments ↓cashbox ↓supplier balance | `collections.actions.ts`, `payments.actions.ts` |
| §10 | 9 reports incl. P&L, date ranges + filters | `/reports/[report]` |
| §11 | Interactive invoice page, permission-gated actions, print/PDF/WhatsApp | `/sales/[id]`, `InvoiceActionsBar` |
| §12 | Multiple users, roles, granular permissions, action attribution | `User`, `Role`, `lib/permissions.ts`, `createdById` everywhere |
| §13 | Audit log with user + time + action + entity + before/after | `AuditLog`, `lib/audit.ts` |
| §14 | Useful, non-spammy notifications | `Notification` + `dedupeKey` |
| §15 | Price frozen at transaction time | `InvoiceLine` snapshot fields |
| §15 | No hard deletes on financial history | `status = CANCELLED` + compensating ledger rows |
| §15 | Every movement traceable | `StockMovement`, `CashMovement`, `PartyTransaction` |
| §15 | Consistent internal unit | Everything stored in sub-units |

---

## 10. Operations — backup, migrations, incident response

### 10.1 Backup

- **Neon (current dev/prod DB):** Neon takes continuous WAL-based backups automatically on all plans and exposes **point-in-time restore (PITR)** through the console/API — no separate backup job to run. Retention window depends on plan (check the current Neon plan's PITR window before relying on a specific number of days back).
- **If self-hosting Postgres instead** (e.g. the LAN Docker setup in `docker-compose.yml`): there is currently **no automated backup job**. Before any real data lives only there, add a scheduled `pg_dump` (cron or a small script) to a location off the same machine, and periodically test that a dump actually restores — an untested backup is not a backup.
- Application-level safety net: the schema's append-only ledgers (`StockMovement`, `CashMovement`, `PartyTransaction`, `AuditLog`) mean most operational mistakes are reconstructable from history even without restoring a snapshot — but this is not a substitute for real backups (it doesn't help against data loss at the storage layer).

### 10.2 Migrations in production

- Standard Prisma flow: `npx prisma migrate deploy` applies pending migrations from `prisma/migrations/` without generating new ones or prompting — this is the command to run in a deploy pipeline, never `migrate dev`.
- **Before deploying a migration that touches a table with production data:** read the generated SQL in `prisma/migrations/<timestamp>_<name>/migration.sql` and confirm it's additive (new nullable column, new table) rather than destructive (dropped column, `NOT NULL` added to an existing column, renamed column) before it runs against real data. A destructive migration should ship as two deploys: one to backfill/dual-write, one to finish the change — not attempted as a single step against live data.
- **Rollback:** Prisma has no automatic "undo migration" command. If a deployed migration needs reverting: restore from the pre-migration backup/PITR point, or hand-write a compensating migration that reverses the specific change (safer when the app has kept running and accumulated new rows since). Never edit an already-applied migration file in place — write a new one.
- `npm run db:reset` (`prisma migrate reset --force`) drops the entire database and reseeds — **dev/local only**, never run against a database anyone depends on.

### 10.3 Before pointing a real domain at this app

- Set `experimental.serverActions.allowedOrigins` in `next.config.ts` to the real production origin(s) once one exists. Left unset today (correct for local/LAN use — Next.js falls back to request-derived defaults), but should be pinned explicitly once the prod domain is fixed, so a Server Action can't be invoked cross-origin from an unexpected host.
- Generate a real `NEXTAUTH_SECRET` (`openssl rand -base64 32` or equivalent) — `.env.example`'s placeholder value must never reach a real deployment.

### 10.4 Incident response quick reference

- **Health check:** `GET /api/health` returns `{ status: "ok" }` (200) or `{ status: "error" }` (503) based on a live `SELECT 1` — point uptime monitoring here.
- **A stuck/hung transaction holding row locks** (observed during test runs against Neon: a killed process can leave a Postgres backend `idle in transaction`, blocking every later transaction on the same rows): identify it with `SELECT pid, state, query FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle in transaction'`, then `SELECT pg_terminate_backend(<pid>)` to clear it. This is a symptom of a crashed/killed app process, not something that happens under normal operation.
- **Error visibility today is `lib/logger.ts`'s `logError()`** — structured JSON to stdout/stderr, no external sink wired up. On Vercel this lands in the platform's function logs (searchable there, but not alerting or retained long-term). Adding a real error-tracking service (Sentry or similar) is a known gap, tracked separately — until then, treat production error triage as "go read the platform's log viewer."
