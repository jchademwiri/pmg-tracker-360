# Mobile Responsiveness Audit

## Overall Mobile Readiness

Tracker has meaningful mobile support:

- Dashboard layout adds bottom padding.
- `MobileBottomNav` exists.
- Tender, Project, PO, and Client lists use mobile cards or card variants.
- PO detail has `MobileActionBar`.
- PO list has `MobileFilterDrawer`.

The main risk is dense operational data entry. Tables are fine for scanning on desktop, but PO line items and delivery note quantities need mobile-specific edit patterns.

## High-Priority Mobile Issues

### Dense Editable Tables

Affected routes:

- `/projects/purchase-orders/create`
- `/projects/purchase-orders/[id]/edit`
- `/projects/purchase-orders/[id]/deliveries/new`
- `/projects/purchase-orders/[id]`
- `/projects/[id]/items`

Problem:

Line-item and delivery tables have many columns and inputs. Horizontal scrolling is technically responsive but not ergonomic for field work.

Recommendation:

Use mobile item cards:

- Item title and identifier
- Ordered quantity
- Previously delivered
- Outstanding
- Delivered quantity input
- Unit price and subtotal
- Inline error

Priority: High.

### Header Action Overload

Affected routes:

- `/dashboard`
- `/projects`
- `/projects/[id]`
- `/projects/purchase-orders/[id]`
- `/tenders/[id]`

Problem:

Multiple header buttons wrap and push content down.

Recommendation:

On mobile, show one primary action and move secondary actions into an overflow menu or sticky action bar.

Priority: High.

### Lifecycle Steppers

Affected routes:

- `/tenders/[id]`
- `/projects/purchase-orders/create`
- `/tenders/create`

Problem:

Steppers can become cramped or require horizontal scrolling.

Recommendation:

Use compact vertical progress or "Step X of Y" header on mobile, with the full stepper hidden behind a details control.

Priority: Medium.

### Tabs and Workspace Navigation

Affected routes:

- `/projects/[id]`
- `/tenders/[id]`
- `/projects/purchase-orders/[id]`
- `/settings/profile`

Problem:

Tabs can overflow. Project workspace uses horizontal button tabs with counts, which is functional but visually heavy.

Recommendation:

Use scrollable tabs with visible affordance, or a mobile section selector for deep pages.

Priority: Medium.

## Mobile Route Notes

### Tender Register

- Current: Good mobile cards.
- Improve: Add mobile filter drawer matching PO list, active filter count, and saved views.
- Priority: High.

### Project List

- Current: Good mobile cards with progress.
- Improve: Replace custom dark progress styles with shared accessible progress.
- Priority: Medium.

### PO List

- Current: Best mobile filter pattern in the app.
- Improve: Add project/supplier filters and URL sync.
- Priority: Medium.

### Client List

- Current: Custom mobile card.
- Improve: Use shared `MobileCard` for consistent action menu and spacing.
- Priority: Low to Medium.

### Project Workspace

- Current: Rich but visually heavy.
- Improve: Standardize header, collapse secondary actions, keep action bar for mobile.
- Priority: High.

### Delivery Note Form

- Current: Desktop-oriented table.
- Improve: Mobile item cards and sticky submit summary.
- Priority: High.

## Accessibility on Mobile

Recommendations:

- Ensure 44px minimum touch targets for icon buttons and row actions.
- Avoid text smaller than 12px in dense dashboard areas.
- Use text labels next to color-coded statuses.
- Keep focus visible in mobile drawers/dialogs.
- Ensure sticky action bars do not cover form controls or validation messages.
- Make all action buttons describe the target record, especially in repeated cards.

