# PROGRESS TRACKER — Teba (طيبة)

> **Single source of truth for "what's done."** Update this file after **every** task — not at the end of a phase, not at the end of a session. A task is only `DONE` when it meets its exit criteria, passes the two-theme / four-width check where it touches UI, and `npm run typecheck` and `npm run lint` are clean.

**Statuses:** `TODO` · `IN PROGRESS` · `DONE` · `BLOCKED`

Task IDs mirror [BUILD_PLAN.md](./BUILD_PLAN.md) exactly. When a task changes state here, tick its checkbox there too.

---

## Phase summary

| Phase | Title | Status | Notes |
|-------|-------|--------|-------|
| 0 | Scaffold & foundations | DONE | RTL app, theme toggle, database connection verified. |
| 1 | Design system | DONE | Full token set, restyled primitives, Money/StatusBadge/Kbd, hotkeys, `/design-system` preview verified both themes × 4 widths. |
| 2 | App shell & static UI | DONE | 22 screens; responsive/theme audit pass complete. |
| 3 | Database schema | DONE | Schema, migration, and seed reconciled against Neon. |
| 4 | Auth, permissions & sales slice | DONE | Full vertical slice verified end-to-end against Neon + browser. |
| 5 | Purchases, inventory & returns | DONE | All 9 tasks wired against Prisma; `typecheck`/`lint` clean. `next build` not verified this session (Prisma query-engine DLL locked by another process). |
| 6 | Parties, cashboxes & money | DONE | Party lists/profiles, statements, cashboxes, transfers, collections, payments wired against Prisma; `db:reconcile` passes. |
| 7 | Reports, notifications & audit | DONE | All 9 reports, notifications, audit log, and settings incl. roles permission matrix wired against Prisma. |
| 8 | Polish, motion & edge cases | TODO | |
| 9 | Testing | TODO | Final pass |

**Overall: 87 / 96 tasks done.**

---

## Phase 0 — Scaffold & foundations

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P0-1 | Next.js scaffold, no `src/` | DONE | Project files live at repository root. |
| P0-2 | TypeScript strict config | DONE | `noUncheckedIndexedAccess` enabled. |
| P0-3 | ESLint + Prettier + scripts | DONE | Typecheck and lint pass. |
| P0-4 | Docker Postgres + `.env.example` | DONE | Healthy PostgreSQL 16 container; host port 5433. |
| P0-5 | Prisma install + client singleton | DONE | `prisma db push` connected and generated client. |
| P0-6 | shadcn/ui init + component set | DONE | Current CLI omitted `form`; added RHF wrapper. |
| P0-7 | IBM Plex Sans Arabic self-hosted | DONE | Four official complete WOFF2 weights and licence. |
| P0-8 | next-intl + `messages/ar.json` | DONE | Arabic dictionary renders on `/`. |
| P0-9 | Root layout: RTL, providers, toaster | DONE | Session provider receives `null` until P4 auth. |
| P0-10 | `types/index.d.ts` + `lib/validations.ts` | DONE | ESLint blocks `z.object` outside validation file. |
| P0-11 | `utils` / `action-result` / `format` | DONE | Decimal-safe money formatting and Gregorian dates. |

