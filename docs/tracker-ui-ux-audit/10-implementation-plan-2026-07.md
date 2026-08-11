# Implementation Plan — Tenders / Projects / POs UI/UX Findings

Date: 2026-07-28
Source: `09-2026-07-audit-refresh-tenders-projects-po.md`. This plan turns that
audit's "Confirmed Still Open" and "New Findings" sections into ordered,
scoped engineering tasks. Each task lists exact files, what to change, how to
verify it, and effort. Ordered so each phase can ship as its own PR.

## Phase 0 — Accessibility fixes (ship first, ~30 min, zero risk)

### 0.1 Label the unlabeled PO icon-links in Project Workspace

- **Files:** `apps/tracker/src/components/projects/project-workspace.tsx:1005-1009` and `:1150-1154`
- **Problem:** Both are `<Link><Button variant="ghost" size="icon"><ArrowRight /></Button></Link>` — nested interactive elements (an `<a>` wrapping a `<button>`) with no text, `aria-label`, or `sr-only` span. This is both an invalid HTML nesting and an accessible-name gap; adding `aria-label` to the inner `Button` alone doesn't fix the outer `Link` having no name of its own.
- **Change:** Restructure to a single focusable control instead of nesting two: use `Button asChild` wrapping the `Link` (`<Button variant="ghost" size="icon" asChild><Link href={...} aria-label="View purchase order">...</Link></Button>`), so it renders as one `<a>` styled as a button, and put the `aria-label` on that single control — `"View purchase order"` for the first occurrence (~line 1006), `"View delivery note purchase order"` for the second (~line 1151).
- **Verify:** Rendered DOM has one focusable element per control (not a button nested in an anchor). Tab to each control with keyboard only and confirm a screen reader (VoiceOver/NVDA) announces a distinct name, not just "button" or "link."
- **Effort:** S.

### 0.2 Sweep for the same pattern

- **Files:** grep `apps/tracker/src/components/{tenders,projects,purchase-orders}` for `size="icon"` (~15-20 matches per the audit).
- **Change:** For every icon-only `Button` not already wrapped in a `DropdownMenuTrigger` with an `sr-only` label, add `aria-label`.
- **Verify:** Zero icon-only interactive elements without an accessible name across the three module folders.
- **Effort:** S (mechanical, one PR).

## Phase 1 — Small, high-visibility fixes (ship next, ~half day)

### 1.1 Fix PO list header action dilution

- **File:** `apps/tracker/src/app/(dashboard)/projects/purchase-orders/page.tsx:98` (Add Project) and `:104` (Add Purchase Order)
- **Change:** Remove the "Add Project" button from this page's header entirely. Keep "Add Purchase Order" as the sole primary action. If cross-linking to project creation is genuinely needed here, move it into an overflow/secondary link, not a second equal-weight button.
- **Verify:** PO list page header has exactly one primary CTA.
- **Effort:** S.

### 1.2 Reconcile the tender status model (design decision + code)

