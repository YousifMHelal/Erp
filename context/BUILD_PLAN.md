# BUILD PLAN — Teba (طيبة)

Phased, dependency-ordered. Every task has a stable ID. Tick the box here **and** update [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md) when a task changes state.

**Legend:** `[ ]` todo · `[~]` in progress · `[x]` done

**Reading order before starting any task:** [AGENTS.md](./AGENTS.md) → [ARCHITECTURE.md](./ARCHITECTURE.md) → [MEMORY.md](./MEMORY.md) → this file → [UI_DESIGN_RULES.md](./UI_DESIGN_RULES.md) → [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md).

**Build philosophy:** design system first, then UI with static props, then schema, then wire real data feature by feature. Phase 4 deliberately builds *one* complete vertical slice (sales) before the rest, so the pattern is proven and copied rather than invented eleven times.

---

## Phase 0 — Scaffold & foundations

Goal: an empty but fully-configured app that boots in Arabic RTL, in both themes, with a live database connection.

- [x] **P0-1** — `create-next-app` (TypeScript, App Router, Tailwind v4, **no `src/`**, no default example content). Confirm `app/` is at the project root.
- [x] **P0-2** — `tsconfig.json`: `strict: true`, `noUncheckedIndexedAccess: true`, `@/*` path alias.
- [x] **P0-3** — ESLint (`next/core-web-vitals`) + Prettier + `prettier-plugin-tailwindcss`. Add `lint`, `format`, `typecheck` scripts.
- [x] **P0-4** — `docker-compose.yml` with PostgreSQL 16, named volume. Add `db:up` / `db:down` scripts. Write `.env.example` (`DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`).
- [x] **P0-5** — Install Prisma, create `prisma/schema.prisma` with datasource + generator only, `lib/prisma.ts` singleton. Verify `prisma db push` connects.
- [x] **P0-6** — `npx shadcn@latest init`. Install the working set: button, input, label, form, select, dialog, sheet, dropdown-menu, popover, command, table, tabs, badge, card, skeleton, sonner, tooltip, separator, checkbox, switch, calendar, alert-dialog, scroll-area, avatar, textarea, radio-group.
- [x] **P0-7** — Self-host **IBM Plex Sans Arabic** (400/500/600/700) in `public/fonts/`, wire via `next/font/local`, expose as `--font-sans`.
- [x] **P0-8** — Set up `next-intl`: `i18n/request.ts`, locale `ar`, `messages/ar.json` (seed with common keys), `IntlProvider`. Confirm a string renders from the dictionary.
- [x] **P0-9** — `app/layout.tsx`: `<html lang="ar" dir="rtl">`, font class, `ThemeProvider` (next-themes, class strategy, system default), `SessionProvider`, `IntlProvider`, `<Toaster />`.
- [x] **P0-10** — Create `types/index.d.ts` and `lib/validations.ts` as the two single-source files. Add a lint rule or a documented review check that forbids `z.object(` outside `lib/validations.ts`.
- [x] **P0-11** — `lib/utils.ts` (`cn`), `lib/action-result.ts` (`ActionResult<T>`, `ok()`, `fail()`), `lib/format.ts` (money, number, date — `ar-EG`, Western digits, `dd/MM/yyyy`).

**Exit:** `npm run dev` serves a page in Arabic RTL with the correct font, the theme toggle flips light↔dark, `npm run typecheck` and `npm run lint` pass clean, and Prisma connects to the Dockerised Postgres.

---

## Phase 1 — Design system

Goal: the visual language exists as code. Every later phase consumes these tokens and never redefines them.

- [x] **P1-1** — Write the full token set into `app/globals.css` under Tailwind v4 `@theme`: every colour from [UI_DESIGN_RULES.md §2](./UI_DESIGN_RULES.md) for `:root` and `.dark`, plus radius, shadow, and font tokens.
- [x] **P1-2** — Semantic status tokens (`--success-fg/-bg`, warning, danger, info, neutral) in both themes; the chart palette as `--chart-1…6`.
- [x] **P1-3** — Type scale utilities (`display`, `h1`–`h3`, `body`, `body-sm`, `label`, `caption`) and a `tabular-nums` utility.
- [x] **P1-4** — Density system: `data-density="compact"` / `"comfortable"` attribute driving row height, padding, control height, and body size.
- [x] **P1-5** — Restyle the shadcn primitives to the tokens — button variants (`primary`, `accent`, `secondary`, `outline`, `ghost`, `destructive`), input, card, dialog, badge. Strip every trace of stock slate.
- [x] **P1-6** — `components/shared/money.tsx` — the only money renderer. Handles `Decimal`, sign, colour, currency suffix, tabular numerals.
- [x] **P1-7** — `components/shared/status-badge.tsx` — driven by the fixed domain→token map in [UI_DESIGN_RULES.md §2.5](./UI_DESIGN_RULES.md). Icon + text, never colour alone.
- [x] **P1-8** — `components/shared/kbd.tsx` and `hooks/use-hotkeys.ts` — F-key registry, scoped, suppressed inside text inputs.
- [x] **P1-9** — Build a temporary `/design-system` preview route rendering every token, type step, button state, badge, density mode, and shadow level. **Review it in both themes at 375 / 768 / 1024 / 1440 px.** Delete the route in Phase 9.

