# AGENTS — operating guide for ERP

You are working on **ERP** (working name, renamed from "Teba" — see MEMORY.md), an Arabic-only (RTL) retail shop ERP. Next.js 15 · TypeScript strict · Tailwind v4 · shadcn/ui · Prisma · PostgreSQL · Zod · NextAuth · Zustand.

This is a checklist, not an essay. Follow it.

---

## 1. Read order at session start

1. **This file** — the rules.
2. [ARCHITECTURE.md](./ARCHITECTURE.md) — scope, stack, folders, data model, cross-cutting behaviour.
3. [MEMORY.md](./MEMORY.md) — locked decisions and *why*. Read before proposing anything different.
4. [BUILD_PLAN.md](./BUILD_PLAN.md) — phased tasks with IDs.
5. [UI_DESIGN_RULES.md](./UI_DESIGN_RULES.md) — binding visual rules. Read before touching any UI.
6. [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md) — what's actually done.

Domain authority is [`Docs/PRD — Retail Shop ERP.md`](../Docs/PRD%20—%20Retail%20Shop%20ERP.md). Behavioural reference is the Sahl screenshots in [`inspiration/`](../inspiration/) — copy the *speed and density*, never the green Windows-Forms look.

---

## 2. Hard rules — never break these

Pulled forward from [ARCHITECTURE.md §8](./ARCHITECTURE.md). Violating one is a defect, not a style disagreement.

### Data & correctness
1. **No mock data.** Every rendered value comes from PostgreSQL via Prisma. `prisma/seed.ts` is the only source of sample data.
2. **Money is Prisma `Decimal`,** never `number`. Format only at the render boundary.
3. **All quantities are stored in the product's sub-unit.** Convert at the action boundary, never mid-calculation.
4. **Multi-step writes go in one `prisma.$transaction`.** Stock, cash, and party balance must move together or not at all.
5. **No hard deletes on financial or inventory records.** Cancel or reverse, with a reason and compensating ledger rows.
6. **Every mutation writes an `AuditLog` row** naming the acting user.

### Security
7. **Every Server Action calls `requirePermission()` before touching data.** UI hiding is cosmetic and is never the enforcement point.
8. **Every Server Action re-validates** with the same Zod schema the client used.

### Structure
9. **No `src/`.** App code at the project root.
10. **All shared types live in `types/index.d.ts`.** Never co-located — including component `Props` types.
11. **All Zod schemas live in `lib/validations.ts`.** Never co-located, never inline.
12. **Server Components by default.** `"use client"` only where interactivity demands it, pushed as far down the tree as possible.
13. **No mega-files.** Past ~150 lines of JSX, decompose. Pages compose components; they don't contain markup.
14. **Server Actions for all mutations.** Route handlers exist only for NextAuth, the invoice PDF stream, and the backup export stream — anything that must stream a raw `Response` a Server Action can't produce.

### UI
15. **No hardcoded colours.** Tokens only — `bg-primary`, `text-muted-foreground`. No hex, no `bg-blue-500`.
16. **Logical CSS properties only** — `ps-*`, `pe-*`, `ms-*`, `me-*`, `start-*`, `end-*`, `text-start`, `text-end`. Physical `left`/`right`/`ml-`/`pr-` are forbidden outside print stylesheets.
17. **No hardcoded user-facing strings.** Everything through `messages/ar.json`.
18. **Every input gets a format-showing placeholder** (`٠١٠xxxxxxxx`, not "الهاتف"). **Every password input gets a show/hide eye toggle.**
19. **Every interactive element** has rest / hover / focus-visible / active / disabled states and a ≥44 px touch target on mobile.
20. **Every number uses `tabular-nums`** and renders through `<Money>` or `lib/format.ts`.
21. **Tables become stacked cards below 768 px.** Never horizontal-scroll a wide table on a phone.
22. **Icons are `lucide-react`.** Never emoji.
22a. **Every tooltip goes through `<AppTooltip>`** (`components/shared/app-tooltip.tsx`). Never a raw `title` attribute or an inline `Tooltip`/`TooltipContent` pair.
23. **Both themes and all four widths (375 / 768 / 1024 / 1440)** are verified before a UI task is marked done.