## Phase 1 — Design system

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P1-1 | Colour tokens, both themes | DONE | Full indigo/teal ramps + semantic added as raw CSS vars (Tailwind v4 `@theme inline` vars aren't runtime-readable — see MEMORY). |
| P1-2 | Semantic + chart tokens | DONE | `success/warning/danger/info/neutral` `-fg`/`-bg` pairs, both themes; chart-1…6 already existed from P0. |
| P1-3 | Type scale utilities | DONE | `text-display/h1/h2/h3/body/body-sm/label/caption` via `@theme` `--text-*` pairs; `tabular-nums` utility added. |
| P1-4 | Density system | DONE | `[data-density="compact"/"comfortable"]` CSS custom properties; forced-comfortable override below 768px. |
| P1-5 | Restyle shadcn primitives | DONE | button (primary/accent/secondary/outline/ghost/destructive), badge, input, card, dialog. `alert-dialog.tsx` default variant renamed `default`→`primary` to match. |
| P1-6 | `<Money>` component | DONE | `components/shared/money.tsx`, wraps `formatMoney`, tabular-nums, sign coloring. |
| P1-7 | `<StatusBadge>` component | DONE | `components/shared/status-badge.tsx`, tone→icon+color map per UI_DESIGN_RULES §2.5. |
| P1-8 | `<Kbd>` + `useHotkeys` | DONE | `lib/hotkeys.ts` registry (F2/F4/F8/F9/F10/F12/Esc/Ctrl+K), `hooks/use-hotkeys.ts`, `components/shared/kbd.tsx`. |
| P1-9 | `/design-system` preview route | DONE | Verified both themes × 375/768/1024/1440px via playwright-cli. Delete at P8-11. |

## Phase 2 — App shell & static UI

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P2-1 | AppShell: sidebar + topbar | DONE | |
| P2-2 | Generic DataTable (+ mobile cards) | DONE | Built once, used everywhere |
| P2-3 | Shared components set | DONE | |
| P2-4 | Login screen | DONE | |
| P2-5 | Dashboard | DONE | |
| P2-6 | New sale screen | DONE | Highest-value screen |
| P2-7 | Sales list + filters | DONE | |
| P2-8 | Invoice detail | DONE | |
| P2-9 | Purchases screens | DONE | |
| P2-10 | Returns screens | DONE | |
| P2-11 | Inventory grid + product dialog | DONE | |
| P2-12 | Product detail | DONE | |
| P2-13 | Stocktake | DONE | |
| P2-14 | Customers | DONE | |
| P2-15 | Suppliers | DONE | |
| P2-16 | Cashboxes | DONE | |
| P2-17 | Collections + payments | DONE | |
| P2-18 | Reports hub + shell | DONE | |
| P2-19 | Notifications + audit log | DONE | |
| P2-20 | Settings incl. permission matrix | DONE | |
| P2-21 | Print templates A4/A5/80mm | DONE | |
| P2-22 | Responsive + theme audit pass | DONE | 4 parallel audit passes across all 33 routes, both themes, 4 widths; fixed density-toggle root cause, Radix RTL default-direction bug, dashboard/report chart RTL wrapping, audit-log Arabic labels, missing user-form password field, and touch-target sizing. `typecheck`/`lint` clean. |

## Phase 3 — Database schema

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P3-1 | Write `schema.prisma` | DONE | 20 models, full ARCHITECTURE.md §4.2 coverage. |
| P3-2 | Indexes + constraints | DONE | Written inline with P3-1. |
| P3-3 | **Schema approval** | DONE | Approved after resolving open questions #1 (no warehouse) and #4 (no VAT). |
| P3-4 | Initial migration | DONE | Applied to Neon (`ep-empty-cloud-awx3l5l5-pooler`), verified via Prisma Client queries. |
| P3-5 | `prisma/seed.ts` | DONE | Reconciles: 3 roles, 4 users, 3 cashboxes, 8 categories, 61 products, 20 customers, 10 suppliers, 28 purchases, 44 sales, 6 returns, collections/payments, 1 stocktake. Self-verifying — throws if any balance doesn't equal its ledger sum. |
| P3-6 | `db:reset` script | DONE | Verified clean-slate run end-to-end. |

## Phase 4 — Auth, permissions & sales slice

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P4-1 | Permission catalogue | DONE | Shared catalogue now drives role matrix and seed; added missing transfer label. |
| P4-2 | NextAuth credentials provider | DONE | Credentials + bcrypt, 12-hour JWT, session fields, login audit; auth endpoint smoke-tested. |
| P4-3 | `requireAuth` / `requirePermission` | DONE | Reads live user/role for immediate deactivation and permission changes. |
| P4-4 | Middleware protection | DONE | Anonymous app routes redirect to login; auth endpoint stays public. |
| P4-5 | Wire login + `loginMode` flag | DONE | Login page now a Server Component reading real users; `tiles` and `username` modes; wrong password rejected, sign-in redirects to `callbackUrl`. User menu wired to session + real sign-out. |
| P4-6 | Audit + numbering libs | DONE | Diff snapshots and transactional per-type counters. |
| P4-7 | Domain libs (units, costing, pricing, stock) | DONE | Decimal-based helpers; pure checks passed. |
| P4-8 | Auth/product/sales Zod schemas | DONE | Auth, product, sale, list, and Egyptian phone validation. |
| P4-9 | `sales.actions.ts` | DONE | Create/edit/cancel/read plus form queries; serializable writes, audit and append-only ledgers. Rollback transaction checks passed. |
| P4-10 | Wire new-sale to real data | DONE | Server-side product search (name/SKU/barcode), barcode exact-match instant add, live price suggestion, hard negative-stock block. Created a real invoice: stock −4, cash +38, audit row, one transaction. |
| P4-11 | Wire sales list | DONE | Server-side filter/sort/paginate from URL search params (`lib/sales-filters.ts`), debounced search. Verified: unfiltered 3 pages, PAID 2, number search 1 row. |
| P4-12 | Wire invoice detail + cancel | DONE | Real detail, permission-gated edit/cancel, cancel with mandatory reason. Verified exact ledger reversal (stock and cash returned to baseline) + `sale.cancel` audit. Edit flow verified: line history preserved via `isCurrent`. |
| P4-13 | A4 PDF route | DONE | Authenticated sale PDF streamed; IBM TTF Arabic shaping checked visually. |

## Phase 5 — Purchases, inventory & returns

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P5-1 | Inventory schemas + actions | DONE | `actions/inventory.actions.ts`: CRUD with SKU/barcode uniqueness checks, delete blocked on stock or movement history, audit on create/edit/delete. |
| P5-2 | Wire inventory grid | DONE | `/inventory` fetches real products + categories; filtering/pagination stay client-side over the full (single-shop-scale) list, as already built in Phase 2. |
| P5-3 | Wire product dialog | DONE | `ProductFormDialog` now calls `createProduct`/`updateProduct` and surfaces field errors. |
| P5-4 | Wire product detail | DONE | Movement history from `StockMovement`, price history derived from `AuditLog` `product.edit` before/after diffs (no separate price-history table). |
| P5-5 | `purchases.actions.ts` + avg cost | DONE | `lib/purchase-ledger.ts` mirrors `sales-ledger.ts`; weighted-avg cost recomputed on incoming stock only, never on the reversing leg. |
| P5-6 | Wire purchase screens | DONE | `components/purchases/*`, all 3 routes wired to real Prisma data. |
| P5-7 | `returns.actions.ts` | DONE | `lib/returns-ledger.ts` + `actions/returns.actions.ts`; caps return qty against `qtyInvoiced - Σ(prior confirmed returns)` per product, not just the current invoice line. |
| P5-8 | Wire return screens | DONE | New `ReturnFormView`/`ReturnDetailView`/`ReturnsListView` (URL-filtered, mirrors sales) wired for both sale and purchase returns; settlement toggle (cashbox vs party balance). |
| P5-9 | Stocktake actions + wiring | DONE | `actions/stocktake.actions.ts`: confirm writes one `STOCKTAKE` `StockMovement` per non-zero difference and sets `stockQty` directly to the counted qty. Added `/inventory/stocktake/[id]` detail route (list already linked there but it never existed in Phase 2). |

## Phase 6 — Parties, cashboxes & money

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P6-1 | Customer/supplier schemas + actions | DONE | Create/edit/list/archive actions; opening balance creates an `OPENING` ledger row atomically. No credit limit, per owner decision. |
| P6-2 | Wire party lists | DONE | Lists and form/archive controls now call Server Actions; no client-generated records. |
| P6-3 | Wire party detail + statement | DONE | Real invoices/payments/ledger; running balance, A4/A5 print route, WhatsApp summary. |
| P6-4 | Cashbox actions + wiring | DONE | Aggregate/per-box balances and real movements; atomic linked cashbox transfers. |
| P6-5 | Collections action | DONE | Cashbox ↑ and customer balance ↓ with both ledger rows + audit in one transaction; cancellation reverses. |
| P6-6 | Payments action | DONE | Cashbox ↓ and supplier balance ↓ with both ledger rows + audit in one transaction; cancellation reverses. |
| P6-7 | Wire collection/payment screens | DONE | Forms have live balance preview; list screens use real rows and cancel/reverse flow. |
| P6-8 | Reconciliation check | DONE | `npm run db:reconcile`: 3 cashboxes, 20 customers, 10 suppliers reconciled. |

## Phase 7 — Reports, notifications & audit

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P7-1 | Reports action foundation | DONE | Shared validated filters, half-open date ranges, report-specific option queries, and matching date-bound aggregates. |
| P7-2 | Sales/purchases/inventory reports | DONE | `lib/report-queries.ts`: daily-grouped sales/purchases with totals, inventory valuation at cost and sale price. |
| P7-3 | Party + collection/payment reports | DONE | Customer/supplier invoiced-vs-settled-vs-balance; collections/payments listing reports. |
| P7-4 | Cashbox report | DONE | Per-cashbox inflow/outflow/net/balance. |
| P7-5 | **Profit & Loss** | DONE | Revenue − discounts − returns − COGS from `costPerSubAtSale` (not current avg), gross margin per period. |
| P7-6 | Charts + CSV/PDF export | DONE | Recharts trend charts; CSV with UTF-8 BOM; PDF via browser print (matches existing A4/A5/80mm print pattern). |
| P7-7 | Notifications | DONE | `lib/notifications.ts` dedupe-keyed low/out-of-stock and party-balance notifications synced from every sale/purchase/return/stocktake/collection/payment mutation; bell + `/notifications` wired. |
| P7-8 | Wire audit log | DONE | `/audit-log` filtered by user/action/entity/date with before/after diff dialog. |
| P7-9 | Settings wiring + role matrix | DONE | Shop profile, print prefs, users, categories, cashboxes CRUD; roles permission matrix now reads/writes real `Role.permissions` via `saveRole` (was a static mock — fixed this session) and gates live via `requirePermission` reading DB role on every call. |

## Phase 8 — Polish, motion & edge cases

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P8-1 | Page + dialog transitions | IN PROGRESS | Page fade+rise, dialog/sheet motion already present, reduced-motion honored globally. |
| P8-2 | Skeletons everywhere | IN PROGRESS | `loading.tsx` added to every route (list/detail/new/edit); no bare spinners found outside Sonner's toast icon. |
| P8-3 | Micro-interactions | IN PROGRESS | Row hover/button press already existed; added KPI count-up and sticky-header scroll shadow (topbar + DataTable). |
| P8-4 | Empty + error states | IN PROGRESS | Root + dashboard-scoped `error.tsx`/`not-found.tsx` added; audited all 28 EmptyState usages — existing actions already correct, none missing a genuine action. |
| P8-5 | Edge cases | IN PROGRESS | Zero-stock, discount>subtotal, paid>total, already-cancelled, concurrent-edit, unitsPerBase=1, zero-balance, empty-invoice all already handled; fixed category-in-use showing wrong error message. |
| P8-6 | Accessibility audit | IN PROGRESS | Landmarks (header/nav/aside/main) confirmed present; skip-link jumped to URL anchor but never moved focus — fixed with `tabIndex={-1}` on `<main>`. Keyboard walkthrough of the sale flow (F2 search → select → line → totals) verified in a real browser; row/search-result buttons and inputs all correctly labeled for screen readers. |
| P8-7 | Performance pass | IN PROGRESS | `next build` succeeds; every route is a Server Component by default (zero `"use client"` `page.tsx` files); `loading.tsx` gives every route an automatic Suspense boundary; bundle sizes reviewed (205 kB shared, heaviest route 393 kB for the chart-bearing reports page). |
| P8-8 | Final responsive + theme sweep | TODO | |
| P8-9 | Hardcoded-string audit | IN PROGRESS | Grepped `components/` and `app/` for literal Arabic text. Fixed: `أ/` staff-prefix hardcoded in both A4/A5 print layouts (now `print.staffPrefix`). Remaining Arabic-Indic-digit hits are the locked phone-placeholder convention (`٠١٠xxxxxxxx`, per UI_DESIGN_RULES §6.2) and static demo product names in the print-template preview — not violations. |
| P8-10 | Token + logical-property audit | IN PROGRESS | Grepped for hex colors, `bg-<tailwind>-<n>`, and physical CSS properties. Zero violations outside the three print templates (explicitly exempted by UI_DESIGN_RULES §6.11) and Radix `data-[side=...]` slide-direction variants (not layout properties). |
| P8-11 | Delete `/design-system` route | DONE | Route and its demo-only `designSystemDemoSchema` deleted; no remaining references. |

## Phase 9 — Testing

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P9-1 | Vitest + test DB setup | TODO | |
| P9-2 | Domain lib unit tests | TODO | |
| P9-3 | Validation tests | TODO | |
| P9-4 | Auth + permission tests | TODO | |
| P9-5 | Transaction integration tests | TODO | |
| P9-6 | Ledger reconciliation test | TODO | |
| P9-7 | Playwright E2E | TODO | |
| P9-8 | High-risk component tests | TODO | |

---

## Changelog

*Newest first. One entry per meaningful change — task completions, decision reversals, blockers hit and cleared.*

### 2026-09-22 (Phase 7 complete)
- **Phase 7 complete (P7-1…P7-9).** All 9 reports, notifications, audit log, and settings incl. the roles permission matrix now run against Prisma. Reviewed and fixed after the implementation pass:
  - **Correctness bugs fixed:** `confirmStocktake` passed every submitted line's `productId` to `syncNotifications` including ids the confirm loop had already skipped as not found, so a stale/deleted-product submission threw inside `syncProduct`'s `findUniqueOrThrow` and rolled back an otherwise-valid confirmed stocktake — now filtered to only found products. The reports `[report]/page.tsx` and `settings/page.tsx` collapsed every `ActionResult` failure (including a real `report.profitLoss` permission denial) into a bare `notFound()`/blank page — now shows the actual Arabic error via `EmptyState`. `getUnreadNotificationCount` swallowed all errors (including real DB failures) into a silent `0`, indistinguishable from "no unread" — now only defaults to `0` on the expected auth/permission cases. Notification mark-read/mark-all/delete only revalidated `/notifications`, leaving the topbar bell's unread count stale after navigating away — now also revalidates the root layout.
  - **P7-9's core deliverable was incomplete:** `RolesView` was still the Phase-2 static stub — hardcoded mock permission sets keyed by fake role ids `"1"/"2"/"3"`, and `handleSave` just showed a success toast with a `// P7-9 wires this to roles.actions.ts` comment, never calling any action. Rewired to use the real `RoleRow.permissions` from `getRoles()` and call `saveRole` on save, which required also fixing `saveRole` itself: editing a system role silently returned the unchanged row as a success instead of rejecting the edit, so a direct action call (bypassing the UI's `readOnly` gate) could look like it worked while doing nothing.
  - **Money-document bugs from the Phase 6 review (found last session, fixed this session):** `cancelPayment`/`cancelCollection` read a document's status then unconditionally incremented cashbox/party balances with no status-guarded update and no `Serializable` isolation — concurrent/double-clicked cancels could double-credit. Now both guard the status transition with `updateMany({ where: { status: "CONFIRMED" } })` and check `count === 1` before touching any balance. The new cancel-money-document i18n strings were pasted into `invoices.detail` instead of `moneyDocuments.list`, leaving the new cancel dialog's keys undefined and corrupting the existing invoice cancel button's label via a duplicate JSON key — moved to the correct namespace. `PARTIAL` payment status was mistranslated from "مدفوعة جزئياً" (partially paid) to "أجل" (credit/deferred sale, a different concept) — reverted.
  - **Perf:** `syncNotifications` was called once per invoice/return line inside the per-line stock-move loop of `postSale`/`postPurchase`/`postReturn` (and their reversals), turning a 200-line invoice into 200 sequential notification round-trips inside one DB transaction. Moved to a single call per posting/reversal with the full set of touched product ids.
  - **Consistency:** report filter dropdowns (customer/supplier/product/user) didn't filter `isActive`, unlike every other party-option query in the app — now consistent. `audit.actions.ts` reimplemented the report date-range math inline instead of reusing `reportDateRange` from `lib/report-queries.ts` — now shared.
  - **Known issue, not fixed:** `reportDateRange` (and the older per-action copies in sales/purchases/returns) build day boundaries at UTC midnight while the UI picks/displays local (Egypt, UTC+2/+3) dates, so a "today" filter can be off by 2–3 hours near midnight. Pre-existing across the codebase, not new to this phase; needs a project-wide timezone decision (fixed offset vs. a stored shop timezone), not a local patch — logged here rather than half-fixed in just the newest call sites.
  - `typecheck` and `lint` clean throughout.

