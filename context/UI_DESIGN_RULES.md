# UI DESIGN RULES — Teba (طيبة)

> **These rules are binding.** They override any snippet imported from shadcn, 21st.dev, a tutorial, or a previous project. Imported patterns are a starting point for *structure* only — colour, type, spacing, radius, and motion always come from this document.

Companion docs: [ARCHITECTURE.md](./ARCHITECTURE.md) · [BUILD_PLAN.md](./BUILD_PLAN.md)

Derived using the `ui-ux-pro-max` skill. It classified Teba as **Data-Dense Dashboard / Drill-Down**, WCAG AA, Recharts + TanStack DataTable, CSS-variable theming. Its generic blue/amber palette is **replaced** by the indigo/teal system below.

---

## 1. Design direction

**Premium operational instrument.** Teba is used eight hours a day by people counting money. It must feel precise, calm, and fast — closer to a well-made financial terminal than to a marketing site or a stock admin template.

| Principle | What it means in practice |
|-----------|---------------------------|
| **Confident, quiet colour** | One deep indigo carries the brand. Teal appears only where money and primary action live. Everything else is neutral. Colour means something — it is never decoration. |
| **Two densities, one language** | Transactional screens are compact and keyboard-first. Everything else breathes. Same tokens, different spacing scale. |
| **Numbers are the hero** | Tabular numerals, right-aligned (physically, via `text-end` in RTL context), larger and heavier than surrounding text. A total should be readable across a counter. |
| **Soft depth, restrained radius** | Layered low-opacity shadows, `12px` default radius. No hard borders everywhere, no heavy drop shadows, no glassmorphism. |
| **Motion confirms, never entertains** | 150–250 ms. State changes, not flourishes. A row highlights; a panel does not bounce. |

### Explicitly avoid

- Stock shadcn slate/zinc grey on white. If a screen looks like an untouched template, it is not done.
- Ornate decoration, gradients-as-decoration, glass cards, neon glows.
- Emoji as icons — `lucide-react` only.
- Purely decorative illustration. Empty states get one restrained icon plus a useful action.
- Hover effects that shift layout (`scale`, size changes). Colour, shadow, and border only.

---

## 2. Colour tokens

Defined once in `app/globals.css` under Tailwind v4 `@theme`, as CSS variables in `:root` and `.dark`. **Components reference tokens only** — `bg-primary`, `text-muted-foreground`. A raw hex or a `bg-blue-500` in a component is a review failure.

### 2.1 Brand ramp — Indigo (primary)

| Step | Hex | OKLCH | Use |
|------|-----|-------|-----|
| 50 | `#EEF0F9` | `oklch(0.949 0.018 277)` | Tinted surfaces, selected-row wash |
| 100 | `#DDE0F2` | `oklch(0.903 0.033 277)` | Hover on tinted surfaces |
| 200 | `#BBC1E5` | `oklch(0.818 0.060 277)` | Borders on brand surfaces |
| 300 | `#8F98D2` | `oklch(0.707 0.087 277)` | Disabled brand text |
| 400 | `#5F6ABB` | `oklch(0.588 0.111 277)` | Dark-mode primary, chart series 2 |
| 500 | `#3F4A9E` | `oklch(0.470 0.124 277)` | Hover on primary |
| **600** | **`#2A2F6B`** | **`oklch(0.345 0.104 277)`** | **PRIMARY — brand anchor** |
| 700 | `#232759` | `oklch(0.301 0.090 277)` | Active/pressed primary |
| 800 | `#1A1D43` | `oklch(0.246 0.070 277)` | Sidebar background (light theme) |
| 900 | `#131629` | `oklch(0.192 0.045 277)` | Deepest ink |

### 2.2 Accent ramp — Teal