- **Files:** `apps/tracker/src/components/tenders/tenders-search-filters.tsx:35-54` (`STATUS_OPTIONS`, `QUICK_VIEWS`) vs. `apps/tracker/src/components/ui/status-badge.tsx:29-38` (`TENDER_LIFECYCLE`) and `:49-92` (`STATUS_MAP_BY_DOMAIN.tender`).
- **Problem:** The filter bar treats tender status as a flat 8-value set (`open`, `closed`, `evaluation`, `awarded`, `lost`, plus 3 synthetic quick-view buckets that aren't stored statuses at all: `closing_soon`, `under_preparation`, `awaiting_results`). The lifecycle stepper on the detail page uses a different 8-stage ordered progression (`new → review → approved_to_prepare → preparation → ready → submitted → evaluation → awarded`). `open` in the filter has no single equivalent lifecycle stage — it's ambiguous whether it means "any non-terminal status" or a literal stored value.
- **This needs a decision before code, not just a refactor** — confirm with whoever owns the tender data model whether `open` is a derived filter (any of `new/review/approved_to_prepare/preparation/ready/submitted`) or a real column value coexisting with the lifecycle stages. Recommended resolution:
  1. Keep `closing_soon`/`under_preparation`/`awaiting_results` as derived quick-view filters (they're useful and don't need to be status values), but implement them as query predicates over the real lifecycle stages + deadline math, not as a fake status string compared against.
  2. Replace the literal `open`/`closed`/`evaluation`/`awarded`/`lost` status filter options with the actual `TENDER_LIFECYCLE` stages plus `lost`/`closed`/`cancelled`, so the filter dropdown and the detail-page stepper always describe the same state machine.
  3. Update `STATUS_OPTIONS` in `tenders-search-filters.tsx` to import its values from `STATUS_MAP_BY_DOMAIN.tender` / `TENDER_LIFECYCLE` instead of a hand-maintained parallel list, so the two can't drift again.
- **Verify:** Every *persisted lifecycle status* shown in the tender list filter (i.e. not `closing_soon`/`under_preparation`/`awaiting_results`, which stay derived query predicates per resolution #1 above) also appears, with the same label, in the tender detail lifecycle stepper. Separately, confirm the three derived quick-view filters still function correctly as predicates over lifecycle stage + deadline math, not as literal status-string comparisons.
- **Effort:** M (requires a product/data conversation first; code change itself is S once resolved).

## Phase 2 — Shared pattern extraction (highest leverage, ~2-3 days)

The PO list (`po-list.tsx`) already has the best-in-class version of filtering, and building the same thing three separate times has already caused drift once (see audit finding: PO list got URL-synced filters + supplier/project filters, Tenders and Projects didn't). Extract before any more work goes into an unshared per-module filter bar.

### 2.1 Extract a shared URL-synced filter hook

- **Reference implementation:** `apps/tracker/src/components/purchase-orders/po-list.tsx:117-180` (`useSearchParams`/`router.push` pattern reading `search`, `status`, `supplier`, `projectId`, `startDate`, `endDate`, `page`).
- **New file:** `apps/tracker/src/hooks/use-url-filters.ts` (or `components/shared/tables/use-url-filters.ts` to sit next to `data-table-shell.tsx`) — a generic hook taking a filter-field config and returning `{ values, setValue, params }`, backed by `useSearchParams`/`usePathname`/`router.push` exactly as `po-list.tsx` does today.
- **Consumers to migrate:**
  - `tenders-table.tsx` + `tenders-search-filters.tsx` — currently uses component state (`internalFilters`), not URL sync. Migrate to the shared hook so tender filters become shareable/bookmarkable links, matching PO list.
  - `project-list.tsx` — same gap, same fix.
- **Verify:** Reloading the page, or sharing a URL, preserves the same filter/sort/page state for Tenders and Projects lists exactly as it already does for POs.
- **Effort:** M.

### 2.2 Add sortable column headers (shared component)

- **Problem:** Confirmed zero sort affordances in `tenders-table.tsx`, `project-list.tsx`, `po-list.tsx` — audit checked for `onClick`+sort, `ArrowUpDown`, `sortable` and found none.
- **New component:** A `SortableColumnHeader` (or extend `data-table-shell.tsx`) that renders a header cell with a click handler and `ArrowUpDown`/`ArrowUp`/`ArrowDown` icon reflecting current sort state, writing `sortBy`/`sortOrder` through the same `use-url-filters` hook from 2.1.
- **Note:** `tenders-search-filters.tsx` already has a `sortBy`/`sortOrder` *select dropdown* (`SORT_OPTIONS`, `SORT_ORDER_OPTIONS`, lines 56-66) — this task is about adding clickable column headers as an additional/replacement affordance, and wiring `project-list.tsx`/`po-list.tsx` to the same capability, since they currently have no sort UI at all.
- **This must reach the data layer, not just the URL:** `getTendersOverview` already supports `sortBy`/`sortOrder`, but `ProjectList` and `POList` currently only pass `search`/`status`/`page`-style filters into their loaders — `getProjects` and `getPurchaseOrders` have no sort parameter today. Adding clickable headers that only update the URL would look functional while doing nothing for Projects/POs. Scope for this task includes: reading `sortBy`/`sortOrder` out of the shared `use-url-filters` state in `ProjectList`/`POList`, passing them through to `getProjects`/`getPurchaseOrders`, and defining the corresponding server-side sort contract/query for both (Tenders' contract already exists via `getTendersOverview` and should just be reused, not reimplemented).
- **Verify:** Clicking a sortable column header on all three tables toggles asc/desc, updates the URL, *and* produces actual ascending/descending row reordering in the rendered table — not just a URL change.
- **Effort:** M.

## Phase 3 — Project Workspace decomposition (highest effort, ~1 week)

### 3.1 Split `project-workspace.tsx` (1,471 lines) by tab

- **File:** `apps/tracker/src/components/projects/project-workspace.tsx`
- **Change:** Extract each of the 8 sub-domains into its own component file under `components/projects/workspace/`: `overview-tab.tsx`, `purchase-orders-tab.tsx`, `line-items-tab.tsx`, `deliveries-tab.tsx`, `documents-tab.tsx`, `activity-tab.tsx`, `risks-tab.tsx`, `close-out-tab.tsx`. Keep `project-workspace.tsx` as the tab-shell/router only.
- **Do this before 3.2** — it's much easier to fix one small color usage per new file than to hunt through 1,471 lines.
- **Verify:** No behavior change; `project-workspace.tsx` drops to well under 200 lines (shell + tab list only).
- **Effort:** L.

### 3.2 Replace hardcoded colors with `StatusBadge`/tokens

- **Exact lines to fix (all in the extracted tab files after 3.1):** `text-emerald-600`/`text-amber-600`/`text-purple-600`/`text-blue-600` at (pre-split) lines 521, 744, 748, 774, 806, 923, 934, 1067, 1109, 1133, 1148.
- **Change:** Each of these is a semantic status/value color (delivered=success, outstanding=warning, tender link=info, close-out note=neutral). Map each to the existing `tone` palette in `status-badge.tsx` (`tone.success`, `tone.warning`, `tone.info`, etc.) rather than a raw Tailwind color class. Where the text is a monetary value tied to a state (e.g., "delivered value"), consider whether it should render inside a `StatusBadge`-style chip instead of plain colored text, for consistency with how status is shown elsewhere.
- **Verify:** `grep -rn "text-emerald-600\|text-amber-600\|text-purple-600\|text-blue-600" apps/tracker/src/components/projects/workspace/` (run from repo root — all other paths in this doc are repo-root-relative) returns nothing; visual diff confirms colors are unchanged (tone classes should map 1:1).
- **Effort:** M (mechanical once 3.1 is done).

### 3.3 Resolve raw `Badge` vs `StatusBadge` usage

- **Files:** `tender-details.tsx`, `project-workspace.tsx` (post-split tab files), `project-action-queue.tsx`, `project-line-items-list.tsx` — 8 raw `<Badge` usages confirmed alongside `StatusBadge` imports in the same files.
- **Change:** For each raw `<Badge>` that's displaying a tender/project/PO/risk/delivery status, replace with `<StatusBadge status={...} domain={...} />`. If a `<Badge>` is displaying something that isn't a lifecycle status (e.g., a count or a non-status label), leave it as `Badge` — this task is about consistency for status specifically, not banning `Badge` outright.
- **Verify:** `STATUS_MAP_BY_DOMAIN` is the only place status label/tone pairs are defined; no component hand-rolls its own status color.
- **Effort:** S-M.

## Phase 4 — Decisions needed before further work (not code tasks)

These three items came out of the audit as things that need a product/architecture decision, not a PR. Flagging them here so they don't get silently skipped. **Policy: none of these three block Phase 2/3 starting — raise and resolve them in parallel with Phase 0/1.** The one exception is noted inline below (#1), where a late decision has a specific, bounded rework cost rather than a blocking one.

1. **Purchase Orders route nesting** — keep `/projects/purchase-orders/...` or promote POs to a top-level `/purchase-orders` route. This does not need to block Phase 2/3 starting, but if the promotion decision lands *after* Phase 2 has already touched `po-list.tsx`, expect a follow-up path-rename pass rather than avoidable rework — worth deciding sooner rather than later for that reason alone, not because it gates other work.
2. **`packages/ui` fate** — `apps/tracker` doesn't import `@pmg/ui` and maintains a fully separate copy of every primitive. Either start consuming `@pmg/ui` from `apps/tracker` (larger migration) or stop describing it as the shared design system in planning docs (smaller, immediate fix to avoid future confusion).
3. **Route-level `loading.tsx`/`error.tsx`** — currently zero in `tenders/`, `projects/`, `projects/purchase-orders/`. Low effort, but changes the loading/error contract for every page in these route groups, so worth a quick alignment on whether skeleton-per-component (current) or Suspense-boundary-per-route (Next.js convention) is the intended long-term pattern before rolling it out to all three modules at once.

## Suggested Sequencing

| Phase | Effort | Depends on | Ships as |
|---|---|---|---|
| 0 — Accessibility | S | — | 1 PR |
| 1.1 — PO header fix | S | — | Can bundle with Phase 0 |
| 1.2 — Tender status reconciliation | M | Product decision on `open` semantics | 1 PR, after decision |
| 2.1 — Shared URL filter hook | M | — | 1 PR |
| 2.2 — Sortable headers | M | 2.1 | 1 PR, after 2.1 |
| 3.1 — Workspace split | L | — | 1 PR |
| 3.2 — Color token cleanup | M | 3.1 | 1 PR, after 3.1 |
| 3.3 — Badge consistency | S-M | 3.1 (optional but easier after) | Can bundle with 3.2 |
| 4 — Decisions | — | — | Not a PR — raise in parallel with Phase 0/1, non-blocking (see caveat on #1) |

Recommended order: Phase 0 → 1.1 → 2.1 → 2.2 → 3.1 → 3.2/3.3 → 1.2 (once the status-model decision lands, whenever that happens). Phase 4 decisions should be raised in parallel with Phase 0/1; none of them block Phase 2/3 starting.
