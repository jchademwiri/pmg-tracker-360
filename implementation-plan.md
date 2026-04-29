# Tracker 360 Monorepo - Integrated Implementation Plan

**Status:** Phase 1 ✅ | Phase 2 ✅ | Phase 3 🔄 In Progress | Phases 4-8 🔲  
**Duration:** 3-4 weeks to production-ready  
**Last Updated:** April 29, 2026

---

## Executive Summary

Your monorepo foundation is solid. This integrated plan consolidates all tasks into 8 executable phases with clear dependencies, deliverables, and decision points.

**Critical Path:** Database → UI Package → Auth → Features → Deployment

---

## Auth Recommendation: 🎯 SHARED AUTH PACKAGE

### Why Shared Auth (Not Per-App)

**✅ Recommended: `@pmg/auth` Package**
- **Single source of truth** for user sessions, roles, permissions
- **Consistent UX** - users authenticate once, access both tracker & admin
- **Easier maintenance** - one auth system, not two
- **Better security** - centralized token validation, revocation
- **South African compliance** - single audit trail
- **Tracker 360 brand** - seamless experience across properties

**Implementation:**
```
Shared Database (@pmg/db)
    ↓
Shared Auth (@pmg/auth) ← Uses users table from @pmg/db
    ↓
    ├→ apps/tracker (uses @pmg/auth)
    └→ apps/admin (uses @pmg/auth)
```

**Tech Stack:**
- **Provider:** Better Auth (TypeScript-first, modern)
- **Session Storage:** Database (@pmg/db - users table)
- **Tokens:** JWT + HTTP-only cookies
- **RBAC:** Role-based via database (owner, admin, manager, member)

**Rejected Alternative: Per-App Auth**
- ❌ Duplicate authentication logic
- ❌ User friction (login twice?)
- ❌ Session sync complexity
- ❌ Hard to enforce consistent roles

---

## Current State

### Apps Layer
```
apps/
├── docs/                    ✅ Astro Starlight (port 3002)
├── admin/                   ✅ Next.js 16.2.4 (port 3001) + @pmg/ui + slate theme
└── tracker/                 ✅ Next.js 16.2.4 (port 3000) + @pmg/ui + navy theme
```

### Packages Layer
```
packages/
├── db/                      ✅ @pmg/db — Drizzle ORM + Neon PostgreSQL (21 tables)
├── ui/                      🔄 @pmg/ui — 11 shadcn components, brand CSS, in progress
├── eslint-config/           ✅ @repo/eslint-config
└── typescript-config/       ✅ @repo/typescript-config
```

### Tech Stack (Confirmed)
- **Package Manager:** Bun 1.3.11
- **Monorepo Tool:** Turbo 2.9.6
- **Framework:** Next.js 16.2.4, React 19.2.4, Astro 6.1.9
- **CSS:** Tailwind CSS 4 + @tailwindcss/postcss (CSS-first, no tailwind.config.ts)
- **TypeScript:** 5.9.2 (strict mode)
- **Database:** Neon PostgreSQL (21 tables live)

---

## 8-Phase Implementation Roadmap

---

### Phase 1: Foundation ✅ COMPLETE
**Duration:** ~1 day  
**Status:** ✅ Verified

#### Deliverables
- [x] Web app removed
- [x] 3 apps created (docs, admin, tracker)
- [x] Turborepo workspace configured
- [x] ESLint & TypeScript configs in place
- [x] All apps use Next.js 16 + React 19 + Tailwind 4
- [x] Dev ports set: tracker=3000, admin=3001, docs=3002

---

### Phase 2: Database Package (`@pmg/db`) ✅ COMPLETE
**Duration:** 2-3 days  
**Status:** ✅ Complete — all 21 tables live in Neon

#### What Was Built
- Drizzle ORM + `@neondatabase/serverless` client
- 21 tables pushed to Neon PostgreSQL
- Migrations generated and in sync
- Drizzle Studio wired to `dev` script (runs on port 4983)
- `db:reset` script for development resets