| Step | Hex | OKLCH | Use |
|------|-----|-------|-----|
| 50 | `#E7FAF7` | `oklch(0.964 0.027 180)` | Success wash |
| 100 | `#C6F3EC` | `oklch(0.925 0.056 180)` | Accent hover wash |
| 300 | `#5EDDCB` | `oklch(0.824 0.111 180)` | Dark-mode accent text |
| **500** | **`#14B8A6`** | **`oklch(0.720 0.130 180)`** | **ACCENT — CTAs, money, focus ring** |
| 600 | `#0E9788` | `oklch(0.625 0.114 180)` | Accent hover |
| 700 | `#0B776B` | `oklch(0.521 0.094 180)` | Accent active |

### 2.3 Light theme (`:root`)

| Token | Hex | Role |
|-------|-----|------|
| `--background` | `#F7F8FC` | App canvas — cool white, never pure `#FFF` |
| `--foreground` | `#131629` | Body text (contrast 15.8:1) ✅ |
| `--card` | `#FFFFFF` | Card / panel surface |
| `--card-foreground` | `#131629` | |
| `--popover` / `--popover-foreground` | `#FFFFFF` / `#131629` | |
| `--primary` | `#2A2F6B` | Primary buttons, active nav |
| `--primary-foreground` | `#FFFFFF` | Contrast 11.9:1 ✅ |
| `--secondary` | `#EEF0F9` | Secondary buttons, chips |
| `--secondary-foreground` | `#2A2F6B` | |
| `--accent` | `#14B8A6` | CTA, focus ring, money emphasis |
| `--accent-foreground` | `#06312C` | On teal — contrast 7.4:1 ✅ (never white on teal) |
| `--muted` | `#EDEFF5` | Table header, disabled fill |
| `--muted-foreground` | `#525A78` | Secondary text — contrast 7.2:1 ✅ |
| `--border` | `#DFE3EE` | Default border |
| `--input` | `#CFD5E6` | Input border — darker than `--border` so fields read as editable |
| `--ring` | `#14B8A6` | Focus ring |
| `--sidebar` | `#1A1D43` | Sidebar — dark in *both* themes, anchors the brand |
| `--sidebar-foreground` | `#C7CBE4` | |
| `--sidebar-accent` | `#2A2F6B` | Active nav item |
| `--sidebar-accent-foreground` | `#FFFFFF` | |

### 2.4 Dark theme (`.dark`)

| Token | Hex | Role |
|-------|-----|------|
| `--background` | `#0B0E1C` | Deep midnight canvas |
| `--foreground` | `#E8EAF4` | Contrast 14.6:1 ✅ |
| `--card` | `#141830` | Elevated surface — lighter than canvas, never darker |
| `--card-foreground` | `#E8EAF4` | |
| `--popover` | `#191E3A` | One step above card |
| `--primary` | `#5F6ABB` | **Lightened** — `#2A2F6B` fails contrast on dark |
| `--primary-foreground` | `#FFFFFF` | |
| `--secondary` | `#1E2440` | |
| `--secondary-foreground` | `#C7CBE4` | |
| `--accent` | `#14B8A6` | Teal holds on both themes |
| `--accent-foreground` | `#04201D` | |
| `--muted` | `#1B2038` | |
| `--muted-foreground` | `#9AA2C4` | Contrast 7.1:1 ✅ |
| `--border` | `#262C4A` | Visible, never `white/10` |
| `--input` | `#323A5E` | |
| `--ring` | `#14B8A6` | |
| `--sidebar` | `#0E1226` | Slightly deeper than canvas |
| `--sidebar-foreground` | `#B8BEDC` | |
| `--sidebar-accent` | `#232A4C` | |

### 2.5 Semantic / status colours

Each has a `-fg` (text/icon) and a `-bg` (subtle fill) variant so badges never rely on a solid block.

| Meaning | Light fg / bg | Dark fg / bg |
|---------|---------------|--------------|
| **Success** — paid, in stock, confirmed | `#0B776B` / `#E7FAF7` | `#5EDDCB` / `#0C2E2A` |
| **Warning** — partial, low stock | `#8A5A00` / `#FFF4E0` | `#F5B850` / `#33240A` |
| **Danger** — unpaid, out of stock, cancelled | `#B42318` / `#FEECEA` | `#FF8A7A` / `#3A1512` |
| **Info** — draft, neutral notice | `#2A2F6B` / `#EEF0F9` | `#8F98D2` / `#1A1F3D` |
| **Neutral** — inactive, archived | `#525A78` / `#EDEFF5` | `#9AA2C4` / `#1B2038` |