**Exit:** the preview page proves the full visual language in both themes at all four widths, and no component contains a hardcoded colour.

---

## Phase 2 — App shell & static UI

Goal: every screen exists and looks finished, driven by static props. No database yet. This is where design problems get found cheaply.

> **Every task in this phase invokes `ui-ux-pro-max` and `frontend-design` before building.** Every screen is checked in both themes at all four widths.

- [x] **P2-1** — `AppShell`: sidebar (dark both themes, grouped nav, rail↔expanded, off-canvas Sheet <1024 px), topbar (title, breadcrumb, `Ctrl+K` search, notification bell, theme toggle, user menu), skip-to-content link.
- [x] **P2-2** — `components/shared/data-table/` — the generic TanStack table: toolbar, sticky header, sortable columns, sticky totals footer, pagination, row selection, density toggle, empty state, skeleton rows, **and the stacked-card layout below 768 px**. Every later grid uses this; it is built once.
- [x] **P2-3** — Shared parts: `PageHeader`, `EmptyState`, `ConfirmDialog`, `DateRangePicker` (ar-EG, `dd/MM/yyyy`), `EntityCombobox`, `StatCard`, skeleton set.
- [x] **P2-4** — Login `/login`: user tile grid (monogram + name) → password step with **show/hide eye toggle**, brand panel, error slot. Responsive, both themes.
- [x] **P2-5** — Dashboard `/`: KPI row (4 stat cards), sales trend line chart, quick-action tiles, low-stock panel, top-debtors panel, recent invoices table.
- [x] **P2-6** — New sale `/sales/new`: three-zone desktop layout (product search · lines table · totals/payment aside), per-line **unit dropdown**, invoice-level discount, cashbox select, paid/remaining, F-key hint bar, save→print dialog. **Single column with a sticky bottom pay bar on mobile.** The highest-value screen in the app — get it right here.
- [x] **P2-7** — Sales list `/sales` + filters (search, date range, customer, cashbox, payment status, user).
- [x] **P2-8** — Invoice detail `/sales/[id]`: header card, party card, lines table, totals card, actions bar, print-size dialog (A4/A5/80mm), cancel dialog.
- [x] **P2-9** — Purchases `/purchases/*` — mirror of P2-6/7/8, supplier-bound.
- [x] **P2-10** — Returns `/sales-returns/*`, `/purchase-returns/*`: original-invoice picker + return lines.
- [x] **P2-11** — Inventory `/inventory`: grid with all PRD §5 columns, filters, value summary strip, tabbed product dialog (عام / وحدات / أسعار) with a live unit-conversion preview.
- [x] **P2-12** — Product detail `/inventory/[id]`: summary card, stock movement history, price history.
- [x] **P2-13** — Stocktake `/inventory/stocktake/*`: counting sheet, system vs counted vs difference, diff summary.
- [x] **P2-14** — Customers `/customers` + `/customers/[id]` (tabs: invoices · payments · statement), balance badges, statement print dialog.
- [x] **P2-15** — Suppliers `/suppliers/*` — mirror of P2-14.
- [x] **P2-16** — Cashboxes `/cashboxes`: aggregate summary strip, per-box filter, movements table.
- [x] **P2-17** — Collections `/collections/*` and payments `/payments/*`: form with party balance preview + list.
- [x] **P2-18** — Reports `/reports` hub + `/reports/[report]` shell with filters, table, and chart slots. All 9 report types laid out.
- [x] **P2-19** — Notifications, audit log (with before/after diff dialog).
- [x] **P2-20** — Settings: shop profile, print prefs, users, **roles permission matrix**, categories, cashboxes.
- [x] **P2-21** — Print templates: A4, A5, 80 mm + print stylesheet. Verify in a real browser print preview at all three sizes.
- [x] **P2-22** — Responsive + theme audit pass across **every** screen at 375 / 768 / 1024 / 1440 px. Fix what breaks. No screen exits this phase failing an audit.