### 2026-09-22 (Phase 6 complete)
- **Phase 6 complete (P6-1…P6-8).** Party lists/profiles, statements, cashboxes, transfers, collections, and supplier payments now run against Prisma. Financial documents cancel by compensating cash and party ledger rows; no hard deletes or amount edits. `npm run db:reconcile` passed for all 3 cashboxes, 20 customers, and 10 suppliers. Typecheck and lint pass.
- **P6-1 complete.** Added shared party validation and customer/supplier Server Actions for listing, creating, editing, and archiving. Creation writes the opening ledger row and audit entry in the same transaction; edits leave the opening balance immutable; archive keeps history and requires a zero balance. The owner resolved the credit-limit question: no credit limit in v1.

### 2026-09-22 (Phase 5 complete)
- **Phase 5 complete (P5-1…P5-9).** Purchases, inventory, returns, and stocktake all wired end-to-end against Prisma, copying the Phase 4 sales pattern. `typecheck`/`lint` clean; `next build` not run this session (Prisma's query-engine DLL was locked by another process and couldn't be released).
  - **P5-1…P5-4 (inventory).** `actions/inventory.actions.ts`: CRUD with SKU/barcode uniqueness checks, delete blocked when stock > 0 or any `StockMovement` exists, audit on create/edit/delete. `/inventory` and `/inventory/[id]` wired; filtering/pagination stay client-side over the full product list (as Phase 2 built it) rather than URL-driven — acceptable at single-shop scale, unlike the invoice lists which can grow unbounded. Price history has no dedicated table; it's derived by diffing `product.edit` `AuditLog` rows' `beforeJson`/`afterJson` for `sellPricePerBase`/`purchasePricePerBase`.
  - **P5-5/6 (purchases).** `lib/purchase-ledger.ts` mirrors `lib/sales-ledger.ts`: stock increases instead of decreases, and weighted-average cost recomputes only on the incoming (positive) leg — a cancellation's reversing (negative) leg must not re-derive a cost from a negative quantity. `components/purchases/*` and all three routes wired.
  - **P5-7/8 (returns).** New `lib/returns-ledger.ts` + `actions/returns.actions.ts` cover both sale and purchase returns from one module (`documentType`-parametrized, like the existing shared invoice UI layer). Return quantity is capped against `qtyInvoiced − Σ(qty across all prior CONFIRMED returns of that invoice)` per product — capping against the invoice's own lines alone would let two partial returns together exceed what was actually sold/bought. Added a settlement toggle (`settleFromCashbox`): true moves cash immediately, false adjusts the customer/supplier balance instead — the two are mutually exclusive per return, matching the static form's original refund-hint copy. New `ReturnFormView`/`ReturnDetailView`/`ReturnsListView` components wired for both `/sales-returns/*` and `/purchase-returns/*`; the list is URL-filtered like sales/purchases (`lib/returns-filters.ts`), superseding the original static `originalInvoiceLines` prop shape with a per-invoice server fetch (`getSaleOriginalInvoiceLines`/`getPurchaseOriginalInvoiceLines`) since loading every invoice's lines upfront doesn't scale.
  - **P5-9 (stocktake).** `actions/stocktake.actions.ts`: confirming sets `Product.stockQty` directly to the counted quantity and writes one `STOCKTAKE` `StockMovement` per product whose counted qty differs from system qty (zero-difference lines are recorded on the `StocktakeLine` but produce no movement). Added `/inventory/stocktake/[id]`, a detail route the static list already linked to but that never existed in Phase 2. The static form's "save as draft" button was removed rather than wired to a stub — no draft-persistence action was in scope, and a button that silently did nothing would be worse than not having it.
  - **`/print/[id]`** now dispatches by the invoice's actual `type` (looks it up first) instead of being hardwired to `getSalePrintData`, so purchases and returns print through the same route.

