# Audit Refresh — Tenders, Projects, Purchase Orders

Date: 2026-07-28
Scope: verification pass on `docs/tracker-ui-ux-audit/02-tender-management.md`,
`03-project-management.md`, and `04-purchase-orders.md` (dated 2026-06-21),
plus new findings, checked directly against the current code in
`apps/tracker/src/**`. This doc does not restate every original finding —
only what changed, what's confirmed still open, and what's new. Read it
alongside the three module reports above.

Five weeks passed between the original audit and this pass, and real work
landed in that window. The rest of this doc separates what's done from
what still needs attention so effort isn't spent re-fixing solved problems.

## What's Been Fixed (verified in code)

| Original finding | Status | Evidence |
|---|---|---|
| Browser `alert()`/`confirm()` used for delete/errors in tender/project/PO flows | **Fixed** | Zero `window.confirm`/`window.alert`/`alert(` hits in `components/tenders`, `components/projects`, `components/purchase-orders`. `AlertDialog` is now used consistently for destructive actions (`project-list.tsx`, `project-line-items-list.tsx`, `po-list.tsx`). |
| Emoji used in tender status filter labels | **Fixed** | No emoji found in `tenders-search-filters.tsx` or elsewhere in the three modules. |
| PO list filters not synced to URL (`searchParams` resolved but unused) | **Fixed** | `po-list.tsx` now reads/writes `search`, `status`, `supplier`, `projectId`, `startDate`, `endDate`, `page` through `useSearchParams`/`router.push` (`po-list.tsx:117-180`). Supplier and project filters were also added — both were "missing" in the original audit. |
| PO line-item entry is a wide table with no mobile pattern | **Fixed** | `po-form.tsx:910` has a dedicated `md:hidden` stacked card editor for line items, separate from the `hidden md:block` table at line 783. This was flagged as "the hardest PO workflow on mobile" — it now has the guided card pattern the audit recommended. |
| Projects Overview only showed a generic "growth" metric, no delivery/risk signal | **Fixed** | `projects/overview/page.tsx` now renders a `ProjectHealthSummary` widget plus explicit Project Health (on-track/delayed/critical) and Project Risks (open/high-critical) cards (`page.tsx:113-186`). |

Good news aside, none of the changes above were accompanied by parallel fixes in Tenders or Purchase Order *detail* pages — the fixes landed unevenly across modules, which itself matters for a consistency audit (see below).

## Confirmed Still Open

1. **Project Workspace is a 1,471-line single file mixing 8 sub-domains** (overview, POs, line items, deliveries, documents, activity, risks, close-out) in `components/projects/project-workspace.tsx`. It's still nearly 3x the next largest module file (`po-form.tsx`, 1,074 lines). The "dark glass" panels described in the original audit are gone, but the file still hardcodes semantic colors instead of using `StatusBadge`/theme tokens: `text-emerald-600`, `text-amber-600`, `text-purple-600`, `text-blue-600` appear directly at lines 521, 744, 748, 774, 806, 923, 934, 1067, 1109, 1133, 1148. Every one of these should be a `StatusBadge` tone or a CSS variable, not a hand-picked Tailwind color, or the workspace will keep drifting visually from the rest of the app one tab at a time.

2. **Tender status model mismatch persists.** `tenders-search-filters.tsx` still filters on a simple three-state model (`open`, `evaluation`, `awarded`) while `status-badge.tsx`'s `TENDER_LIFECYCLE` defines a richer seven-stage model (`new`, `review`, `approved_to_prepare`, `preparation`, `ready`, `submitted`, ...) used in `tender-details.tsx`. A tender's list-page filter and its detail-page lifecycle stepper are describing two different state machines. This is exactly the mismatch the original audit flagged as high priority, and it's unchanged.

3. **No sortable table columns anywhere.** Confirmed zero sort affordances (`onClick`+sort, `ArrowUpDown`, sortable headers) in `tenders-table.tsx`, `project-list.tsx`, or `po-list.tsx`. All three still rely purely on filters + pagination for finding rows.

4. **PO list header still dilutes the primary action.** `projects/purchase-orders/page.tsx:98` and `:104` render both "Add Project" and "Add Purchase Order" as header actions on the PO list page. A user landing here to manage POs is offered an unrelated "Add Project" button with equal visual weight.