**Exit:** every route in [ARCHITECTURE.md §3](./ARCHITECTURE.md) renders a finished-looking screen from static props, passes the four-width/two-theme audit, and contains no hardcoded strings or colours.

---

## Phase 3 — Database schema

Goal: a schema that serves the UI actually built, with a seed that fills every screen.

- [x] **P3-1** — Write `prisma/schema.prisma` in full: every entity, enum, relation, and index from [ARCHITECTURE.md §4](./ARCHITECTURE.md). `Decimal` for all money and quantity. `cuid` IDs.
- [x] **P3-2** — Indexes and constraints: `@@unique([type, number])` on Invoice, unique `sku`/`barcode`, `dedupeKey` on Notification, indexes on every FK, on `createdAt` for ledgers, and on `[entityType, entityId]` for AuditLog.
- [x] **P3-3** — **Get the schema reviewed and approved before migrating.** Present entities, relations, and the sub-unit storage decision explicitly.
- [x] **P3-4** — Run the initial migration. Verify in Prisma Studio.
- [x] **P3-5** — `prisma/seed.ts`: shop settings, 3 roles (مدير / محاسب / كاشير) with real permission sets, 4 users, 3 cashboxes (نقدي / فودافون كاش / إنستاباي), ~8 categories, ~60 products with varied units and stock states (healthy / low / out), 20 customers, 10 suppliers with opening balances, ~80 invoices across all four types spread over 90 days, matching stock/cash/party ledger rows, collections and payments, one confirmed stocktake, audit entries, notifications. **Seeded data must be internally consistent** — every balance must equal the sum of its ledger.
- [x] **P3-6** — `db:reset` script (drop → migrate → seed). Confirm it runs clean from scratch.

**Exit:** schema approved and migrated; `npm run db:reset` produces a realistic dataset where every balance reconciles against its ledger.

---

## Phase 4 — Auth, permissions & the first vertical slice

Goal: prove the full end-to-end pattern — auth → permission → validated action → transaction → audit → revalidate → toast — on sales, before repeating it.

- [x] **P4-1** — `lib/permissions.ts`: the permission catalogue, grouped, with Arabic labels for the matrix UI.
- [x] **P4-2** — NextAuth v5 credentials provider, `bcryptjs`, JWT session carrying `userId`/`displayName`/`roleId`/`permissions[]`. `lib/auth.ts`.
- [x] **P4-3** — `lib/auth-guard.ts`: `requireAuth()`, `requirePermission(key)`, `getCurrentUser()`. **Every mutating action calls one of these first.**
- [x] **P4-4** — `middleware.ts` route protection + redirect to `/login`.
- [x] **P4-5** — Wire the login screen: server action lists active users for the tile grid, credential sign-in, error handling, redirect. Add the `settings.loginMode` flag (`tiles` | `username`) so the roster can be hidden before public deployment.
- [x] **P4-6** — `lib/audit.ts` (`writeAudit` with before/after diff), `lib/numbering.ts` (counter inside the transaction).
- [x] **P4-7** — Domain libraries with unit-testable pure functions: `lib/money.ts`, `lib/units.ts` (base⇄sub), `lib/costing.ts` (weighted moving average), `lib/pricing.ts` (3-tier suggestion), `lib/stock.ts` (availability + movement application).
- [x] **P4-8** — Zod schemas for auth, product, and sales in `lib/validations.ts` — full production-grade rules per [ARCHITECTURE.md §8.5](./ARCHITECTURE.md) and the user's validation spec (min/max on every field, phone regex for Egypt, password complexity + confirm `.refine()`, `.trim()` on strings, `.int()`/`.positive()` on numbers, `z.enum()` for enums, date `.refine()`s, cross-field rules).
- [x] **P4-9** — `actions/sales.actions.ts`: `createSale`, `getSales`, `getSaleById`, `updateSale`, `cancelSale` — each permission-checked, schema-re-validated, wrapped in `$transaction`, writing stock + cash + party ledger rows, audit, and `revalidatePath`.
- [x] **P4-10** — Wire `/sales/new` to real data: server-side product search (name / SKU / **barcode exact match → instant line add**), customer combobox, live price suggestion, **hard negative-stock block**, save → toast → print prompt.
- [x] **P4-11** — Wire `/sales` list: server-side filtering, sorting, pagination from URL search params.
- [x] **P4-12** — Wire `/sales/[id]`: real detail, permission-gated actions, cancel with reason + compensating entries, print, `wa.me` share.
- [x] **P4-13** — PDF route `/api/invoices/[id]/pdf` (A4, `@react-pdf/renderer`, Arabic font embedded — verify Arabic shaping renders correctly, this is a common failure point).