#### Domain mappings — fixed, do not improvise

| Domain state | Token |
|--------------|-------|
| `PAID` مدفوعة | success |
| `PARTIAL` مدفوعة جزئياً | warning |
| `UNPAID` غير مدفوعة | danger |
| `CANCELLED` ملغاة | danger (+ strikethrough number, muted row) |
| In stock (`qty > minQty`) | success |
| Low stock (`0 < qty ≤ minQty`) | warning |
| Out of stock (`qty ≤ 0`) | danger |
| Cash in (`amount > 0`) | success + `+` prefix |
| Cash out (`amount < 0`) | danger + `−` prefix |
| Customer owes shop | danger |
| Shop owes supplier | warning |
| Settled (`balance = 0`) | neutral |

> **Colour is never the only signal.** Every status carries an icon or text label alongside it.

### 2.6 Chart palette

Ordered, colour-blind-safe, used in sequence:

| # | Hex | |
|---|-----|---|
| 1 | `#2A2F6B` | indigo 600 |
| 2 | `#14B8A6` | teal 500 |
| 3 | `#5F6ABB` | indigo 400 |
| 4 | `#F5B850` | amber |
| 5 | `#8F98D2` | indigo 300 |
| 6 | `#0E9788` | teal 600 |

Area fills at 20 % opacity. Grid lines `--border`. Dark mode brightens series 1 to `#5F6ABB`. Charts always ship with an accessible data table alternative or `aria-label` summary.

---

## 3. Typography

**One family: `IBM Plex Sans Arabic`** — self-hosted via `next/font/local`, weights 400 / 500 / 600 / 700. It carries Arabic and Latin with matching metrics, so mixed strings (`فاتورة #000123`) don't jump. Latin fallback stack: `system-ui, sans-serif`.

### 3.1 Scale

| Token | Size / line-height | Weight | Use |
|-------|--------------------|--------|-----|
| `display` | 32 / 40 | 700 | Dashboard hero figure, invoice grand total |
| `h1` | 24 / 32 | 700 | Page title |
| `h2` | 20 / 28 | 600 | Section heading, card title |
| `h3` | 17 / 24 | 600 | Sub-section, dialog title |
| `body` | 15 / 24 | 400 | Default body — **never below 15 px**, 16 px on mobile |
| `body-sm` | 13.5 / 20 | 400 | Table cells (compact), helper text |
| `label` | 13 / 18 | 500 | Form labels, table headers |
| `caption` | 12 / 16 | 400 | Timestamps, metadata |
| `mono-num` | inherits | 500 | Money and quantities — `font-variant-numeric: tabular-nums` |

### 3.2 Number rules

1. **Western digits** (`34,890`), not Arabic-Indic. Locked decision — faster to scan, matches receipts and keyboards.
2. **`tabular-nums` on every numeric column.** Non-negotiable: without it, digits shift width and columns visually wobble.
3. Money renders as `34,890.00 ج.م` — thousands separator, always 2 decimals, currency suffix in `--muted-foreground` at `caption` size.
4. Quantities: up to 3 decimals, trailing zeros trimmed (`2.5` not `2.500`).
5. Negative money: `−1,200.00` (U+2212 minus, not hyphen) in danger colour.
6. Numeric cells align to the **end** of the cell (`text-end`) — which is visually left in RTL, exactly as an accountant expects.
7. **All numbers ship through `components/shared/money.tsx` or `format.ts`.** Never `toLocaleString()` inline in a component.

### 3.3 Arabic-specific

- Line-height is generous — `1.6` on body. Arabic ascenders/descenders need more room than Latin.
- **No `text-transform: uppercase`** — meaningless and harmful for Arabic.
- **No letter-spacing on Arabic text** — it breaks the connected script. Latin-only labels may use it.
- Long names truncate with `line-clamp-1` + a `title` attribute. Never mid-word `overflow: hidden`.

