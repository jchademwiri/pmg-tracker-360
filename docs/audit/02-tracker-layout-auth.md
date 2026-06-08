# Tracker App — Layout, Auth & Onboarding Audit

**Area:** Tracker Layout, Authentication, Onboarding  
**Priority:** 🟡 Medium  
**Est. Effort:** 1 day  
**Related Issues:** #19, #20

---

## Root Layout & Navigation

### Current State
- shadcn/ui SidebarProvider with collapsible sidebar
- Dynamic breadcrumb navigation
- Notification bell with unread count
- Theme switcher (dark/light/system)
- Beta label and help widget
- Full SEO metadata with OpenGraph and JSON-LD

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟡 Medium | **Inconsistent header heights** — Dashboard layout uses `h-16` header with `group-has-data-[collapsible=icon]/sidebar-wrapper:h-12` transition, but the transition may cause layout shifts. |
| 2 | 🟢 Low | **No keyboard shortcut hints** — No visible shortcuts for power users (e.g., Cmd+K for search). |
| 3 | 🟢 Low | **Help widget placement** — The `HelpWidget` is rendered globally but its position may overlap with sidebar on some viewports. |

### Suggestions
- Add a command palette (Cmd+K) for quick navigation
- Verify sidebar collapse transition doesn't cause layout shifts
- Test help widget positioning across breakpoints

---

## Auth Pages (Login, Sign-Up, Forgot Password, etc.)

### Current State
- Consistent decorative gradient backgrounds across all auth pages
- Login with email/password and magic link
- Sign-up with organization creation
- Forgot password, reset password, check-email flows
- Proper session checks and redirects

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟢 Low | **No social login options** — Only email/password auth. Consider adding Google/GitHub OAuth for reduced friction. |
| 2 | 🟢 Low | **No password strength indicator** — Sign-up form doesn't show password requirements or strength. |

### Suggestions
- Consider adding OAuth providers for reduced sign-up friction
- Add password strength indicator on sign-up
- Add terms/privacy links on auth forms

---

## Onboarding

### Current State
- Client-side rendered page with organization list fetch
- CreateOrganizationForm for new org setup
- Loading spinner during organization fetch

### Issues Found
| # | Severity | Issue |
|---|----------|-------|
| 1 | 🟡 Medium | **Client-side data fetching** — Uses `useEffect` to fetch organizations, causing a flash of loading state. Should be server-rendered. |
| 2 | 🟢 Low | **No progress indicator** — Multi-step onboarding (if planned) lacks a progress bar. |

### Suggestions
- Convert to server component with `getCurrentUser()` for initial data
- Add onboarding progress steps if multi-step flow is planned

---

## Files to Modify

- `apps/tracker/src/app/layout.tsx` — Root layout
- `apps/tracker/src/app/(dashboard)/layout.tsx` — Dashboard layout
- `apps/tracker/src/app/(auth)/login/page.tsx` — Login page
- `apps/tracker/src/app/(auth)/sign-up/page.tsx` — Sign-up page
- `apps/tracker/src/app/onboarding/page.tsx` — Onboarding (convert to server component)
- `apps/tracker/src/components/shared/navigation/header.tsx` — Header