**Exit:** a user logs in via tile+password, creates a real credit sale that correctly moves stock, cashbox, and customer balance in one transaction, sees it in the list, opens the detail, prints it at all three sizes, downloads the A4 PDF, and cancels it — with every step permission-checked and audit-logged.

---

## Phase 5 — Purchases, inventory & returns

Goal: the rest of the inventory-affecting flows, copying the Phase 4 pattern.

- [x] **P5-1** — Product/inventory Zod schemas + `actions/inventory.actions.ts` (CRUD, price update with audit, category management).
- [x] **P5-2** — Wire `/inventory`: real grid, server-side filters, computed columns (avg cost, both stock values, status), value summary.
- [x] **P5-3** — Wire the product dialog: create/edit, unit conversion preview, barcode uniqueness, price derivation.
- [x] **P5-4** — Wire `/inventory/[id]`: movement history and price history from `StockMovement` + `AuditLog`.
- [x] **P5-5** — `actions/purchases.actions.ts`: confirm → stock up, **weighted-average cost recompute**, cashbox down, supplier balance up. Plus edit and cancel.
- [x] **P5-6** — Wire `/purchases/new`, `/purchases`, `/purchases/[id]`.
- [x] **P5-7** — `actions/returns.actions.ts`: sale return (stock up, refund from cashbox or reduce customer balance) and purchase return (stock down, cash back or reduce supplier balance). Validate return quantities against the original invoice.
- [x] **P5-8** — Wire both return screens.
- [x] **P5-9** — `actions/stocktake.actions.ts` + wire the stocktake sheet: draft → confirm writes `STOCKTAKE` movements for every difference and adjusts stock.

**Exit:** buying, selling, returning, and stocktaking all move stock and money correctly; average cost recomputes on purchase; every movement is traceable to a document.

---

## Phase 6 — Parties, cashboxes & money movement

- [x] **P6-1** — Customer/supplier Zod schemas + `actions/customers.actions.ts`, `actions/suppliers.actions.ts` (CRUD, opening balance).
- [x] **P6-2** — Wire `/customers` and `/suppliers` lists with balance columns and filters.
- [x] **P6-3** — Wire `/customers/[id]` and `/suppliers/[id]`: invoices tab, payments tab, **running-balance account statement** from `PartyTransaction`, total purchases, statement print + `wa.me` share.
- [x] **P6-4** — `actions/cashboxes.actions.ts` + wire `/cashboxes`: aggregate balance by default, per-box on filter, movements with running balance.
- [x] **P6-5** — `actions/collections.actions.ts` (قبض): cashbox ↑, customer balance ↓, party transaction, audit — one transaction.
- [x] **P6-6** — `actions/payments.actions.ts` (صرف): cashbox ↓, supplier balance ↓, party transaction, audit.
- [x] **P6-7** — Wire both forms with live party-balance preview, and both list screens.
- [x] **P6-8** — **Reconciliation check:** write a script or test asserting that for every party and every cashbox, the stored balance equals `opening + Σ(ledger)`. Run it against the seeded data.

**Exit:** money moves only through documented, party-linked transactions; every balance reconciles against its ledger; statements are printable and shareable.

---

## Phase 7 — Reports, notifications & audit

- [x] **P7-1** — `actions/reports.actions.ts`: shared date-range + filter handling, aggregate queries.
- [x] **P7-2** — Sales, purchases, and inventory reports (with valuation).
- [x] **P7-3** — Customer, supplier, collection, and payment reports.
- [x] **P7-4** — Cashbox report.
- [x] **P7-5** — **Profit & Loss**: revenue − COGS (from `costPerSubAtSale`, not current average) − discounts + returns handling. Show gross margin and per-period breakdown. This is the report most likely to be subtly wrong — verify against hand-calculated seed data.
- [x] **P7-6** — Report charts (Recharts, RTL axis config) + CSV export (UTF-8 **with BOM**) + A4 PDF where a document makes sense.
- [x] **P7-7** — `lib/notifications.ts`: generation on stock and balance changes, `dedupeKey`, severity. Wire the bell and `/notifications`.
- [x] **P7-8** — Wire `/audit-log`: filters by user, action, entity, date; before/after diff dialog.
- [x] **P7-9** — Settings wiring: shop profile, print prefs, categories, cashboxes, users CRUD, **roles permission matrix**.