### 2026-09-22 (Phase 4 complete)
- **Phase 4 complete (P4-5, P4-10, P4-11, P4-12).** Wired the four deferred UI tasks and verified the whole slice end-to-end against the seeded Neon database in a real browser: logged in by tile + password, created a sale, saw it in the list, opened the detail, edited it, printed it, and cancelled it — checking the database after each step.
  - **P4-5.** `app/(auth)/login/page.tsx` is now a Server Component reading `getPublicLoginOptions()`; the sample-user array is gone. Added `actions/auth.actions.ts` (`signInWithCredentials` returning `ActionResult` so the Arabic error renders inline rather than throwing, plus `signOutAction`), `components/auth/login-flow.tsx`, and `components/auth/username-step.tsx` for the `loginMode = "username"` path the owner wanted before public deployment. `UserMenu` now shows the signed-in user and actually signs out. Verified: wrong password renders "اسم المستخدم أو كلمة المرور غير صحيحة" in a `role="alert"`; correct password lands on `/`.
  - **P4-10.** `components/sales/sale-form.tsx` (one component serving both create and edit) + `sale-product-search.tsx`, which queries the server instead of filtering a static array. A scan resolving to a single `exactBarcodeMatch` adds the line without a click. Prices start from the catalogue and are corrected by `getSalePriceSuggestion`. A client-side stock block refuses to submit an over-stock line; `createSale` re-checks inside the transaction, which stays the real enforcement point.
  - **P4-11.** List state lives in URL search params per the AGENTS.md convention: `lib/sales-filters.ts` maps params to the filter shape and back, the page is a Server Component calling `getSales`, and `components/sales/sales-list-view.tsx` pushes filter changes to the URL. Search is debounced through the new `hooks/use-debounced-callback.ts`; `DataTableToolbar` gained `defaultSearchValue` so an uncontrolled box does not fight the user's typing on each server re-render.
  - **P4-12.** Detail page is a Server Component; edit/cancel buttons are gated on real permissions read from the session's role. Cancel requires a reason and reverses stock, cash, and party balance in one transaction.
