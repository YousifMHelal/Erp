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
| 4 | Auth, permissions & sales slice | TODO | Proves the end-to-end pattern |
| 5 | Purchases, inventory & returns | TODO | |
| 6 | Parties, cashboxes & money | TODO | |
| 7 | Reports, notifications & audit | TODO | |
| 8 | Polish, motion & edge cases | TODO | |
| 9 | Testing | TODO | Final pass |

**Overall: 48 / 96 tasks done.**

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
| P4-1 | Permission catalogue | TODO | |
| P4-2 | NextAuth credentials provider | TODO | |
| P4-3 | `requireAuth` / `requirePermission` | TODO | |
| P4-4 | Middleware protection | TODO | |
| P4-5 | Wire login + `loginMode` flag | TODO | |
| P4-6 | Audit + numbering libs | TODO | |
| P4-7 | Domain libs (units, costing, pricing, stock) | TODO | |
| P4-8 | Auth/product/sales Zod schemas | TODO | |
| P4-9 | `sales.actions.ts` | TODO | |
| P4-10 | Wire new-sale to real data | TODO | |
| P4-11 | Wire sales list | TODO | |
| P4-12 | Wire invoice detail + cancel | TODO | |
| P4-13 | A4 PDF route | TODO | Verify Arabic shaping |

## Phase 5 — Purchases, inventory & returns

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P5-1 | Inventory schemas + actions | TODO | |
| P5-2 | Wire inventory grid | TODO | |
| P5-3 | Wire product dialog | TODO | |
| P5-4 | Wire product detail | TODO | |
| P5-5 | `purchases.actions.ts` + avg cost | TODO | |
| P5-6 | Wire purchase screens | TODO | |
| P5-7 | `returns.actions.ts` | TODO | |
| P5-8 | Wire return screens | TODO | |
| P5-9 | Stocktake actions + wiring | TODO | |

## Phase 6 — Parties, cashboxes & money

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P6-1 | Customer/supplier schemas + actions | TODO | |
| P6-2 | Wire party lists | TODO | |
| P6-3 | Wire party detail + statement | TODO | |
| P6-4 | Cashbox actions + wiring | TODO | |
| P6-5 | Collections action | TODO | |
| P6-6 | Payments action | TODO | |
| P6-7 | Wire collection/payment screens | TODO | |
| P6-8 | Reconciliation check | TODO | |

## Phase 7 — Reports, notifications & audit

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P7-1 | Reports action foundation | TODO | |
| P7-2 | Sales/purchases/inventory reports | TODO | |
| P7-3 | Party + collection/payment reports | TODO | |
| P7-4 | Cashbox report | TODO | |
| P7-5 | **Profit & Loss** | TODO | Verify by hand against seed |
| P7-6 | Charts + CSV/PDF export | TODO | CSV needs UTF-8 BOM |
| P7-7 | Notifications | TODO | |
| P7-8 | Wire audit log | TODO | |
| P7-9 | Settings wiring + role matrix | TODO | |

## Phase 8 — Polish, motion & edge cases

| ID | Task | Status | Notes |
|----|------|--------|-------|
| P8-1 | Page + dialog transitions | TODO | |
| P8-2 | Skeletons everywhere | TODO | |
| P8-3 | Micro-interactions | TODO | |
| P8-4 | Empty + error states | TODO | |
| P8-5 | Edge cases | TODO | |
| P8-6 | Accessibility audit | TODO | |
| P8-7 | Performance pass | TODO | |
| P8-8 | Final responsive + theme sweep | TODO | |
| P8-9 | Hardcoded-string audit | TODO | Must be zero |
| P8-10 | Token + logical-property audit | TODO | Must be zero |
| P8-11 | Delete `/design-system` route | TODO | |

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