**Exit:** all 9 reports return correct figures against the seeded data (P&L verified by hand), notifications fire without duplicating, the audit log shows a complete before/after history, and an admin can create a custom role that actually gates the UI and the actions.

---

## Phase 8 — Polish, motion & edge cases

- [x] **P8-1** — Page transitions (200 ms fade + 4 px rise), dialog/sheet motion, respect `prefers-reduced-motion`.
- [x] **P8-2** — Replace every remaining spinner with a layout-matched skeleton; add `loading.tsx` to every route.
- [x] **P8-3** — Micro-interactions: row hover, button press, KPI count-up, toast slide, sticky-header shadow on scroll.
- [x] **P8-4** — Every empty state: icon, message, and a useful action. Every error state: `error.tsx` per group, `not-found.tsx` for missing entities.
- [x] **P8-5** — Edge cases: zero-stock sale attempt, discount exceeding subtotal, paid exceeding total, cancelling an already-cancelled document, deleting a category in use, a product with `unitsPerBase = 1`, a customer with zero balance, an empty invoice, concurrent edits to the same invoice.
- [x] **P8-6** — Accessibility audit: contrast, focus order, `aria-label`s, landmarks, keyboard-only walkthrough of the complete sale flow, screen-reader pass on the sales screen.
- [x] **P8-7** — Performance: check bundle size, confirm Server Components are used where possible, add `Suspense` boundaries, verify no N+1 queries on list pages, add DB indexes where the query plan asks for them.
- [x] **P8-8** — **Final responsive + theme sweep** across every screen at 375 / 768 / 1024 / 1440 px in both themes.
- [x] **P8-9** — String audit: grep the codebase for hardcoded Arabic and Latin user-facing text; everything must resolve from `messages/ar.json`.
- [x] **P8-10** — Token audit: grep for hex values, `bg-<tailwindcolor>-<n>`, and physical properties (`ml-`, `pr-`, `left-`, `text-right`) in `components/` and `app/`. Zero results required.
- [x] **P8-11** — Delete the `/design-system` preview route.

**Exit:** every screen is polished in both themes at all widths, passes the a11y and token audits, and handles its edge cases gracefully.

---

## Phase 9 — Testing

Built last, as a dedicated pass, focused on logic that can silently corrupt money or stock.

- [ ] **P9-1** — Vitest setup + test database strategy (separate schema, reset between runs).
- [ ] **P9-2** — Unit tests for the pure domain libs: `units.ts` (conversion in both directions, fractional ratios), `costing.ts` (weighted average across a purchase sequence), `pricing.ts` (all three tiers plus the fallthrough), `money.ts` (rounding, Decimal precision), `format.ts`.
- [ ] **P9-3** — Validation tests: every Zod schema, valid and invalid cases, cross-field `.refine()`s, Egyptian phone regex, password complexity.
- [ ] **P9-4** — Auth & permission tests: credential verification, session shape, `requirePermission` allowing and denying, middleware redirects.
- [ ] **P9-5** — Integration tests on the critical transactions: create sale (stock + cash + party all move, atomically), negative-stock rejection, purchase average-cost recompute, cancellation reversal leaving balances unchanged, return flows, collection and payment.
- [ ] **P9-6** — **Ledger reconciliation test:** after a randomised sequence of operations, assert every party balance and every cashbox balance still equals `opening + Σ(ledger)`.
- [ ] **P9-7** — Playwright E2E: login → create a credit sale → verify inventory decreased → collect a payment → verify customer balance → open the report → cancel the invoice → verify everything reversed.
- [ ] **P9-8** — Component tests for the highest-risk UI: `LineItemsTable` unit/price recalculation, `TotalsPanel` discount maths, `PermissionMatrix`.

**Exit:** `npm test` passes; critical money and stock paths are covered; the reconciliation test holds under a randomised operation sequence.

---

## Build order summary

**P0** scaffold → **P1** design system → **P2** all UI static → **P3** schema + seed → **P4** auth + sales slice end-to-end → **P5** purchases/inventory/returns → **P6** parties/cashboxes/money → **P7** reports/notifications/audit → **P8** polish → **P9** tests.