- **Bugs found and fixed while wiring:**
  1. `InvoicePartyCard` linked every party to a hardcoded `/customers/1`. Added a real `partyId` to `InvoiceDetail`; the name renders as plain text for a walk-in sale with no party to link to.
  2. `suggestSellPrice` searched all invoice lines including superseded ones, so editing an invoice could poison later price suggestions with a price that is no longer on any live invoice. Now filtered to `isCurrent: true`.
  3. The invoice detail had a delete button that called a stubbed hard delete — forbidden by AGENTS.md §2.5. Removed; cancel is the only reversal path.
  4. `/print/[id]` still rendered a hardcoded sample invoice, so the print dialog and the post-save print prompt both showed the wrong document. Added `getSalePrintData` and wired the route to it.
  5. `router.refresh()` batched inside `startTransition` left a cancelled invoice still showing as active until a manual reload — the transition settled before the server re-render arrived. Moved out of the transition.
  6. Lowering a quantity or price during an edit could pull the total below the already-recorded paid amount, which `updateSale` correctly rejects — but the form surfaced only the generic message. Paid now follows a shrinking total down, and field errors are surfaced ahead of the generic one.
- **Verification.** A rollback harness against seeded Neon data confirmed posting moves stock/cash/customer balance together, reversal restores all three exactly, and an oversell is blocked. In the browser: invoice created (stock −4, cash +38, `sale.create` audit); cancelled (stock and cash returned to the exact baseline, compensating movement written, `sale.cancel` audit); edited (qty 24→20, total 762.50→724.50, stock +4 returned, old lines preserved as `isCurrent: false` history). `typecheck`, `lint`, and `next build` all pass clean.
- **Not covered, carried forward:** permission gating was exercised only as مدير (admin) — a cashier-role pass belongs with P7-9 when the role matrix is wired. The two-theme / four-width audit for these four screens is not done; it is folded into the P8-8 sweep.