---

## 4. Spacing, radius, elevation

### 4.1 Base grid — 4 px

Allowed steps: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64`. Nothing between.

### 4.2 Two densities

Set by `data-density="compact"` on a container; `ui.store.ts` remembers the user's preference.

| Property | Compact (transactional) | Comfortable (editorial) |
|----------|------------------------|-------------------------|
| Table row height | 40 px | 56 px |
| Table cell padding | `8px 12px` | `14px 20px` |
| Card padding | 16 px | 24 px |
| Section gap | 16 px | 32 px |
| Input height | 36 px | 42 px |
| Button height | 36 px | 42 px |
| Body size | 13.5 px | 15 px |

**Compact applies to:** `/sales/new`, `/purchases/new`, returns, `/inventory`, `/inventory/stocktake/new`, cashbox movements, audit log, report tables.
**Comfortable applies to:** dashboard, customer/supplier profiles, invoice detail, settings, login, reports hub, empty states.

> On screens ≤767 px, **everything is comfortable** — touch targets win over density.

### 4.3 Radius

`--radius: 12px`. Derived: `sm 8px` (badges, inputs, small buttons) · `md 12px` (cards, dialogs, default) · `lg 16px` (large panels, sheets) · `full` (avatars, pills only).
Table rows and cells: **0**. Grids read as grids.

### 4.4 Elevation

Layered, low-opacity, indigo-tinted — never pure black.

| Level | Light | Dark | Use |
|-------|-------|------|-----|
| `flat` | none, `1px solid var(--border)` | same | Table containers, inline panels |
| `sm` | `0 1px 2px rgb(19 22 41 / .05), 0 1px 3px rgb(19 22 41 / .06)` | `0 1px 3px rgb(0 0 0 / .4)` | Cards at rest |
| `md` | `0 2px 4px rgb(19 22 41 / .05), 0 4px 12px rgb(19 22 41 / .08)` | `0 4px 12px rgb(0 0 0 / .5)` | Card hover, dropdowns, popovers |
| `lg` | `0 8px 16px rgb(19 22 41 / .08), 0 16px 32px rgb(19 22 41 / .10)` | `0 16px 32px rgb(0 0 0 / .6)` | Dialogs, sheets |
| `ring` | `0 0 0 3px rgb(20 184 166 / .35)` | `0 0 0 3px rgb(20 184 166 / .45)` | Focus |

Dark mode leans on **surface lightness** for hierarchy (`#0B0E1C` → `#141830` → `#191E3A`), not on shadow alone.

### 4.5 Layout frame

- Sidebar: `72px` icon rail (1024–1279 px) · `256px` expanded (≥1280 px) · off-canvas Sheet (<1024 px).
- Topbar: `60px`, sticky, `flat` + bottom border.
- Content max-width `1600px`, centred, `24px` gutter desktop / `16px` mobile.
- Dashboard grid: 12-col ≥1280 px · 6-col 768–1279 px · 1-col <768 px.

---

## 5. RTL — mandatory

Arabic-only, `<html lang="ar" dir="rtl">`. Even so, the layout is built direction-agnostic so nothing has to be rewritten if English is ever added.

### 5.1 Logical properties only

| ❌ Forbidden | ✅ Required |
|-------------|------------|
| `ml-4` `mr-4` | `ms-4` `me-4` |
| `pl-4` `pr-4` | `ps-4` `pe-4` |
| `left-0` `right-0` | `start-0` `end-0` |
| `text-left` `text-right` | `text-start` `text-end` |
| `border-l` `border-r` | `border-s` `border-e` |
| `rounded-l-*` `rounded-r-*` | `rounded-s-*` `rounded-e-*` |
| `translate-x-[n]` (directional) | `rtl:-translate-x-[n]`, or a logical-aware utility |

A physical property in a component is a review failure. The **only** exception: print stylesheets, where the physical page is fixed.

### 5.2 Mirroring

