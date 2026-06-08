# Tracker App — Dashboard Module Audit

**Area:** Dashboard  
**Priority:** 🟡 Medium  
**Est. Effort:** 0.5 day  
**Related Issues:** #9

---

## Dashboard Module

### Current State
- Role-based views: `AdminView` vs `SpecialistView`
- Quick action buttons: Create Tender, Create PO, Create Project, Create Client
- Permission-gated buttons using `auth.api.hasPermission()`
- Proper skeleton loading states
- Session validation with redirect logic

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟡 Medium | **Dynamic import pattern** — Uses `const { auth } = await import('@/lib/auth')` inside the component body. This is unusual and may cause issues with tree-shaking. |
| 2 | 🟡 Medium | **Too many create buttons** — Four "Create" buttons in the header may overwhelm new users. Consider a dropdown or command palette. |
| 3 | 🟢 Low | **No welcome personalization** — Dashboard greeting is generic. Could include user's name and last activity. |

### Suggestions
- Move auth import to module level
- Consolidate create actions into a dropdown menu
- Add personalized greeting with last login time

---

## Files to Modify

- `apps/tracker/src/app/(dashboard)/dashboard/page.tsx` — Dashboard page