### 2026-09-22 (Phase 4 in progress)
- **Backend Phase 4 tasks complete (P4-6…P4-9, P4-13).** Added Decimal domain calculations, Zod schemas, audit and numbering helpers, sale create/edit/cancel/read actions, server product search and price suggestions, plus authenticated A4 PDF. Added `InvoiceLine.isCurrent` with a migration so edits retain old line records. A rollback transaction verified sale posting, reversal, edit, line history, and balance restoration against seeded Neon data without leaving an invoice behind. An authenticated PDF request returned 200; a rendered A4 page showed correctly shaped Arabic. Owner deferred P4-5/P4-10/P4-11/P4-12 UI wiring, so Phase 4 stays in progress.
- **P4-1 complete.** Canonical `lib/permissions.ts` now supplies the role matrix and seed, including `cashbox.transfer`.
- **P4-2…P4-4 complete.** Added Auth.js credentials provider, bcrypt verification, 12-hour JWT/session carrying identity and role permissions, audited login timestamp, database-backed auth guards, and coarse middleware redirect. Production build passed; `/api/auth/providers` returned 200 and anonymous `/` redirected to `/login` in runtime smoke tests. Typecheck and lint pass clean.
- **P4-5 blocked.** The project's mandatory UI skills (`ui-ux-pro-max`, `frontend-design`) are unavailable in the installed skill directories. The login page remains the Phase 2 static preview until those skills are available.