- **Flip:** chevrons, arrows, back/forward, "next step", progress direction, slide-in transitions, carets in breadcrumbs.
- **Never flip:** logo, clock/time icons, media play controls, checkmarks, brand marks, the `+` icon, number glyphs themselves.
- Use `rtl:rotate-180` or `rtl:scale-x-[-1]` on directional icons; `lucide-react` icons don't mirror themselves.

### 5.3 Tables & charts in RTL

- The first (identity) column sits at the **start** = visually right.
- Actions column sits at the **end** = visually left.
- Numeric columns use `text-end`.
- Recharts renders LTR internally. Set `reversed` on the X axis and `orientation="right"` on the Y axis so time flows right→left and the axis reads on the correct side.
- Sort indicators and resize handles follow logical direction.

---

## 6. Component anatomy

### 6.1 Buttons

| Variant | Light | Hover | Use |
|---------|-------|-------|-----|
| `primary` | `bg-primary` / white | `indigo-500` | The one main action per view |
| `accent` | `bg-accent` / `accent-foreground` | `teal-600` | Save invoice, confirm payment — money-committing |
| `secondary` | `bg-secondary` / `primary` | `indigo-100` | Alternate actions |
| `outline` | transparent, `border-input` | `bg-muted` | Filters, tertiary |
| `ghost` | transparent | `bg-muted` | Icon buttons, table row actions |
| `destructive` | `danger-fg` / white | darken 8 % | Cancel invoice, delete |

Every button: `transition-colors duration-200`, `cursor-pointer`, visible `focus-visible:ring-2 ring-accent ring-offset-2`, `disabled:opacity-50 disabled:cursor-not-allowed`, spinner + disabled while pending. Minimum height 36 px compact / 42 px comfortable / **44 px on mobile**.
F-key hint renders as `<Kbd>` at the button's **end**.

### 6.2 Inputs

Height per density. `border-input`, `rounded-sm`, `bg-card`. Focus: `border-accent` + `ring`. Error: `border-danger` + inline message below in danger, `aria-invalid`, `aria-describedby`.
**Every input has a format-showing placeholder** — `٠١٠xxxxxxxx`, `مثال: ٥٠٠٫٠٠`, `ابحث بالاسم أو الباركود…`. Never a restatement of the label.
**Every password input has a show/hide eye toggle** (`Eye` / `EyeOff`), as an icon button at the input's end, `aria-label` translated.
Numeric inputs: `inputMode="decimal"`, `tabular-nums`, `text-end`.

### 6.3 Data table

Structure: toolbar (search + filters + density toggle + export) → `flat` bordered container → sticky header (`bg-muted`, `label` type, sortable) → rows → footer (totals row + pagination).

- Row hover: `bg-muted/50`. Selected: `bg-indigo-50` / dark `bg-indigo-900/25`.
- Zebra striping: **off**. Borders and hover carry the structure.
- Cancelled rows: `opacity-60` + strikethrough document number.
- Totals footer is sticky at the bottom on long tables (the Sahl green summary bar, restyled).
- Empty state: centred icon + message + primary action, never a bare "No data".
- Loading: skeleton rows matching the real column layout — never a spinner replacing the whole table.
- Actions column pinned to the end, `ghost` icon buttons with tooltips, all `aria-label`led.
- **Below 768 px the table becomes stacked cards.** Identity + status on the first row, key figures as a small label/value grid, actions in a footer row. No horizontal scrolling of a wide table on a phone.
- Semantic `<table>` markup always (`TableHeader` / `TableBody` / `TableRow`), never a div grid.

### 6.4 Cards & stat tiles

Card = `bg-card` + `radius-md` + `shadow-sm` + `border` (light) / surface-lift (dark). Header with `h2` title and optional action, body, optional footer.
Stat tile: `label` caption on top, `display`-size tabular figure, delta chip (success/danger + arrow) and a sparkline below. Money always suffixed `ج.م`.

### 6.5 Dialogs & sheets

