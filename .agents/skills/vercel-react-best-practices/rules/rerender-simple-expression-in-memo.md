---
title: Do not wrap a simple expression with a primitive result type in useMemo
impact: LOW-MEDIUM
impactDescription: wasted computation on every render
tags: rerender, useMemo, optimization
---

## Do not wrap a simple expression with a primitive result type in useMemo

When an expression is simple (few logical or arithmetical operators) and has a primitive result type (boolean, number, string), do not wrap it in `useMemo`.
Calling `useMemo` and comparing hook dependencies may consume more resources than the expression itself.

**Incorrect:**

```tsx
function Header({ user, notifications }: Props) {
  const isLoading = useMemo(() => {
    return user.isLoading || notifications.isLoading
  }, [user.isLoading, notifications.isLoading])

  if (isLoading) return <Skeleton />
  // return some markup
}
```

**Correct:**

```tsx
function Header({ user, notifications }: Props) {
  const isLoading = user.isLoading || notifications.isLoading

  if (isLoading) return <Skeleton />
  // return some markup
}
```

---

## Project Status: Tracker 360 Monorepo

**Last Updated:** April 29, 2026  
**Stack:** Next.js 16.2.4 · React 19 · Tailwind CSS v4 · Drizzle ORM · Neon PostgreSQL · Better Auth (Phase 4) · Bun · Turborepo

---

### ✅ What Has Been Done

#### Phase 1 — Foundation
- Monorepo scaffolded with Turborepo + Bun
- 3 apps: `apps/tracker` (port 3000), `apps/admin` (port 3001), `apps/docs` (port 3002)
- Shared packages: `@repo/eslint-config`, `@repo/typescript-config`

#### Phase 2 — Database (`@pmg/db`)
- Drizzle ORM + `@neondatabase/serverless` connected to Neon PostgreSQL
- **21 tables** live in Neon: `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`, `notification`, `notification_preferences`, `security_audit_log`, `session_tracking`, `ownership_transfer`, `tender`, `client`, `project`, `purchase_order`, `tender_extension`, `document`, `waitlist`, `feedback`, `support_tickets`
- Indexes on all soft-delete and status columns
- `drizzle.config.ts` configured; migrations in sync
- `dev` script runs Drizzle Studio on port 4983

#### Phase 3 — UI Package (`@pmg/ui`)
- Renamed `@repo/ui` → `@pmg/ui`
- **18 shadcn-style UI components** (base style, neutral, Tailwind v4 CSS variables):
  `alert`, `avatar`, `badge`, `breadcrumb`, `button`, `card`, `checkbox`, `collapsible`, `confirmation-dialog`, `dialog`, `dropdown-menu`, `error-boundary`, `error-state`, `file-uploader`, `form`, `input`, `label`, `loading-spinner`, `logout`, `metric-card`, `progress`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `tooltip`
- **5 shared brand components:** `logo`, `page-header`, `theme-toggle`, `sidebar`, `nav-bar`
- **1 hook:** `use-mobile`
- `src/styles/globals.css` — shared base: `@theme` brand tokens (navy/gold) + shadcn CSS vars + OS dark mode + `.dark`/`.light` class overrides + pointer cursor on all interactive elements
- **Per-app theming:** each app imports base then overrides CSS variables only
  - `apps/tracker` — navy primary, gold accent, navy sidebar
  - `apps/admin` — slate primary, gold accent, dark slate sidebar
- `tailwindcss-animate` installed per-app (not in shared base) to avoid Turbopack resolution issues
- `next-themes` ThemeProvider wired into tracker root layout

#### Phase 5 — Tracker App (migrated from `github.com/jchademwiri/tender-track-360`)
- Full app migrated into `apps/tracker/src/`
- **Auth fully stubbed** — all `auth.api.getSession` / `hasPermission` calls replaced with stub returns; no redirects to `/login` or `/onboarding`; `checkUserSession` returns hardcoded dev user + `stub-org-id`
- **36 routes** building and serving:
  - Dashboard, Tenders (list/detail/create/overview/submitted), Clients, Projects, Purchase Orders (top-level route), Calendar, Reports, Settings, Organization management
- **Server actions** wired to real Neon DB: tenders, clients, projects, purchase orders (full CRUD + soft delete)
- **Logo** — `public/logo.svg` (full) and `public/logo-icon.svg` (icon) added; wired into sidebar and NavBar
- **Notifications settings** — replaced with "Coming Soon" stub (email/push not configured yet)
- **Security Recommendations / 2FA** section removed from profile settings
- **Purchase Orders** moved to top-level route `/dashboard/purchase-orders`
- Zod v4 `.errors` → `.issues` migration applied across all server files
- `proxy.ts` replaces deprecated `middleware.ts`

---

### 🔲 What Needs To Be Done Next

#### Immediate (before Phase 4 Auth)
- [ ] **Create real organization in DB** — the stub uses `stub-org-id` which doesn't exist in Neon; tenders/clients/projects queries return empty because no matching org. Either seed a real org row or wire onboarding to create one
- [ ] **Test all CRUD flows** — create a tender, client, project, PO end-to-end with real data
- [ ] **Fix `dashboad-links.ts` typo** — rename to `dashboard-links.ts`
- [ ] **Wire the old app's sidebar** — `AppSidebar` from `src/components/shared/navigation/` uses the collapsible shadcn sidebar; the current `DashboardShell` uses a simpler custom sidebar. Decide which to keep
- [ ] **`apps/admin`** — Phase 6 not started; admin app still has default Next.js page

#### Phase 4 — Auth (`@pmg/auth`)
- [ ] Create `packages/auth/` with Better Auth + Drizzle adapter
- [ ] Wire `user`, `session`, `account`, `verification` tables from `@pmg/db`
- [ ] Enable `organization` plugin
- [ ] Replace all auth stubs in `apps/tracker/src/lib/auth.ts` and `session-check.ts`
- [ ] Add login/register pages (already scaffolded, just need real auth wired)
- [ ] Middleware route protection in `proxy.ts`

#### Phase 6 — Admin App
- [ ] Build admin dashboard (stats, user management, audit logs)
- [ ] Restrict to `owner`/`admin` roles

#### Phase 7 — Docs
- [ ] Write user guides in `apps/docs`

#### Phase 8 — Deployment
- [ ] Vercel projects for tracker, admin, docs
- [ ] Environment variables configured
- [ ] Production DATABASE_URL (unpooled for migrations)

---

### Known Stubs (to replace in Phase 4)
| File | What's stubbed |
|------|---------------|
| `src/lib/auth.ts` | All `auth.api.*` methods return null/true |
| `src/lib/session-check.ts` | Returns hardcoded dev user + `stub-org-id` |
| `src/server/users.ts` | `getCurrentUser` returns hardcoded user; sign-in/up are no-ops |
| `src/server/permissions.ts` | `checkIfAdmin` always returns `true` |
| `src/lib/storage.ts` | All file upload/download methods are no-ops |
| `src/lib/auth-client.ts` | `signOut` clears localStorage only |
| `src/app/onboarding/` | Creates org in DB but session not real |