#### Package Structure
```
packages/db/
├── src/
│   ├── schema.ts       ✅ 21 tables + relations
│   ├── client.ts       ✅ Neon + Drizzle client
│   └── index.ts        ✅ Exports
├── scripts/
│   └── reset-db.ts     ✅ Dev reset utility
├── migrations/         ✅ 0000 + 0001 generated
├── drizzle.config.ts   ✅ Configured
├── package.json        ✅ @pmg/db
└── tsconfig.json       ✅
```

#### Tables in Neon (21 total)
**Auth & Users:** `user`, `session`, `account`, `verification`  
**Organisations:** `organization`, `member`, `invitation`  
**Notifications:** `notification`, `notification_preferences`  
**Security:** `security_audit_log`, `session_tracking`, `ownership_transfer`  
**Tender Management:** `tender`, `client`, `project`, `purchase_order`, `tender_extension`, `document`  
**Other:** `waitlist`, `feedback`, `support_tickets`

#### Indexes Added
- `client` — `organization_id`, `deleted_at`
- `tender` — `organization_id`, `status`, `submission_date`, `evaluation_date`, `deleted_at`
- `project` — `organization_id`, `status`, `tender_id`, `deleted_at`
- `purchase_order` — `organization_id`, `project_id`, `status`, `deleted_at`

#### Scripts
```bash
bun run generate    # Generate migration from schema changes
bun run migrate     # Apply migrations
bun run push        # Push schema directly to Neon (dev)
bun run studio      # Open Drizzle Studio
bun run dev         # Alias for studio (runs in turbo dev)
bun run db:reset    # ⚠️ Drop all tables (dev only)
bun run check-types # TypeScript check
```

---

### Phase 3: UI Package (`@pmg/ui`) 🔄 IN PROGRESS
**Duration:** 2-3 days  
**Depends On:** Phase 2 ✅  
**Blocks:** Phases 5-6 (apps need components)

#### Key Decisions (Confirmed)
- **No `tailwind.config.ts`** — Tailwind v4 is CSS-first; all theming via `@theme` and CSS variables
- **shadcn style:** `default` (base)
- **Base color:** `neutral`
- **Dark mode:** OS default (`prefers-color-scheme`) + optional `ThemeToggle` via `next-themes`
- **Package name:** `@pmg/ui`
- **Per-app theming:** Each app has its own `globals.css` that imports `@pmg/ui/styles/globals.css` and overrides only what it needs
- **`@plugin "tailwindcss-animate"`** lives in each app's `globals.css` (not in the shared base) to ensure local resolution by Turbopack

#### What's Done ✅
- [x] Package renamed `@repo/ui` → `@pmg/ui`
- [x] `src/styles/globals.css` — shared base: `@theme` brand tokens + shadcn CSS vars + OS dark mode + `.dark`/`.light` class overrides
- [x] `src/lib/utils.ts` — `cn()` helper
- [x] `src/components/ui/button.tsx`
- [x] `src/components/ui/input.tsx`
- [x] `src/components/ui/label.tsx`
- [x] `src/components/ui/card.tsx`
- [x] `src/components/ui/badge.tsx`
- [x] `src/components/ui/separator.tsx`
- [x] `src/components/ui/skeleton.tsx`
- [x] `src/components/ui/avatar.tsx`
- [x] `src/components/ui/dialog.tsx`
- [x] `src/components/ui/dropdown-menu.tsx`
- [x] `src/components/ui/select.tsx`
- [x] `src/components/shared/logo.tsx` — Tracker 360 brand mark, 3 sizes
- [x] `src/components/shared/page-header.tsx` — title + description + action slot
- [x] `apps/tracker/src/app/globals.css` — navy-gold theme (imports base, overrides primary/accent/sidebar)
- [x] `apps/admin/src/app/globals.css` — slate-gold theme (imports base, overrides primary/accent/sidebar)
- [x] `@pmg/ui` added as dependency in both apps
- [x] `tailwindcss-animate` installed in `@pmg/ui`, `apps/tracker`, `apps/admin`
- [x] TypeScript check passes (`tsc --noEmit` clean)