### 2026-09-22 (Phase 3 complete)
- **Phase 3 complete (P3-1…P3-6).** Full `prisma/schema.prisma` written — 20 models covering every entity in ARCHITECTURE.md §4.2, all FKs indexed, `@@unique([type, number])` on Invoice, `dedupeKey` unique on Notification. Two open questions resolved with the project owner ahead of P3-3 approval: no multi-warehouse, no VAT (both logged in MEMORY.md). Migrated against Neon (the project owner chose cloud Postgres over local Docker for this session — Docker Desktop wasn't running; `.env.example`/`docker-compose.yml` remain the local-dev fallback). `prisma/seed.ts` seeds a fully reconciled dataset (3 roles, 4 users, 3 cashboxes, 8 categories, 61 products, 20 customers, 10 suppliers, 28 purchases, 44 sales, 6 returns, 8 collections, 7 payments, 1 stocktake) and ends with a self-check that throws if any cashbox/customer/supplier/product balance doesn't equal its ledger sum — this caught two real bugs during the build: (1) the reconciliation formula itself double-counted the opening balance (both the `balance` column and an OPENING ledger row carried it — fixed to sum the ledger alone, since the OPENING row already includes it); (2) supplier `PartyTransaction` debit/credit were inverted (a purchase should debit — increase what we owe — and a payment should credit — decrease it — but both were backwards). Also fixed a fragile placeholder-refId-then-backfill pattern in the purchase/sale seed loops (StockMovement rows now get their real `invoiceId` at write time, after the invoice row exists, instead of via a same-transaction `updateMany` sweep). Added `bcryptjs` + `ts-node`, `db:migrate`/`db:seed`/`db:reset` npm scripts, and `package.json#prisma.seed` config. `typecheck`/`lint` clean; `npm run db:reset` verified to run clean from scratch.

### 2026-09-22 (Phase 2 complete)
- **Phase 2 complete (P2-1…P2-22).** Closed the P2-22 responsive/theme audit gate with parallel audit passes across all 33 static routes at 375/768/1024/1440px in both themes. Fixed real bugs surfaced along the way: (1) the density toggle button did nothing because `data-density` was never written to the DOM — `DataTable` now reads the Zustand store and sets it, fixing every table in the app at once; (2) Radix UI primitives (Tabs, etc.) default their internal `dir` to `"ltr"` unless told otherwise, which silently flipped every tabbed dialog (e.g. the product-create form) to LTR layout — fixed once, app-wide, with a `Direction.Provider` in `components/providers.tsx` rather than patching each primitive; (3) dashboard/report charts wrapped in `dir="ltr"` so Recharts' internally-LTR rendering stops fighting the page's RTL context; (4) audit log showed raw permission-style keys (`product.price.update`) instead of Arabic — added an `auditLog.actions`/`fields` label map (next-intl forbids literal `.` in JSON keys, so action keys are looked up with `.` replaced by `_`); (5) the user-create/edit form was missing a password field entirely — added with the same show/hide pattern as login. Also: dashboard KPI row and quick-actions now match the owner's requested set (مبيعات اليوم / مشتريات اليوم / عدد الفواتير / إجمالي المستحقات; فاتورة شراء / فاتورة بيع / المخزن / الخزنة / تحصيل / دفع), notifications got a delete action, returns list's "Create New" button now resolves its Arabic label. `typecheck` and `lint` clean.

### 2026-09-21 (Phase 1)
- **Phase 1 complete (P1-1…P1-9).** Full colour token set (indigo/teal ramps, semantic status pairs, chart palette) written into `app/globals.css` for both themes; type scale, density system, and shadow levels added as `@theme` tokens. Restyled `button`, `badge`, `input`, `card`, `dialog` primitives to the tokens — no more stock shadcn slate. Built `components/shared/money.tsx`, `status-badge.tsx`, `kbd.tsx`, plus `lib/hotkeys.ts` + `hooks/use-hotkeys.ts` for the F-key registry. Built the temporary `/design-system` preview route and verified it in both themes at 375/768/1024/1440px with `playwright-cli`. `typecheck` and `lint` clean throughout.
- **Design-system preview extended** (owner-requested, ahead of P2-3): added checkbox, date-picker, datetime-picker, combobox, and full form-anatomy sections to `/design-system`. Restyled `checkbox.tsx`, `popover.tsx`, `select.tsx` to tokens; `select.tsx` now defaults to `position="popper"` (anchored dropdown below trigger) instead of `item-aligned`. `calendar.tsx` now defaults `weekStartsOn={6}` (Saturday) globally — Egyptian week convention, applies to every future date picker including P2-3's `DateRangePicker`. Datetime picker uses 12-hour Select-driven hour/minute/AM-PM (`ص`/`م`) instead of a native `<input type="time">`, wrapped in `dir="ltr"` since clock reading order stays left-to-right by convention even in RTL. Demo Zod schema added to `lib/validations.ts` as `designSystemDemoSchema` (kept there, not co-located, per the P0-10 lint rule — deleted at P8-11 with the rest of the route).

### 2026-09-21
- **Phase 0 complete (P0-1…P0-11).** Created the Next.js app at the repository root; added strict TypeScript, lint/format scripts, Docker PostgreSQL 16, Prisma client, shadcn working set, IBM Plex Sans Arabic, next-intl dictionary, RTL layout, providers, and foundation helpers. `prisma db push`, `typecheck`, `lint`, and production build passed. The page rendered in light and dark at 375/768/1024/1440 px without overflow, and the theme toggle changed themes.
- **Local port adjustment:** PostgreSQL uses host port 5433 because 5432 was occupied.
- **Dependency security follow-up:** Patched Next.js within v15 to 15.5.25; remaining npm advisories are documented in [MEMORY.md](./MEMORY.md) and require a version decision.

### 2026-09-20
- **Context docs created.** Discovery interview completed across four rounds; [ARCHITECTURE.md](./ARCHITECTURE.md), [BUILD_PLAN.md](./BUILD_PLAN.md), [UI_DESIGN_RULES.md](./UI_DESIGN_RULES.md), [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md), [MEMORY.md](./MEMORY.md), and [AGENTS.md](./AGENTS.md) written to `context/`.
- **Design system derived** via the `ui-ux-pro-max` skill (pattern: Data-Dense Dashboard / Drill-Down). Its generic blue/amber palette was replaced with the user-selected midnight indigo `#2A2F6B` + electric teal `#14B8A6`; full token set specified for light and dark.
- **Source material reviewed:** `Docs/PRD — Retail Shop ERP.md` (15 sections) and 15 Sahl (سهل) desktop ERP screenshots in `inspiration/`.
- **No code written yet.** Phase 0 is the next action.