---

## 3. Workflow per task

1. **Pick the next unblocked task** from [BUILD_PLAN.md](./BUILD_PLAN.md), in order. Don't skip ahead — phases are dependency-ordered.
2. **Set it to `IN PROGRESS`** in [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md).
3. **If the task touches UI, invoke the `ui-ux-pro-max` and `frontend-design` skills first.** Every time — not once at project start. This is a standing requirement from the project owner.
4. **Build it**, obeying §2.
5. **Verify:**
   - `npm run typecheck` and `npm run lint` clean.
   - UI tasks: both themes, all four widths.
   - Action tasks: permission check present, Zod re-validation present, transaction wrapping present, audit write present.
6. **Update [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md)** — status to `DONE`, note anything worth knowing, add a changelog entry.
7. **Tick the checkbox in [BUILD_PLAN.md](./BUILD_PLAN.md).**
8. **If a decision was made** — anything a future contributor would wonder about — append it to [MEMORY.md](./MEMORY.md) with its rationale.
9. **If something surprising broke**, add it to the *Technical discoveries* section of [MEMORY.md](./MEMORY.md): what broke, why, the fix.

---

## 4. When to stop and ask

Stop and ask the project owner when:

- A task conflicts with a locked decision in [MEMORY.md](./MEMORY.md).
- The PRD is ambiguous and the readings would produce materially different data models or flows.
- You're about to add a dependency that isn't in [ARCHITECTURE.md §2](./ARCHITECTURE.md).
- You're about to add something from the **out of scope** list.
- **P3-3 — schema approval.** Blocking by design. Do not run the initial migration before the schema is approved.
- An **open question** from [MEMORY.md](./MEMORY.md) has reached its "decide by" point. Questions 1 and 4 (multi-warehouse, VAT) are both due before P3-3 and are both expensive to retrofit.

Don't stop for routine judgment calls. Make them, and log them in [MEMORY.md](./MEMORY.md).

---

## 5. Conventions cheat-sheet

| Thing | Convention |
|-------|-----------|
| Components | `PascalCase.tsx` in a domain folder under `components/` |
| Component files | kebab-case filename, PascalCase export — `line-items-table.tsx` → `LineItemsTable` |
| Server Actions | `actions/<domain>.actions.ts`, verb-first names — `createSale`, `cancelSale` |
| Zod schemas | `lib/validations.ts`, suffix `Schema` — `createSaleSchema` |
| Types | `types/index.d.ts`. Props types named `<ComponentName>Props` |
| Permissions | `domain.action` — `sale.create`, `report.profitLoss` |
| i18n keys | `domain.subject.key` — `sales.form.customerLabel` |
| Money display | `<Money value={x} />` — never `toLocaleString()` inline |
| Dates | `lib/format.ts`, `dd/MM/yyyy`, Gregorian, `ar-EG` |
| Numbers | Western digits, `tabular-nums`, `text-end` in numeric cells |
| Currency | EGP, suffix `ج.م` |
| Action returns | `ActionResult<T>` — never throw across the action boundary |
| List state | URL search params, not client state |
| Document numbers | `#000123`, per-type sequence from `DocumentCounter` |

---

## 6. Definition of done

A task is done when **all** of these hold:

- [ ] It meets its exit criterion in [BUILD_PLAN.md](./BUILD_PLAN.md).
- [ ] `npm run typecheck` and `npm run lint` pass clean.
- [ ] No hardcoded colours, strings, or physical CSS properties were introduced.
- [ ] UI work verified in both themes at 375 / 768 / 1024 / 1440 px.
- [ ] Server Actions re-validate, check permission, wrap in a transaction, and write audit.
- [ ] [PROGRESS_TRACKER.md](./PROGRESS_TRACKER.md) and [BUILD_PLAN.md](./BUILD_PLAN.md) are updated.
- [ ] Any new decision is recorded in [MEMORY.md](./MEMORY.md) with its rationale.