#### Still To Do 🔲
- [ ] `src/components/ui/table.tsx`
- [ ] `src/components/ui/tabs.tsx`
- [ ] `src/components/ui/alert.tsx`
- [ ] `src/components/ui/sheet.tsx`
- [ ] `src/components/ui/tooltip.tsx`
- [ ] `src/components/ui/sonner.tsx` (toast notifications)
- [ ] `src/components/ui/form.tsx` (react-hook-form integration)
- [ ] `src/hooks/use-mobile.ts` — responsive hook
- [ ] `src/components/shared/theme-toggle.tsx` — Sun/Moon/System using `next-themes`
- [ ] `src/components/shared/sidebar.tsx` — collapsible nav, Sheet on mobile
- [ ] `src/components/shared/nav-bar.tsx` — top nav with logo, links, user menu, ThemeToggle
- [ ] Wire `next-themes` `ThemeProvider` into both app root layouts
- [ ] `components.json` in `packages/ui`, `apps/tracker`, `apps/admin`
- [ ] Test all component imports in apps
- [ ] Run `bun run check-types` across all packages

#### Folder Structure (Target)
```
packages/ui/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   │   ├── alert.tsx         🔲
│   │   │   ├── avatar.tsx        ✅
│   │   │   ├── badge.tsx         ✅
│   │   │   ├── button.tsx        ✅
│   │   │   ├── card.tsx          ✅
│   │   │   ├── dialog.tsx        ✅
│   │   │   ├── dropdown-menu.tsx ✅
│   │   │   ├── form.tsx          🔲
│   │   │   ├── input.tsx         ✅
│   │   │   ├── label.tsx         ✅
│   │   │   ├── select.tsx        ✅
│   │   │   ├── separator.tsx     ✅
│   │   │   ├── sheet.tsx         🔲
│   │   │   ├── skeleton.tsx      ✅
│   │   │   ├── sonner.tsx        🔲
│   │   │   ├── table.tsx         🔲
│   │   │   ├── tabs.tsx          🔲
│   │   │   └── tooltip.tsx       🔲
│   │   └── shared/
│   │       ├── logo.tsx          ✅
│   │       ├── nav-bar.tsx       🔲
│   │       ├── page-header.tsx   ✅
│   │       ├── sidebar.tsx       🔲
│   │       └── theme-toggle.tsx  🔲
│   ├── hooks/
│   │   └── use-mobile.ts         🔲
│   ├── lib/
│   │   └── utils.ts              ✅
│   └── styles/
│       └── globals.css           ✅
├── package.json                  ✅ @pmg/ui
└── tsconfig.json                 ✅
```

#### Per-App Theming (Implemented)
Each app imports the shared base then overrides only its CSS variables. To change a theme, edit only the app's `globals.css` — nothing else.

```
@pmg/ui/src/styles/globals.css     ← shared base (brand @theme + neutral shadcn tokens)
    ↓ @import
apps/tracker/src/app/globals.css   ← navy primary, gold accent, navy sidebar
apps/admin/src/app/globals.css     ← slate primary, gold accent, dark slate sidebar
```

To change admin theme: open `apps/admin/src/app/globals.css`, change the `oklch()` hue value in `:root`. That's it.

---

### Phase 4: Authentication Package (`@pmg/auth`) 🔲
**Duration:** 2-3 days  
**Depends On:** Phase 2 ✅, Phase 3 🔄  
**Blocks:** Phases 5-6 (apps need auth)

#### Goals
- Create shared auth package using Better Auth
- Implement email/password login + registration
- Configure HTTP-only cookie sessions
- Setup role-based access control (RBAC) using `member.role` enum
- Create Next.js middleware for route protection in both apps