5. **Zero `aria-label` attributes across all three modules.** Confirmed via full grep of `components/tenders`, `components/projects`, `components/purchase-orders` — no matches. Most icon-only buttons happen to work anyway because they use an `sr-only` span child (e.g. `tender-action-queue.tsx:469` — "Open menu" — this one is fine), but adoption is inconsistent and at least one instance is a genuine accessibility bug (see new finding #1 below).

6. **PO nested three route-levels under Projects** (`/projects/purchase-orders/...`) rather than being a peer top-level module, despite being one of the three areas this audit is centered on. Unchanged from original audit — still worth a product decision, not just a UI fix.

7. **No route-level `loading.tsx`/`error.tsx`.** Still zero in `tenders/`, `projects/`, or `projects/purchase-orders/` route folders. Loading/error UI is entirely ad hoc per component.

8. **`StatusBadge` vs. raw `Badge` inconsistency.** 8 raw `<Badge` usages found across `tender-details.tsx`, `project-workspace.tsx`, `project-action-queue.tsx`, `project-line-items-list.tsx` alongside `StatusBadge` imports in the same files — some status/label chips bypass the centralized tone system.

## New Findings (not in the original audit)

1. **Confirmed accessibility bug: unlabeled icon-only link in Project Workspace.** `project-workspace.tsx:1005-1009`:
   ```tsx
   <Link href={`/projects/purchase-orders/${po.id}`}>
     <Button variant="ghost" size="icon" className="h-7 w-7">
       <ArrowRight className="h-3.5 w-3.5" />
     </Button>
   </Link>
   ```
   Neither the `Link` nor the `Button` has any text content, `aria-label`, or `sr-only` span. A screen reader announces this as an unlabeled "link, button" with no indication it opens a specific PO. Same pattern to check at `project-workspace.tsx:1151` (`h-8 w-8` icon button, needs direct inspection — not yet confirmed fixed or broken).

2. **Duplicated, unused design-system package.** `packages/ui/src/components/ui/` (shadcn primitives + a `page-header.tsx`) exists in the monorepo but `apps/tracker` never imports `@pmg/ui` — it maintains a fully separate copy of every primitive in `apps/tracker/src/components/ui/`. Any token or component fix (including the `StatusBadge`/color-token fixes recommended above) currently has to be made once, in the app-local copy, while the "shared" package silently drifts out of sync. Worth a decision: either wire `apps/tracker` to consume `@pmg/ui`, or stop treating `packages/ui` as the design-system source of truth in planning docs.

3. **Fixes are landing unevenly across the three modules.** Every fix confirmed above (alert/confirm removal, URL-synced filters, mobile line-item cards, health metrics) shipped in exactly one module or one specific page, not as a shared pattern rolled out to all three. E.g., PO list now has supplier/project filters and URL sync; Tenders and Projects lists don't. This matches the original audit's root diagnosis ("uneven maturity across modules") and suggests future fixes should be built as shared components/hooks first, then adopted by all three, rather than solved locally per module — otherwise this gap reopens every time one module gets attention and the others don't.

## Priority Action Plan (Tenders / Projects / POs only)

**P0 — do first, small and mechanical:**
- Fix the unlabeled `ArrowRight` link/button in `project-workspace.tsx:1005-1009` (and verify line 1151) — add `aria-label="View purchase order"` or an `sr-only` span.
- Remove the "Add Project" button from the PO list page header (`projects/purchase-orders/page.tsx:98`); keep "Add Purchase Order" as the sole primary action.
- Reconcile the tender status model: either collapse the list-page filter options to match `TENDER_LIFECYCLE`, or explicitly map the 3 filter buckets to the 7 lifecycle stages with visible sub-labels.

**P1 — structural, higher effort, highest leverage:**
- Split `project-workspace.tsx` into per-tab components (overview / POs / items / deliveries / documents / activity / risks / close-out) and replace all hardcoded `text-{color}-600` usages with `StatusBadge` tones or theme tokens.
- Add sortable column headers to `tenders-table.tsx`, `project-list.tsx`, `po-list.tsx` (shared sort-header component, one implementation, three consumers).
- Port the PO list's URL-synced filter pattern (search/status/supplier/project/date range) to Tenders and Projects lists so all three modules have equivalent filter power — this is the single highest-leverage item since the pattern already exists and works, it just needs to be extracted and reused.

**P2 — worth deciding, not urgent:**
- Product decision: keep POs nested under `/projects/purchase-orders` or promote to a top-level `/purchase-orders` route.
- Decide the fate of `packages/ui`: adopt it in `apps/tracker` or stop maintaining it as a parallel copy.
- Add route-level `loading.tsx`/`error.tsx` for `tenders/`, `projects/`, and `projects/purchase-orders/` so loading/error UX stops being reimplemented per component.

## Verification Method

Every claim in the "Fixed" and "Still Open" tables above was checked directly against source in this pass (not inferred from the original audit) using targeted `grep`/file reads against the current `apps/tracker/src` tree as of this branch's HEAD. Line numbers are accurate as of commit `6562939`.