≥768 px: centred `Dialog`, `max-w-lg` (forms) / `max-w-3xl` (invoice preview), `shadow-lg`, `radius-md`.
<768 px: bottom `Sheet`, `rounded-t-lg`, drag handle, full-width stacked buttons.
Destructive confirms restate the consequence and name the entity — "إلغاء الفاتورة #000123؟ سيتم عكس الحركات المالية والمخزنية." Confirm button is `destructive`.
`Esc` closes; focus is trapped and returns to the trigger on close.

### 6.6 Forms

`react-hook-form` + shadcn `<Form>` + Zod resolver, always. Field = label, control, placeholder, helper/error slot. Required marked with an accent `*` plus `aria-required`.
Server `fieldErrors` map back onto the matching fields; a general error goes to a toast. Submit disables and spins. Grouped sections get an `h3` and `24px` separation.

### 6.7 Navigation

Sidebar (dark in both themes): brand block, grouped nav (المبيعات / المشتريات / المخزون / الأطراف / الخزائن / التقارير / الإدارة), icon + label, active item `bg-sidebar-accent` with a `3px` accent bar at the **start** edge. Rail mode shows icons with tooltips.
Topbar: page title + breadcrumb, global search (`Ctrl+K`), notification bell with unread badge, theme toggle, user menu.

### 6.8 Badges

`radius-sm`, `caption` type, 500 weight, `6px 10px`, semantic `-bg` fill + `-fg` text, optional leading icon. Never a solid saturated block behind white text.

### 6.9 Toasts (Sonner)

Bottom-**start** (visually bottom-left in RTL). Success 3 s, error 5 s, action toasts persist. Leading semantic icon, one-line message, optional action button ("عرض الفاتورة"). Never for form-field validation — that is inline.

### 6.10 Skeletons

Match the real layout — same row count, same column widths, same card shape. `bg-muted` with a subtle shimmer. Never a centred spinner for initial page load.

### 6.11 Print (physical properties allowed here)

Three templates share a header (shop name, phone, address, invoice number, date, cashier) and a totals block.

| Size | Layout |
|------|--------|
| **A4** | Full table, generous margins, footer note, room for a logo. Also the PDF layout. |
| **A5** | Condensed table, tighter margins. |
| **80 mm** | Single-column receipt, monospaced amounts, dashed separators, no borders, `10pt` base. |

Print CSS forces black on white regardless of theme, hides the app shell, and avoids page breaks inside a line row.

---

## 7. Interaction & motion

### 7.1 Budget

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Hover / focus colour | 150 ms | `ease-out` |
| Button press | 100 ms | `ease-out` |
| Dropdown / popover | 180 ms | `cubic-bezier(.16,1,.3,1)` |
| Dialog in | 220 ms | `cubic-bezier(.16,1,.3,1)` |
| Sheet slide | 250 ms | `cubic-bezier(.16,1,.3,1)` |
| Page transition | 200 ms fade + 4 px rise | `ease-out` |
| Toast | 200 ms slide + fade | `ease-out` |
| Skeleton shimmer | 1600 ms loop | `linear` |
| Number count-up (KPI only) | 600 ms | `ease-out` |

Nothing exceeds 300 ms except deliberate loops. Animate **`transform` and `opacity` only** — never `width`, `height`, `top`, or `left`.

### 7.2 `prefers-reduced-motion`

Honoured globally: transforms and loops drop to opacity-only or instant. The count-up renders the final number immediately.

### 7.3 Required states

Every interactive element ships all five: **rest · hover · focus-visible · active · disabled**. A component missing focus-visible is not done.

### 7.4 Keyboard

Tab order follows visual order. Focus ring is always visible — never `outline: none` without a replacement. Dialogs trap focus and restore it. A skip-to-content link precedes the sidebar. F-keys per [ARCHITECTURE.md §6.14](./ARCHITECTURE.md), suppressed while a text input has focus except where the screen explicitly claims them.

---

## 8. Responsive

### 8.1 Breakpoints

