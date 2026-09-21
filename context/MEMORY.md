# MEMORY — Teba (طيبة)

> **Append-only decision log.** Newest on top. Never rewrite history — if a decision is reversed, add a new entry that supersedes the old one and note which entry it replaces. The **Rationale** column is the point of this file: future contributors need to know *why*, not just *what*.

---

## Project identity

| | |
|---|---|
| **Name** | Teba (طيبة) |
| **What** | Production-grade retail shop ERP — sales, purchases, inventory, customers, suppliers, cashboxes, collections/payments, reports, users/permissions, audit log, notifications |
| **For** | A single Egyptian retail shop; staff are cashiers, accountants, and a manager |
| **Language** | Arabic only, RTL |
| **Source spec** | [`Docs/PRD — Retail Shop ERP.md`](../Docs/PRD%20—%20Retail%20Shop%20ERP.md) — 15 sections, the authority on domain behaviour |
| **Behavioural reference** | Sahl (سهل) desktop ERP — 15 screenshots in [`inspiration/`](../inspiration/). Copied: speed, keyboard-first operation, grid density, tabbed multi-document workspace. **Not** copied: the green/yellow visual language or the Windows-Forms aesthetic. |
| **Repo state at planning time** | Empty — only `Docs/` and `inspiration/`. Greenfield, not a git repo yet. |
| **Planning date** | 2026-09-20 |

---

