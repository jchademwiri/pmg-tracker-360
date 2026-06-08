# Cross-Cutting Concerns Audit

**Area:** Error Handling, Loading States, Toasts, Testing, Accessibility, Performance  
**Priority:** 🟡 Medium  
**Est. Effort:** 1-2 days  
**Related Issues:** #10, #25, #26, #27

---

## 1. Error Handling

### Current State
- **Admin:** Uses try/catch with basic error messages. No global error boundary.
- **Tracker:** Has `ErrorBoundary` and `DashboardErrorBoundary` components. Better, but still inconsistent.

### Recommendation
Implement consistent error boundary strategy across both apps:
- Add `ErrorBoundary` to admin console (copy from tracker)
- Ensure all server actions return structured `{ success, error }` results
- Display errors via toast notifications, not inline text

---

## 2. Loading States

### Current State
- **Admin:** Uses `Suspense` with simple text fallbacks ("Loading…").
- **Tracker:** Has proper skeleton components (`DashboardSkeleton`, `Skeleton`).

### Recommendation
Adopt tracker's skeleton pattern in admin console:
- Create skeleton components for each admin page
- Replace text fallbacks with skeleton UIs
- Ensure consistent loading experience

---

## 3. Toast Notifications

### Current State
- **Admin:** No toast notification system. Uses inline error messages.
- **Tracker:** Uses `sonner` for toast notifications.

### Recommendation
Add `sonner` to admin console for consistent feedback:
- Install `sonner` in admin app
- Add `<Toaster />` to admin layout
- Replace inline error messages with `toast.error()`
- Add success toasts for actions (revoke session, update ticket, etc.)

---

## 4. Testing

### Current State
- **Admin:** Has unit tests for `AlertTray`, `DataTable`, `StatusBadge`, `OrgListClient`, `UserListClient`, `actions.test.ts`. Good coverage.
- **Tracker:** Has E2E tests (`login-flow`, `dashboard-navigation`, `landing-page`). No visible unit tests for components.

### Recommendation
- Add unit tests for tracker components (especially tender form, client list, project list)
- Consider shared test utilities between apps
- Add integration tests for server actions

---

## 5. Accessibility

### Current State
- **Admin:** Uses semantic HTML (`<nav>`, `<table>`, proper `scope` on `<th>`). Good.
- **Tracker:** Uses shadcn components which have built-in accessibility. Good.

### Recommendation
Run automated accessibility audit (Lighthouse, axe-core) on both apps:
- Fix any WCAG 2.1 AA violations
- Ensure proper ARIA labels on interactive elements
- Test keyboard navigation throughout

---

## 6. Performance

### Current State
- **Admin:** Server components with parallel data fetching (`Promise.all`). Good.
- **Tracker:** Uses `force-dynamic` on most pages, which prevents static optimization. This is a workaround for `headers()` usage rather than a genuine need for dynamic rendering.

### Recommendation
Audit which pages truly need `force-dynamic`:
- Move session checks to middleware where possible
- Use `cookies()` only where needed
- Enable static generation on public pages (landing, about, etc.)
- Consider adding `revalidatePath` for data-heavy pages

---

## Shared Utilities to Extract

| Utility | Current Location | Suggested Location |
|---------|------------------|--------------------|
| `formatRelativeTime` | Admin `page.tsx`, `SessionsListClient.tsx` | `@/lib/utils` (shared) |
| `formatDate` | Tracker `lib/format.ts` | Already centralized ✓ |
| `getStatusClasses` | Admin `StatusBadge.tsx` | Keep in admin, add to tracker |
| `getInitials` | Admin `OrgDrawer.tsx`, Tracker `settings/page.tsx` | `@/lib/utils` (shared) |

---

## Files to Modify

### Admin
- `apps/admin/src/app/layout.tsx` — Add Toaster, ErrorBoundary
- `apps/admin/src/app/page.tsx` — Extract formatRelativeTime
- `apps/admin/src/components/` — Add skeleton components

### Tracker
- `apps/tracker/src/app/(dashboard)/` — Audit force-dynamic usage
- `apps/tracker/src/components/` — Add unit tests