| Name | Range | Frame |
|------|-------|-------|
| `xs` | <480 px | 1 col, 16 px gutter, off-canvas nav, bottom sheets |
| `sm` | 480–767 px | 1 col, larger tap targets |
| `md` | 768–1023 px | 2 col, real tables return, off-canvas nav |
| `lg` | 1024–1279 px | Icon rail sidebar, 2–3 col |
| `xl` | 1280–1535 px | Expanded sidebar, full 12-col grid |
| `2xl` | ≥1536 px | Max-width 1600 px, centred |

Verify every screen at **375 · 768 · 1024 · 1440 px**, in **both themes**, before calling it done.

### 8.2 Per-component behaviour

| Component | <768 px | 768–1023 px | ≥1024 px |
|-----------|---------|-------------|----------|
| Sidebar | Sheet, hamburger in topbar | Sheet | Rail → expanded at 1280 px |
| Data table | Stacked cards | Table, fewer columns | Full table |
| Filters | Collapsible Sheet, "تصفية (٣)" button | Wrapped row | Inline row |
| New-sale screen | Single column, sticky bottom total/pay bar | Two column | Three zone: search · lines · totals |
| Dashboard KPIs | 1 col stacked | 2×2 grid | 4 across |
| Charts | Full width, 200 px tall, fewer ticks | 280 px | 320 px |
| Dialog | Bottom sheet, full width | Centred | Centred |
| Invoice detail | Stacked sections | Stacked | Two column (details / totals aside) |
| Topbar | Icons only, title truncated | Title + icons | Full with breadcrumb + search |
| Tabs | Horizontally scrollable | Full | Full |

### 8.3 Mobile rules

- Minimum touch target **44×44 px**, minimum 8 px between adjacent targets.
- Body text minimum **16 px** (prevents iOS zoom-on-focus).
- No horizontal page scroll at any width — ever.
- Primary action reachable with a thumb: sticky bottom bar on long forms.
- Sticky headers on mobile must not eat more than 20 % of viewport height.

---

## 9. Accessibility floor — WCAG 2.1 AA

1. Text contrast ≥ **4.5:1**; large text (≥19 px / 600) ≥ **3:1**. Every pair in §2 is verified.
2. UI component and focus-indicator contrast ≥ **3:1**.
3. Colour never the sole carrier of meaning — icon or text always accompanies.
4. Every icon-only button has a translated `aria-label`.
5. Every input has a `<label>` with `htmlFor`; placeholders never replace labels.
6. Semantic landmarks: `header` / `nav` / `main` / `aside`. One `h1` per page, headings never skip levels.
7. Charts carry an `aria-label` summary and a table alternative.
8. Toasts announce via `role="status"`; errors via `role="alert"`.
9. Full keyboard operability, visible focus, logical tab order.
10. `prefers-reduced-motion` respected.

---

## 10. Do / Don't

### Do

- Reference tokens — `bg-primary`, `text-muted-foreground`, `border-border`.
- Use logical properties everywhere (`ps-4`, `me-2`, `start-0`, `text-end`).
- Put `tabular-nums` on every number, route it through `<Money>` / `format.ts`.
- Give tables sticky headers, sticky totals, and card layouts below 768 px.
- Give every interactive element all five states plus a 44 px mobile target.
- Match skeletons to the real layout.
- Use `lucide-react` icons at a consistent 24 px viewBox.
- Show the format in the placeholder.
- Test both themes and all four widths before calling a screen done.
- Keep components under ~150 lines of JSX; decompose past that.

### Don't

- Hardcode a colour, a hex, or a Tailwind palette class in a component.
- Use `ml-*`, `pr-*`, `left-*`, `text-right` in application code.
- Use emoji as icons.
- Animate `width`, `height`, `top`, or `left`.
- Use `scale` on hover for cards or rows (layout shift).
- Use `bg-white/10` glass in light mode or `border-white/10` anywhere.
- Ship a bare spinner where a skeleton belongs.
- Write a user-facing string outside `messages/ar.json`.
- Let a wide table scroll horizontally on a phone.
- Rely on colour alone to distinguish paid / partial / unpaid.
- Use Arabic-Indic numerals (locked: Western digits).
- Apply `uppercase` or letter-spacing to Arabic text.
- Leave `outline: none` without a visible replacement.