## Locked decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-09-20 | **Arabic only (RTL). No English locale in v1.** | Users are Egyptian shop staff. Building a second locale is pure cost with no reader. |
| 2026-09-20 | **All strings still go through `next-intl` and `messages/ar.json`, despite the single locale.** | Retrofitting i18n into 22 screens later is a multi-day refactor; a dictionary from day one makes adding English a content task. Also enforces the "no hardcoded strings" rule mechanically. |
| 2026-09-20 | **Layout built direction-agnostic (logical CSS properties only) even though only RTL ships.** | Same reasoning — costs nothing now, saves a full restyle later. Also prevents the mixed physical/logical mess that makes RTL bugs hard to trace. |
| 2026-09-20 | **Deploy: local development now, Vercel later.** | Shop-floor use wants a LAN machine; the user explicitly plans cloud later. So: Dockerised Postgres locally, no filesystem or long-running-process dependencies that would block a serverless move. |
| 2026-09-20 | **Entire PRD in v1 — nothing deferred.** Including returns, stocktaking, full reports, P&L, RBAC, audit log, notifications. | User's explicit answer: "all the prd". Scope is therefore fixed and large; the build plan phases it rather than trimming it. |
| 2026-09-20 | **Auth: user tile grid → select user → password.** | User's explicit requirement. Cashiers don't type usernames; tapping a face-tile is materially faster at a counter. |
| 2026-09-20 | **Accepted risk: the login tile grid publishes the staff roster.** Mitigation: a `settings.loginMode = 'tiles' \| 'username'` flag, built in Phase 4. | Harmless on a shop LAN. Once on Vercel it's a public list of valid usernames, which halves the work of a credential-stuffing attempt. The flag lets the shop switch modes without a code change. Flagged to the user; they chose tiles. |
| 2026-09-20 | **Fully custom roles built from a permission matrix.** No fixed Admin/Manager/Cashier enum. | User's explicit choice. Seed ships three sensible roles (مدير / محاسب / كاشير) as starting points, all editable. |
| 2026-09-20 | **Per-user permission overrides are NOT in v1.** Permissions come from the role only. | Custom roles already give full flexibility; per-user overrides double the permission-resolution complexity and the UI for a shop with <10 staff. Revisit if asked. |
| 2026-09-20 | **Inventory costing: weighted moving average.** `avgCost = (oldQty×oldAvg + newQty×newCost) ÷ totalQty`, recomputed on every confirmed purchase. | Matches the PRD's "متوسط سعر الشراء" column and Sahl's behaviour. FIFO would need a cost-layer table and per-sale layer consumption — significant complexity for a retail shop that doesn't need lot-level accuracy. |
| 2026-09-20 | **`costPerSubAtSale` is frozen onto every sale line.** | Without it, P&L recomputes historical profit using today's average cost — every past month's profit silently changes after each purchase. This one field is what makes the P&L report trustworthy. |
| 2026-09-20 | **Negative stock is hard-blocked.** The Server Action rejects a sale whose quantity exceeds availability. | Keeps inventory honest, which every downstream report depends on. A permission-gated override was offered and declined. |
| 2026-09-20 | **All quantities stored in the product's sub-unit.** Conversion happens at the action boundary only. | PRD §15 requires "a consistent internal unit". Mixed-unit storage makes every aggregate query wrong in a way that is very hard to spot. |
| 2026-09-20 | **Per-line unit dropdown on sale and purchase lines** (كرتونة / علبة), price auto-converting by the product's ratio. | PRD §5's worked example — buy 5 cartons, sell 3 packs — is impossible without it. |
| 2026-09-20 | **Barcode field on Product + scan-to-add on the sale search box.** | Not in the PRD's product form, but retail shops acquire a scanner sooner or later, and the search input already exists — an exact barcode match simply adds the line. Near-zero marginal cost. |
| 2026-09-20 | **Money: EGP (ج.م), Prisma `Decimal`, 2 decimals, never `Float`.** | Binary floating point cannot represent currency exactly. This is a correctness requirement, not a style preference. |
| 2026-09-20 | **Western digits (34,890), not Arabic-Indic (٣٤٬٨٩٠).** | The user left the Arabic-Indic option unchecked. It also matches what Egyptian business software, keyboards, and thermal receipts actually use, and is faster to scan in a dense grid. |
| 2026-09-20 | **Gregorian calendar, `dd/MM/yyyy`.** | Matches Sahl (`20/09/2026`) and Egyptian commercial practice. No Hijri requirement stated. |
| 2026-09-20 | **No hard deletes on financial or inventory records.** Cancel/reverse with a reason, writing compensating ledger rows. | PRD §15 requires it. Treated as non-negotiable regardless of the answer given, because an ERP that can silently delete money history is not auditable. |
| 2026-09-20 | **Three append-only ledgers: `StockMovement`, `CashMovement`, `PartyTransaction`.** Balances on `Product`, `Cashbox`, `Customer`, `Supplier` are maintained transactionally as fast-read caches. | PRD §15: "every financial and inventory movement must be traceable". Ledgers give the audit trail and the account statement; cached balances keep list pages fast. Phase 6 and Phase 9 both assert `balance == opening + Σ(ledger)`. |
| 2026-09-20 | **Print: user chooses A4 / A5 / 80 mm at print time. PDF export is always A4.** | User's explicit requirement. Three print components share a data layer; only the layout differs. |
| 2026-09-20 | **WhatsApp sharing = `wa.me` deep link only.** No Business API. | Free, needs no account approval or per-message cost, works today. The API can be added later without changing the invoice model. |
| 2026-09-20 | **Palette: midnight indigo `#2A2F6B` + electric teal `#14B8A6`**, light and dark. | User's choice from four presented directions. Deliberately breaks from Sahl's green so Teba reads as its own product rather than a clone. Full token set in [UI_DESIGN_RULES.md §2](./UI_DESIGN_RULES.md). |
| 2026-09-20 | **Dark mode lightens the primary to indigo-400 `#5F6ABB`.** | `#2A2F6B` on a `#0B0E1C` canvas fails WCAG AA. The brand anchor has to shift in dark mode; the accent teal holds in both. |
| 2026-09-20 | **Two densities by context.** Compact + keyboard-first on transactional screens; comfortable/editorial elsewhere. Everything is comfortable below 768 px. | Resolves the real conflict between the brief's "generous whitespace" and a POS's need to show many lines at once. A cashier and a manager are doing different jobs on the same app. |
| 2026-09-20 | **Sahl's F-keys mirrored:** F9 save, F10 new, F12 save+new, F4 print, F8 delete line, F2 product search. | Staff migrating from Sahl keep their muscle memory. Cheap to implement, disproportionate adoption benefit. |
| 2026-09-20 | **Typeface: IBM Plex Sans Arabic, self-hosted.** | Genuine Arabic support with matching Latin metrics (so `فاتورة #000123` doesn't jump), real tabular numerals for money columns, open licence. The `ui-ux-pro-max` suggestion (Fira Code/Fira Sans) has no Arabic coverage. |
| 2026-09-20 | **Dashboard: KPIs + quick-action tiles.** Not in the PRD. | Every ERP needs a landing screen; Sahl's tile launcher is the interaction staff already know, and the KPI row answers "how did today go" without opening a report. |
| 2026-09-20 | **Server Actions for everything. Exactly two route handlers: NextAuth and the invoice PDF stream.** | Per the brief. The PDF needs to stream a binary response, which an action can't do. |
| 2026-09-20 | **Zustand limited to two stores** — `ui.store` (sidebar, density) and `invoice-draft.store` (unsaved sale lines). | Zustand is in the stack, but server data belongs on the server. Using it as a cache would reintroduce the stale-data problems Server Components exist to remove. |
| 2026-09-20 | **Single `Invoice` table with a `type` enum** covering sale, purchase, sale return, purchase return. | The four share ~90 % of their columns and all of their list/detail UI. Four near-identical tables would mean four sets of queries, components, and reports. |
| 2026-09-20 | **Separate `Customer` and `Supplier` tables** rather than one polymorphic `Party`. | Sahl unifies them under "الحسابات" with a type flag, but they diverge in reporting and in balance meaning (owed *to* us vs owed *by* us). Separate tables keep the queries and the type system honest. |
| 2026-09-20 | **Out of scope for v1:** multi-tenancy, multi-warehouse, multi-currency, full double-entry GL, sales-rep commissions, instalments, cheques, product images, expiry/serial tracking, email, offline/PWA, native mobile. | Not in the PRD. Sahl has several of them, which is exactly why they need naming — otherwise they creep in from the screenshots. |
| 2026-09-20 | **Added to the stack beyond the brief:** next-intl, TanStack Table, Recharts, @react-pdf/renderer, bcryptjs, date-fns, next-themes, Docker Compose. | Each justified in [ARCHITECTURE.md §2](./ARCHITECTURE.md). Called out rather than adopted silently. |
| 2026-09-20 | **Deliberately not added:** file storage, email provider, payment gateway, Redis. | Nothing in v1 needs them. Named here so a later contributor doesn't assume they were forgotten. |
| 2026-09-21 | **Every tooltip in the app goes through `components/shared/app-tooltip.tsx`** (`<AppTooltip>`, wraps the shadcn `Tooltip` primitive). Never a raw `title` attribute or an ad-hoc `Tooltip`/`TooltipContent` pairing inline. | User's explicit standing rule, given while building P2-2. Keeps every tooltip's timing, styling, and RTL `side` behaviour consistent app-wide instead of drifting per component. |
| 2026-09-21 | **Sales and purchases share one invoice UI layer** in `components/shared/invoice/` (`InvoiceForm`, `InvoiceList`, `InvoiceDetailView`, and their sub-parts), parameterized by a `documentType: "SALE" \| "PURCHASE"` prop rather than duplicated into separate `components/sales/` and `components/purchases/` folders. | User's explicit choice when P2-9 (purchases) came up as a near-exact mirror of P2-6/7/8. The two flows differ only in wording ("العميل" vs "المورد") and which party/price list they bind to — genuinely identical layout, state machine, and validation shape. One shared layer means a bug fix or design change lands once. `SearchableProduct.pricePerBase/pricePerSub` were renamed from `sellPricePerBase/sellPricePerSub` to stay document-agnostic. If purchase-specific UI logic (e.g. avg-cost recompute feedback) is needed later, branch on `documentType` inside the shared component rather than forking the folder. |

---

## Open questions / to revisit

| # | Question | Why it matters | When to decide |
|---|----------|----------------|----------------|
| 1 | Does the shop need **multi-warehouse** (Sahl's مخزن switching)? | Retrofitting a location dimension onto `StockMovement` and every stock query is invasive. Cheap now, expensive later. | Before P3-3 (schema approval) |
| 2 | Should the **cashbox-to-cashbox transfer** exist (Sahl has تحويل من خزينة لأخرى)? | PRD §8 says no cash movement without a party, which forbids it. But moving cash from the drawer to InstaPay is a real daily operation. | Before P6-4 |
| 3 | Is a **customer credit limit** (Sahl's أعلى دين مسموح) wanted? | Would add a field plus a block or warning in the sale action. | Before P6-1 |
| 4 | **Tax / VAT** — the PRD never mentions it, Sahl has a tax-number field. Does the shop invoice with VAT? | Adding tax after invoices exist means recomputing historical totals. Genuinely hard to retrofit. | Before P3-3 |
| 5 | Who **hosts Postgres** when this moves to Vercel — Neon, Supabase, or something else? | Affects connection pooling and whether Prisma needs an adapter. | Before deployment |
| 6 | Should **per-user permission overrides** be added on top of roles? | Deferred from v1. | After Phase 7 |
| 7 | Should cancelled invoices be **visible to all users** or only to those with an audit permission? | Affects default list filters. | Before P4-11 |
| 8 | Does the shop want a **daily closing / shift report** (Sahl's الحركة اليومية)? | A natural fit for the reports hub; not in the PRD. | Before P7-4 |

---

## Technical discoveries

*Populate as the build hits surprises — Prisma Decimal quirks, Arabic font shaping in PDFs, RTL chart behaviour, Next.js caching gotchas. Each entry: what broke, why, and the fix.*

- **2026-09-21 — Local Postgres host port:** Docker could not bind host port 5432 because another process had it. Compose maps host 5433 to container 5432, and `.env.example` uses 5433. The database still runs PostgreSQL 16 on its normal container port.

**Already anticipated, watch for these:**
- **Arabic text in `@react-pdf/renderer`** frequently renders unshaped or reversed unless the font is registered correctly and the text direction is set explicitly. Budget time at P4-13.
- **Recharts is LTR-only internally.** X axis needs `reversed`, Y axis needs `orientation="right"`. Expect to wrap it once rather than fix it per chart.
- **Prisma `Decimal` is `Decimal.js`, not a JS number.** Arithmetic must use its methods; `JSON.stringify` and Server Component→Client Component serialisation both need explicit conversion.
- **CSV opened in Excel mangles Arabic** without a UTF-8 BOM prefix.
- **2026-09-21 — shadcn CLI registry:** The current CLI initialized `radix-nova` with RTL support but did not generate `components/ui/form.tsx` from the requested `form` entry. Added the standard React Hook Form wrapper locally; future shadcn updates should preserve it.
- **2026-09-21 — Session provider before auth:** With no NextAuth route until Phase 4, an uninitialized `SessionProvider` fetched `/api/auth/session` and received 404s. P0 passes `session={null}` and disables focus refetch. P4-2 must replace this with the real server session when credentials auth is wired.
- **2026-09-21 — Dependency audit:** The scaffold's Next.js 15.5.12 had a critical npm advisory, so it was patched within the locked major to 15.5.25. `npm audit` still reports advisories through Prisma 6's `deepmerge-ts` and Next 15's bundled `postcss`. A nested PostCSS override produced an invalid dependency tree, so it was removed. Revisit these when the locked framework/ORM versions are reviewed; do not force a major upgrade as a silent scaffold change.
- **2026-09-21 — Tailwind v4 `@theme inline` vars are not runtime-readable.** `--color-primary` etc. (declared under `@theme inline` in `globals.css`) only exist as inputs to Tailwind's utility-class generation at build time — `getComputedStyle(el).getPropertyValue('--color-primary')` returns `""` in the browser. Any inline `style={{ background: 'var(--color-x)' }}` silently renders transparent. Components must reference tokens only via utility classes (`bg-primary`), never via raw `var(--color-*)` in inline styles; the underlying `--primary` etc. custom properties on `:root`/`.dark` **are** real and readable if a raw CSS var is ever genuinely needed. Caught in the `/design-system` colour swatches, which used the wrong var name.
- **2026-09-21 — Locked: week starts Saturday.** `components/ui/calendar.tsx` defaults `weekStartsOn={6}` for every `Calendar` instance app-wide (Egyptian convention), not just the design-system demo. Applies automatically to P2-3's `DateRangePicker` and any other future date picker built on this primitive.
- **2026-09-21 — Locked: time pickers are 12-hour with AM/PM, LTR internally.** Hour⟶minute⟶ص/م order stays left-to-right even on an RTL page (clock-reading convention), via a `dir="ltr"` wrapper around just that control — not a violation of the logical-properties rule, which governs CSS layout properties, not a numeric widget's fixed reading order. No native `<input type="time">` — it isn't styleable to the token system and doesn't respect Western-digit/AM-PM formatting consistently across browsers; use `Select`-driven hour/minute/period instead. No standalone `DateTimePicker` component exists yet; the demo in `/design-system` shows the composed pattern (`Calendar` + three `Select`s) it should be built from.
- **2026-09-21 — `select.tsx` defaults to `position="popper"`, not `item-aligned`.** Radix's `item-aligned` mode (the old default) centers/aligns the dropdown to the selected item in a way that read as a floating popover rather than an anchored dropdown. `popper` mode anchors directly below the trigger like a conventional `<select>`.