#### Folder Structure
```
packages/auth/
├── src/
│   ├── server.ts           # Better Auth instance + Drizzle adapter
│   ├── client.ts           # Client-side auth helpers
│   ├── middleware.ts       # Next.js route protection
│   ├── rbac.ts             # Role/permission helpers
│   ├── types.ts            # Shared types
│   └── index.ts
├── package.json            # @pmg/auth
├── tsconfig.json
└── .env.example
```

#### `package.json`
```json
{
  "name": "@pmg/auth",
  "version": "0.1.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./client": "./src/client.ts",
    "./server": "./src/server.ts",
    "./middleware": "./src/middleware.ts"
  },
  "dependencies": {
    "better-auth": "^1.2.0",
    "@pmg/db": "*",
    "next": "^16.0.0"
  },
  "devDependencies": {
    "@repo/typescript-config": "*",
    "typescript": "5.9.2"
  }
}
```

#### Better Auth Setup (`src/server.ts`)
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { db, schema } from "@pmg/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  plugins: [organization()],
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  appName: "Tracker 360",
  secret: process.env.BETTER_AUTH_SECRET,
  basePath: "/api/auth",
  trustedOrigins: [
    process.env.TRACKER_URL ?? "http://localhost:3000",
    process.env.ADMIN_URL ?? "http://localhost:3001",
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
```

#### RBAC (`src/rbac.ts`)
Roles from `member.role` enum: `owner`, `admin`, `manager`, `member`

#### Tasks
- [ ] Create `packages/auth/` directory & files
- [ ] Install Better Auth + configure Drizzle adapter
- [ ] Wire `user`, `session`, `account`, `verification` tables from `@pmg/db`
- [ ] Enable `organization` plugin (maps to existing `organization`/`member` tables)
- [ ] Create RBAC helpers
- [ ] Create Next.js middleware for both apps
- [ ] Add `BETTER_AUTH_SECRET` to `.env.local`
- [ ] Test: register → login → session → logout
- [ ] Integrate into both apps

---

### Phase 5: Tracker App Features 🔲
**Duration:** 4-5 days  
**Depends On:** Phases 2 ✅, 3 🔄, 4 🔲

#### Goals
- Build tender management (list, detail, create, edit)
- Build project & PO management
- Build invoice tracking
- Connect to `@pmg/db` and `@pmg/auth`

#### Folder Structure
```
apps/tracker/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (public)/
│   │   ├── page.tsx
│   │   └── tenders/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   ├── (protected)/
│   │   ├── dashboard/page.tsx
│   │   ├── tenders/page.tsx
│   │   ├── projects/page.tsx
│   │   ├── purchase-orders/page.tsx
│   │   ├── invoices/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   └── auth/[...auth]/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── lib/
│   ├── actions.ts
│   └── queries.ts
├── middleware.ts
└── types.ts
```

#### Tasks
- [ ] Setup auth API route (`/api/auth/[...auth]`)
- [ ] Add `ThemeProvider` to root layout
- [ ] Build login/register pages using `@pmg/ui` components
- [ ] Build dashboard page
- [ ] Build tender list + detail pages
- [ ] Build project management pages
- [ ] Build PO management pages
- [ ] Build invoice tracking pages
- [ ] Add Zod form validation
- [ ] Add error handling & loading states
- [ ] Test all flows end-to-end

---

### Phase 6: Admin App Features 🔲
**Duration:** 3-4 days  
**Depends On:** Phases 2 ✅, 3 🔄, 4 🔲

#### Goals
- Build admin dashboard (stats, overview)
- User & organisation management
- Audit log viewer
- System settings
- Restrict to `owner`/`admin` roles only

#### Folder Structure
```
apps/admin/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (protected)/
│   │   ├── dashboard/page.tsx
│   │   ├── users/page.tsx
│   │   ├── users/[id]/page.tsx
│   │   ├── organisations/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── logs/page.tsx
│   │   ├── reports/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   └── auth/[...auth]/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
├── lib/
│   ├── actions.ts
│   ├── queries.ts
│   └── permissions.ts
├── middleware.ts
└── types.ts
```

#### Pages to Build
1. **Dashboard** — stats cards, recent activity, system health
2. **Users** — table with pagination/search, bulk actions, role management
3. **Organisations** — list, detail, member management
4. **Settings** — system config, email, notifications
5. **Audit Logs** — filterable table, CSV export
6. **Reports** — tender stats, invoice reports, user activity

#### Tasks
- [ ] Setup auth API route + `owner`/`admin` role guard middleware
- [ ] Add `ThemeProvider` to root layout
- [ ] Build login page
- [ ] Build dashboard with stats cards
- [ ] Build users CRUD with data table
- [ ] Build organisations management
- [ ] Build settings form
- [ ] Build audit log viewer with filters
- [ ] Add data export (CSV)
- [ ] Test all flows as admin/owner

---

### Phase 7: Documentation (`apps/docs`) 🔲
**Duration:** 2-3 days  
**Depends On:** Phases 5-6 complete

#### Content Structure
```
src/content/docs/
├── index.mdx
├── getting-started/
│   ├── setup.mdx
│   ├── first-login.mdx
│   └── account-management.mdx
├── tracker-app/
│   ├── searching-tenders.mdx
│   ├── managing-submissions.mdx
│   ├── projects-and-pos.mdx
│   ├── invoice-tracking.mdx
│   └── faq.mdx
├── admin-dashboard/
│   ├── user-management.mdx
│   ├── organisation-management.mdx
│   ├── system-settings.mdx
│   ├── audit-logs.mdx
│   └── reports.mdx
├── api/
│   ├── authentication.mdx
│   ├── tenders.mdx
│   ├── projects.mdx
│   └── purchase-orders.mdx
└── development/
    ├── architecture.mdx
    ├── setup.mdx
    ├── database.mdx
    └── deployment.mdx
```

#### Tasks
- [ ] Write tracker user guide
- [ ] Write admin dashboard guide
- [ ] Document API endpoints
- [ ] Write developer setup guide
- [ ] Create architecture diagrams
- [ ] Configure Starlight search
- [ ] Test all links
- [ ] Deploy to docs.tendertrack360.co.za

---

### Phase 8: Testing & Deployment 🔲
**Duration:** 2-3 days  
**Depends On:** All phases complete

#### Testing Checklist
- [ ] Auth flow (register → login → session → logout)
- [ ] Tender CRUD
- [ ] Project & PO CRUD
- [ ] Invoice tracking
- [ ] Admin user management
- [ ] Audit logging
- [ ] Mobile responsiveness
- [ ] Accessibility (a11y)

#### Security Checklist
- [ ] Environment variables secured (not in git)
- [ ] SQL injection prevention (Drizzle ORM ✅)
- [ ] CSRF protection
- [ ] Rate limiting on auth endpoints
- [ ] HTTPS enforced
- [ ] Security headers (CSP, X-Frame-Options, etc.)

#### Performance
- [ ] Database indexes verified ✅ (done in Phase 2)
- [ ] API response caching
- [ ] Image optimization
- [ ] Bundle size analysis
- [ ] Lighthouse scores > 90

#### Deployment
- [ ] Create 3 Vercel projects:
  - `tendertrack360.co.za` (tracker — port 3000)
  - `admin.tendertrack360.co.za` (admin — port 3001)
  - `docs.tendertrack360.co.za` (docs — port 3002)
- [ ] Configure `DATABASE_URL` + `BETTER_AUTH_SECRET` env vars in Vercel
- [ ] Setup auto-deploy from GitHub
- [ ] Configure preview environments
- [ ] Setup monitoring & alerts

---

## Development Workflow

### Daily Development
```bash
bun run dev
# Tracker:       http://localhost:3000
# Admin:         http://localhost:3001
# Docs:          http://localhost:3002
# Drizzle Studio: http://localhost:4983
```

### Database Operations
```bash
bun run generate    # Generate migration from schema changes
bun run push        # Push schema to Neon (dev)
bun run migrate     # Apply pending migrations
bun run studio      # Open Drizzle Studio at :4983
bun run db:reset    # ⚠️ Drop all tables (dev only)
```

### Type Checking & Linting
```bash
bun run check-types   # Type check all packages
bun run lint          # Lint all
bun run format        # Prettier format
```

---

## Environment Variables

### Root `.env.local`
```bash
# Database (Neon — pooled)
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require

# Database (Neon — direct, for migrations)
DATABASE_URL_UNPOOLED=postgresql://...@neon.tech/neondb?sslmode=require
```

### App-Specific (Phase 4+)
```bash
# Both apps
BETTER_AUTH_SECRET=your-secret-min-32-chars

# apps/tracker/.env.local
NEXTAUTH_URL=http://localhost:3000

# apps/admin/.env.local
NEXTAUTH_URL=http://localhost:3001
```

---

## Timeline

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Foundation | ~1 day | ✅ Complete |
| 2 | Database (`@pmg/db`) | 2-3 days | ✅ Complete |
| 3 | UI Package (`@pmg/ui`) | 2-3 days | 🔄 In Progress |
| 4 | Auth (`@pmg/auth`) | 2-3 days | 🔲 Next |
| 5 | Tracker features | 4-5 days | 🔲 |
| 6 | Admin features | 3-4 days | 🔲 |
| 7 | Documentation | 2-3 days | 🔲 |
| 8 | Testing & Deployment | 2-3 days | 🔲 |
| **Total** | | **~3-4 weeks** | |

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth approach | Shared `@pmg/auth` | Single source of truth, consistent UX |
| Auth provider | Better Auth | TypeScript-first, Drizzle-compatible, org support |
| Database | Neon PostgreSQL | Serverless, free tier, great DX |
| ORM | Drizzle ORM | Type-safe, excellent TS support |
| UI library | shadcn/ui (base style) | Accessible, customizable, no config file |
| Styling | Tailwind CSS v4 | CSS-first, no tailwind.config.ts needed |
| Theming | Per-app CSS variables | Each app overrides only what it needs |
| Dark mode | OS preference + optional toggle | `next-themes` with `defaultTheme="system"` |
| Docs | Astro Starlight | Optimized for docs, searchable, fast |
| Deployment | Vercel | Next.js-first, global CDN |

---

## Success Criteria

| Phase | Criteria | Status |
|-------|----------|--------|
| 1 | 3 apps running, turbo configured | ✅ |
| 2 | 21 tables in Neon, Drizzle queries work, indexes in place | ✅ |
| 3 | 15+ components, themes working in both apps, dark mode functional | 🔄 |
| 4 | Login/register working, sessions persisting, RBAC functional | 🔲 |
| 5 | Tender/project/PO/invoice CRUD working end-to-end | 🔲 |
| 6 | Admin dashboard, user management, audit logs working | 🔲 |
| 7 | All docs written, search functional, no broken links | 🔲 |
| 8 | Lighthouse > 90, security audit passed, deployed to production | 🔲 |

---

## Dependency Graph

```
Phase 1 (Foundation) ✅
    ↓
Phase 2 (Database) ✅
    ↓
Phase 3 (UI) 🔄 ←── finish remaining components
    ↓
Phase 4 (Auth) 🔲 ←── depends on Phase 2 ✅
    ↓
Phase 5 & 6 (Features) 🔲 ←── depend on 2 ✅ + 3 + 4
    ↓
Phase 7 (Docs) 🔲
    ↓
Phase 8 (Deployment) 🔲
```

---

## Next Actions

### Finish Phase 3 (remaining UI components)
```
table, tabs, alert, sheet, tooltip, sonner, form
theme-toggle, sidebar, nav-bar
use-mobile hook
ThemeProvider in both app layouts
components.json files
```

### Then Phase 4 (Auth)
```
packages/auth/ → Better Auth + Drizzle adapter
RBAC using member.role (owner/admin/manager/member)
Middleware for both apps
```

---

**Document Version:** 4.0  
**Owner:** Jacob (PMG)  
**Start Date:** April 29, 2026  
**Expected Completion:** Late May 2026  
**Last Updated:** April 29, 2026
