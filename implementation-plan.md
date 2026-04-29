# Tracker 360 Monorepo - Integrated Implementation Plan

**Status:** Phase 1 Complete ✅ | Phase 2 Complete ✅ | Phases 3-8 Ready to Execute  
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
- **RBAC:** Role-based via database (system_admin, user, manager, operator)

**Rejected Alternative: Per-App Auth**
- ❌ Duplicate authentication logic
- ❌ User friction (login twice?)
- ❌ Session sync complexity
- ❌ Hard to enforce consistent roles

---

## Current State ✅

### Apps Layer
```
apps/
├── docs/                    ✅ Astro Starlight
├── admin/                   ✅ Next.js 16.2.4 (needs --port 3001)
└── tracker/                 ✅ Next.js 16.2.4 (needs --port 3000)
```

### Packages Layer
```
packages/
├── ui/                      ✅ Basic components (upgrading to shadcn)
├── eslint-config/           ✅ @repo/eslint-config
└── typescript-config/       ✅ @repo/typescript-config
```

### Tech Stack (Confirmed)
- **Package Manager:** Bun 1.3.5
- **Monorepo Tool:** Turbo 2.9.6
- **Framework:** Next.js 16.2.4, React 19.2.4, Astro 6.1.9
- **CSS:** Tailwind CSS 4 + @tailwindcss/postcss
- **TypeScript:** 5.9.2 (strict mode)
- **Database:** Neon PostgreSQL (free tier)

---

## 8-Phase Implementation Roadmap

### Phase 1: Foundation ✅ COMPLETE
**Duration:** ~1 day (Already Done)
**Status:** ✅ Verified

#### Deliverables
- [x] Web app removed
- [x] 3 apps created (docs, admin, tracker)
- [x] Turborepo workspace configured
- [x] ESLint & TypeScript configs in place
- [x] All apps use Next.js 16 + React 19 + Tailwind 4

#### Immediate Quick Fixes (< 1 hour)
```bash
# 1. Update app dev ports
# apps/admin/package.json
"dev": "next dev --port 3001"

# apps/tracker/package.json
"dev": "next dev --port 3000"

# apps/docs/package.json
"dev": "astro dev --port 3002"

# 2. Create root .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/pmg-tracker-360"

# 3. Verify
bun run dev  # Should start all 3 apps on correct ports
```

---

### Phase 2: Database Package (`@pmg/db`) 🔲
**Duration:** 2-3 days  
**Priority:** CRITICAL (blocks phases 3-7)

#### Goals
- Create `packages/db` with Drizzle ORM
- Define all schemas (users, tenders, POs, invoices, audit logs)
- Test Neon PostgreSQL connection
- Generate & push migrations

#### Deliverables

**Package Structure:**
```
packages/db/
├── src/
│   ├── schema.ts       # All table definitions
│   ├── client.ts       # Neon + Drizzle client
│   └── index.ts        # Exports
├── drizzle.config.ts   # Drizzle Kit config
├── migrations/         # Generated SQL files
├── package.json
├── tsconfig.json
└── .env.example
```

**Complete `package.json`:**
```json
{
  "name": "@pmg/db",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./client": "./src/client.ts",
    "./schema": "./src/schema.ts"
  },
  "scripts": {
    "generate": "drizzle-kit generate",
    "migrate": "drizzle-kit migrate",
    "push": "drizzle-kit push:neon",
    "studio": "drizzle-kit studio",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "drizzle-orm": "^0.38.0",
    "@neondatabase/serverless": "^0.9.0"
  },
  "devDependencies": {
    "@repo/typescript-config": "*",
    "drizzle-kit": "^0.24.0",
    "typescript": "5.9.2",
    "@types/node": "^22.15.3"
  }
}
```

**Database Schema (`src/schema.ts`):**
```typescript
import { 
  pgTable, uuid, varchar, text, timestamp, pgEnum, 
  decimal, integer, boolean, index
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ===== ENUMS =====
export const roleEnum = pgEnum('role', ['system_admin', 'admin', 'manager', 'user']);
export const statusEnum = pgEnum('status', ['draft', 'open', 'closed', 'awarded', 'cancelled']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']);

// ===== CORE TABLES =====

// Users (shared across all apps)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }), // For Better Auth
  role: roleEnum('role').notNull().default('user'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
}));

// Sessions (for Better Auth)
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  tokenIdx: index('sessions_token_idx').on(table.token),
}));

// ===== ADMIN APP TABLES =====

// System settings
export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: text('value').notNull(),
  description: text('description'),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Audit logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 255 }).notNull(),
  resource: varchar('resource', { length: 255 }).notNull(),
  resourceId: uuid('resource_id'),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}));

// ===== TRACKER APP TABLES =====

// Tenders
export const tenders = pgTable('tenders', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 512 }).notNull(),
  description: text('description'),
  department: varchar('department', { length: 255 }).notNull(),
  closingDate: timestamp('closing_date').notNull(),
  budget: decimal('budget', { precision: 15, scale: 2 }),
  estimatedValue: decimal('estimated_value', { precision: 15, scale: 2 }),
  status: statusEnum('status').notNull().default('draft'),
  reference: varchar('reference', { length: 255 }).unique(),
  source: varchar('source', { length: 255 }), // e.g., Ekurhuleni, Msunduzi
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('tenders_status_idx').on(table.status),
  closingDateIdx: index('tenders_closing_date_idx').on(table.closingDate),
  createdByIdx: index('tenders_created_by_idx').on(table.createdBy),
}));

// Purchase Orders
export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  poNumber: varchar('po_number', { length: 255 }).notNull().unique(),
  vendorId: uuid('vendor_id'),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  description: text('description'),
  issueDate: timestamp('issue_date').notNull(),
  dueDate: timestamp('due_date'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('purchase_orders_status_idx').on(table.status),
  poNumberIdx: index('purchase_orders_po_number_idx').on(table.poNumber),
}));

// Invoices
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceNumber: varchar('invoice_number', { length: 255 }).notNull().unique(),
  poId: uuid('po_id').references(() => purchaseOrders.id),
  tenderId: uuid('tender_id').references(() => tenders.id),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  taxAmount: decimal('tax_amount', { precision: 15, scale: 2 }).default('0'),
  status: invoiceStatusEnum('status').notNull().default('draft'),
  issueDate: timestamp('issue_date').notNull(),
  dueDate: timestamp('due_date'),
  paidDate: timestamp('paid_date'),
  notes: text('notes'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  statusIdx: index('invoices_status_idx').on(table.status),
  poIdIdx: index('invoices_po_id_idx').on(table.poId),
}));

// ===== RELATIONS =====

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  auditLogs: many(auditLogs),
  tenders: many(tenders),
  purchaseOrders: many(purchaseOrders),
  invoices: many(invoices),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const tendersRelations = relations(tenders, ({ one, many }) => ({
  creator: one(users, { fields: [tenders.createdBy], references: [users.id] }),
  invoices: many(invoices),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  creator: one(users, { fields: [purchaseOrders.createdBy], references: [users.id] }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  po: one(purchaseOrders, { fields: [invoices.poId], references: [purchaseOrders.id] }),
  tender: one(tenders, { fields: [invoices.tenderId], references: [tenders.id] }),
  creator: one(users, { fields: [invoices.createdBy], references: [users.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));
```

**Client (`src/client.ts`):**
```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

export type Database = typeof db;
```

**Export (`src/index.ts`):**
```typescript
export * from "./client";
export * from "./schema";
export type { Database } from "./client";
```

**Drizzle Config (`drizzle.config.ts`):**
```typescript
import type { Config } from "drizzle-kit";

export default {
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

#### Tasks
- [ ] Create `packages/db/` directory & files
- [ ] Setup Neon PostgreSQL (free tier at neon.tech)
- [ ] Create `.env.local` with `DATABASE_URL`
- [ ] Run `bun install`
- [ ] Generate migrations: `bun run -w db generate`
- [ ] Push schema: `bun run -w db push`
- [ ] Test connection with Drizzle Studio: `bun run -w db studio`
- [ ] Verify all tables created in Neon console

---

### Phase 3: UI Package (`@pmg/ui`) 🔲
**Duration:** 2-3 days  
**Depends On:** Phase 2 ✅  
**Blocks:** Phases 5-6 (apps need components)

#### Goals
- Rename `packages/ui` to `@pmg/ui`
- Initialize shadcn/ui with monorepo support (radix-nova style, neutral base)
- Add 15+ reusable shadcn components
- Implement navy-gold brand theme via CSS `@theme` (Tailwind v4 — no `tailwind.config.ts`)
- Shared `globals.css` in `@pmg/ui` — both apps import it
- OS-based dark mode with optional theme toggle component

#### Key Decisions
- **No `tailwind.config.ts`** — Tailwind v4 is CSS-first; all theming via `@theme` in CSS
- **shadcn style:** `radix-nova`
- **Base color:** `neutral`
- **Dark mode:** OS default (`prefers-color-scheme`) + optional `ThemeToggle` component using `next-themes`
- **Package name:** `@pmg/ui` (consistent with `@pmg/db`, `@pmg/auth`)

#### Folder Structure
```
packages/ui/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn components (installed by CLI)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── form.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── sonner.tsx   # toast notifications
│   │   │   └── tooltip.tsx
│   │   └── shared/          # brand-specific components
│   │       ├── logo.tsx
│   │       ├── page-header.tsx
│   │       ├── sidebar.tsx
│   │       ├── nav-bar.tsx
│   │       └── theme-toggle.tsx
│   ├── hooks/
│   │   └── use-mobile.ts    # responsive hook
│   ├── lib/
│   │   └── utils.ts         # cn() helper
│   └── styles/
│       └── globals.css      # @theme brand tokens + shadcn CSS vars
├── components.json          # shadcn config for this package
├── package.json             # name: @pmg/ui
└── tsconfig.json
```

#### `package.json`
```json
{
  "name": "@pmg/ui",
  "version": "0.1.0",
  "private": true,
  "exports": {
    "./components/*": "./src/components/*.tsx",
    "./hooks/*": "./src/hooks/*.ts",
    "./lib/*": "./src/lib/*.ts",
    "./styles/globals.css": "./src/styles/globals.css"
  },
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "next-themes": "^0.4.6",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.0.0",
    "lucide-react": "^0.511.0"
  },
  "devDependencies": {
    "@repo/eslint-config": "*",
    "@repo/typescript-config": "*",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "tailwindcss": "^4",
    "typescript": "5.9.2"
  }
}
```
> Radix UI primitives are added automatically by the shadcn CLI — do not add them manually.

#### `components.json` (packages/ui)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@pmg/ui/components",
    "utils": "@pmg/ui/lib/utils",
    "hooks": "@pmg/ui/hooks",
    "lib": "@pmg/ui/lib",
    "ui": "@pmg/ui/components/ui"
  }
}
```

#### `components.json` (apps/tracker & apps/admin)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "radix-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "../../packages/ui/src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "hooks": "@/hooks",
    "lib": "@/lib",
    "utils": "@pmg/ui/lib/utils",
    "ui": "@pmg/ui/components/ui"
  }
}
```

#### Brand Theme (`src/styles/globals.css`)
```css
@import "tailwindcss";
@plugin "tailwindcss-animate";

/* ===== BRAND TOKENS ===== */
@theme {
  /* Brand colors — available as bg-brand-navy, text-brand-gold, etc. */
  --color-brand-navy: #1a3a52;
  --color-brand-gold: #d4af37;
  --color-brand-dark: #0f1419;
  --color-brand-light: #f8f9fa;

  /* Fonts */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

/* ===== SHADCN CSS VARIABLES (light) ===== */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
}

/* ===== SHADCN CSS VARIABLES (dark) ===== */
@media (prefers-color-scheme: dark) {
  :root {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
    --card: oklch(0.205 0 0);
    --card-foreground: oklch(0.985 0 0);
    --popover: oklch(0.205 0 0);
    --popover-foreground: oklch(0.985 0 0);
    --primary: oklch(0.985 0 0);
    --primary-foreground: oklch(0.205 0 0);
    --secondary: oklch(0.269 0 0);
    --secondary-foreground: oklch(0.985 0 0);
    --muted: oklch(0.269 0 0);
    --muted-foreground: oklch(0.708 0 0);
    --accent: oklch(0.269 0 0);
    --accent-foreground: oklch(0.985 0 0);
    --destructive: oklch(0.704 0.191 22.216);
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: oklch(0.556 0 0);
  }
}

/* ===== OPTIONAL THEME TOGGLE (class-based override) ===== */
/* When ThemeToggle forces dark, .dark class on <html> overrides OS preference */
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}

.light {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
}
```

#### Theme Toggle Setup
- `next-themes` provider wraps each app's root layout with `attribute="class"` and `defaultTheme="system"`
- `ThemeToggle` component in `@pmg/ui/components/shared/theme-toggle.tsx` cycles light → dark → system
- OS preference is always the default; the toggle is purely optional for users

#### Each App's `globals.css`
```css
/* Import shared brand theme + shadcn tokens from @pmg/ui */
@import "@pmg/ui/styles/globals.css";

/* App-specific overrides only below this line */
```

#### shadcn Components to Install (via CLI in each app)
```bash
# Run from apps/tracker or apps/admin
npx shadcn@latest add button input card form dialog dropdown-menu \
  table tabs select badge alert avatar separator sheet skeleton \
  sonner tooltip
```

#### Brand Components (`src/components/shared/`)

**`logo.tsx`** — Tracker 360 brand mark, 3 sizes  
**`page-header.tsx`** — Title + description + optional action slot  
**`sidebar.tsx`** — Collapsible nav sidebar using shadcn Sheet on mobile  
**`nav-bar.tsx`** — Top nav with logo, links, user menu, ThemeToggle  
**`theme-toggle.tsx`** — Sun/Moon/System icon button using `next-themes`

#### Tasks
- [ ] Rename package: `@repo/ui` → `@pmg/ui` in `package.json`
- [ ] Update all workspace references from `@repo/ui` to `@pmg/ui`
- [ ] Initialize shadcn in `packages/ui`: `npx shadcn@latest init`
- [ ] Create `components.json` in `packages/ui`, `apps/tracker`, `apps/admin`
- [ ] Create `src/styles/globals.css` with brand `@theme` tokens + shadcn CSS vars
- [ ] Update each app's `globals.css` to `@import "@pmg/ui/styles/globals.css"`
- [ ] Add `next-themes` to `@pmg/ui` dependencies
- [ ] Install 15+ shadcn components via CLI
- [ ] Build brand components (logo, page-header, sidebar, nav-bar, theme-toggle)
- [ ] Create `src/lib/utils.ts` with `cn()` helper
- [ ] Update `package.json` exports to expose components, hooks, lib, styles
- [ ] Test imports in apps: `import { Button } from "@pmg/ui/components/ui/button"`
- [ ] Verify dark mode: OS default works, toggle overrides correctly
- [ ] Run `bun run check-types` across all packages

---

### Phase 4: Authentication Package (`@pmg/auth`) 🔲
**Duration:** 2-3 days  
**Depends On:** Phase 2 (database/users table)  
**Blocks:** Phases 5-6 (apps need auth)

#### Goals
- Create shared auth package using Better Auth
- Implement login/register flows
- Configure JWT + HTTP-only cookies
- Setup role-based access control (RBAC)
- Create auth middleware for both apps

#### Deliverables

**Folder Structure:**
```
packages/auth/
├── src/
│   ├── client.ts           # Client-side utilities
│   ├── server.ts           # Server-side utilities
│   ├── hooks.ts            # React hooks
│   ├── middleware.ts       # Next.js middleware
│   ├── rbac.ts            # Role-based access
│   ├── types.ts           # TypeScript types
│   └── index.ts
├── package.json
├── tsconfig.json
└── .env.example
```

**`package.json`:**
```json
{
  "name": "@pmg/auth",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./client": "./src/client.ts",
    "./server": "./src/server.ts",
    "./hooks": "./src/hooks.ts",
    "./middleware": "./src/middleware.ts"
  },
  "dependencies": {
    "better-auth": "^0.8.0",
    "@pmg/db": "*",
    "jose": "^5.0.0",
    "next": "^16.0.0"
  },
  "devDependencies": {
    "@repo/typescript-config": "*",
    "typescript": "5.9.2"
  }
}
```

**Better Auth Setup (`src/server.ts`):**
```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@pmg/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  appName: "Tracker 360",
  secret: process.env.BETTER_AUTH_SECRET,
  basePath: "/api/auth",
  trustedOrigins: [
    process.env.NEXTAUTH_URL || "http://localhost:3000",
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
```

**Types (`src/types.ts`):**
```typescript
export type UserRole = "system_admin" | "admin" | "manager" | "user";

export const PERMISSIONS = {
  system_admin: {
    users: ["create", "read", "update", "delete"],
    settings: ["create", "read", "update", "delete"],
    audits: ["read"],
    system: ["manage"],
  },
  admin: {
    tenders: ["create", "read", "update", "delete"],
    pos: ["create", "read", "update", "delete"],
    invoices: ["read"],
  },
  manager: {
    tenders: ["read", "create", "update"],
    pos: ["read"],
    invoices: ["read"],
  },
  user: {
    tenders: ["read"],
    profile: ["update"],
  },
} as const;

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
  expires: string;
}
```

**Client Hooks (`src/hooks.ts`):**
```typescript
"use client";

import { useContext } from "react";
import { AuthContext } from "./context";

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function useIsAuthorized(action: string) {
  const { user } = useAuth();
  if (!user) return false;
  
  const role = user.role as UserRole;
  // Check permissions...
}
```

**Middleware (`src/middleware.ts`):**
```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "./server";

export async function withAuth(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  request.headers.set("x-user-id", session.user.id);
  request.headers.set("x-user-role", session.user.role);
  
  return NextResponse.next({ request });
}
```

#### Tasks
- [ ] Create `packages/auth/` directory
- [ ] Setup Better Auth with Drizzle adapter
- [ ] Configure JWT + HTTP-only cookies
- [ ] Create hooks (useAuth, useIsAuthorized)
- [ ] Setup RBAC system
- [ ] Create middleware for route protection
- [ ] Test auth flow (register → login → session)
- [ ] Integrate into both apps (tracker & admin)

---

### Phase 5: Tracker App Features 🔲
**Duration:** 4-5 days  
**Depends On:** Phases 2-4 (DB, UI, Auth)

#### Goals
- Migrate existing TenderTrack360 code
- Implement tender management (list, detail, create)
- Implement PO management
- Implement invoice tracking
- Connect all to shared database & auth

#### Folder Structure
```
apps/tracker/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (public)/
│   │   ├── page.tsx              # Home
│   │   ├── tenders/page.tsx       # List
│   │   ├── tenders/[id]/page.tsx  # Detail
│   │   └── pos/page.tsx
│   ├── (protected)/
│   │   ├── dashboard/page.tsx
│   │   ├── tenders/page.tsx       # My tenders
│   │   ├── submissions/page.tsx
│   │   ├── invoices/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/[...auth]/route.ts
│   │   ├── tenders/route.ts
│   │   ├── pos/route.ts
│   │   └── invoices/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── TenderCard.tsx
│   ├── TenderFilter.tsx
│   ├── TenderForm.tsx
│   ├── DashboardLayout.tsx
│   └── ...
├── lib/
│   ├── actions.ts          # Server actions
│   ├── queries.ts          # Database queries
│   └── utils.ts
├── middleware.ts
└── types.ts
```

**Migration Strategy:**
1. Copy existing tracker code to `apps/tracker/src/`
2. Replace database imports: `@/lib/db` → `@pmg/db`
3. Replace UI imports: `@/components/ui` → `@repo/ui`
4. Integrate authentication via `@pmg/auth`
5. Update API routes to use Server Actions (Next.js 16 best practice)
6. Test all features end-to-end

#### Key Pages
- `/` - Public home with featured tenders
- `/tenders` - Searchable tender listings
- `/tenders/[id]` - Tender detail page
- `/dashboard` - User dashboard (protected)
- `/dashboard/tenders` - User's tenders
- `/dashboard/invoices` - Invoice tracking

#### Tasks
- [ ] Export existing TenderTrack360 codebase
- [ ] Copy into `apps/tracker/src/`
- [ ] Update imports (DB, UI, types)
- [ ] Integrate Better Auth
- [ ] Implement tender CRUD
- [ ] Implement PO CRUD
- [ ] Implement invoice tracking
- [ ] Setup Neon indexes for performance
- [ ] Add form validation (Zod)
- [ ] Test all features
- [ ] Add error handling & logging

---

### Phase 6: Admin App Features 🔲
**Duration:** 3-4 days  
**Depends On:** Phases 2-4 (DB, UI, Auth)

#### Goals
- Build admin dashboard MVP
- User management (CRUD)
- System settings configuration
- Audit log viewer
- Restrict to system_admin role only

#### Folder Structure
```
apps/admin/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (protected)/
│   │   ├── dashboard/page.tsx     # Stats, overview
│   │   ├── users/page.tsx         # User management
│   │   ├── users/[id]/page.tsx    # User detail
│   │   ├── settings/page.tsx      # System config
│   │   ├── logs/page.tsx          # Audit logs
│   │   ├── reports/page.tsx       # Analytics
│   │   └── layout.tsx             # Sidebar nav
│   ├── api/
│   │   ├── auth/[...auth]/route.ts
│   │   └── admin/
│   │       ├── users/route.ts
│   │       ├── settings/route.ts
│   │       └── stats/route.ts
│   ├── layout.tsx
│   └── page.tsx                   # Redirect to dashboard
├── components/
│   ├── AdminLayout.tsx
│   ├── Sidebar.tsx
│   ├── UserTable.tsx
│   ├── SettingsForm.tsx
│   ├── StatsCard.tsx
│   └── ...
├── lib/
│   ├── actions.ts
│   ├── queries.ts
│   └── permissions.ts
├── middleware.ts
└── types.ts
```

**Pages to Build:**

1. **Dashboard** (`/dashboard`)
   - Total users, tenders, invoices stats
   - Recent activity
   - System health checks

2. **Users** (`/users`)
   - Table of all users (pagination, search, filter)
   - Bulk actions (activate, deactivate, role change)
   - Detail page (edit role, view history)
   - Create new user

3. **Settings** (`/settings`)
   - System configuration form
   - Email settings
   - Payment settings
   - Notification preferences

4. **Audit Logs** (`/logs`)
   - Table of all actions (create, update, delete)
   - Filters: date range, user, action type
   - Export to CSV

5. **Reports** (`/reports`)
   - Tender statistics
   - Invoice reports
   - User activity

#### Tasks
- [ ] Setup auth with system_admin role check
- [ ] Build dashboard with stats cards
- [ ] Build users CRUD with data table
- [ ] Build settings form
- [ ] Build audit log viewer
- [ ] Add role-based page access
- [ ] Setup notifications (optional)
- [ ] Add data export functionality
- [ ] Test all flows as admin
- [ ] Add breadcrumbs & navigation

---

### Phase 7: Documentation (`apps/docs`) 🔲
**Duration:** 2-3 days  
**Depends On:** All features complete  
**Blocks:** Nothing (final phase)

#### Goals
- Document user guides (tracker app)
- Document admin guide
- Document API endpoints
- Document developer setup
- Create architecture diagrams

#### Content Structure
```
src/content/docs/
├── index.mdx                  # Home
├── getting-started/
│   ├── setup.mdx
│   ├── first-login.mdx
│   └── account-management.mdx
├── tracker-app/
│   ├── searching-tenders.mdx
│   ├── applying-tenders.mdx
│   ├── managing-submissions.mdx
│   ├── invoice-tracking.mdx
│   └── faq.mdx
├── admin-dashboard/
│   ├── user-management.mdx
│   ├── system-settings.mdx
│   ├── audit-logs.mdx
│   └── reports.mdx
├── api/
│   ├── authentication.mdx
│   ├── tenders.mdx
│   ├── pos.mdx
│   └── invoices.mdx
├── development/
│   ├── architecture.mdx
│   ├── setup.mdx
│   ├── database.mdx
│   └── deployment.mdx
└── support.mdx
```

#### Key Sections
1. **User Guide** - How to use tracker app
2. **Admin Guide** - How to use admin dashboard
3. **API Reference** - All endpoints & schemas
4. **Developer Guide** - Setup, architecture, deployment
5. **FAQ** - Common questions & troubleshooting

#### Tasks
- [ ] Write tracker user guide
- [ ] Write admin dashboard guide
- [ ] Document all API endpoints
- [ ] Create architecture diagrams
- [ ] Write deployment guide
- [ ] Add code examples
- [ ] Add troubleshooting section
- [ ] Configure search in Starlight
- [ ] Test all links
- [ ] Deploy to docs.tendertrack360.co.za

---

### Phase 8: Testing & Deployment 🔲
**Duration:** 2-3 days  
**Depends On:** All phases complete  
**Blocks:** Nothing (final)

#### Goals
- End-to-end testing
- Performance optimization
- Security hardening
- Deploy to Vercel (3 projects)

#### Testing Checklist
- [ ] Auth flow (register → login → session)
- [ ] Tender CRUD (create, read, update, delete)
- [ ] PO CRUD operations
- [ ] Invoice generation & tracking
- [ ] Admin user management
- [ ] Audit logging
- [ ] Database migrations
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Accessibility (a11y)

#### Performance Optimization
- [ ] Database query optimization (indexes created)
- [ ] API response caching
- [ ] Image optimization
- [ ] Bundle size analysis
- [ ] Lighthouse scores > 90

#### Security Checklist
- [ ] Environment variables secured
- [ ] SQL injection prevention (Drizzle ORM)
- [ ] CSRF protection
- [ ] Rate limiting on auth endpoints
- [ ] HTTPS enforced
- [ ] Headers configured (CSP, X-Frame-Options, etc.)
- [ ] Secrets not in version control

#### Deployment
- [ ] Create 3 Vercel projects:
  - `tendertrack360.co.za` (tracker)
  - `admin.tendertrack360.co.za` (admin)
  - `docs.tendertrack360.co.za` (docs)
- [ ] Configure environment variables
- [ ] Setup auto-deploy from GitHub
- [ ] Configure preview environments
- [ ] Setup monitoring & alerts
- [ ] Create deployment documentation

---

## Development Workflow

### Daily Development
```bash
# Start all apps
bun run dev

# Apps run on:
# - Tracker: http://localhost:3000
# - Admin: http://localhost:3001
# - Docs: http://localhost:3002
```

### Database Operations
```bash
# Generate migrations
bun run db:generate

# Push to Neon
bun run db:push

# Open Drizzle Studio
bun run db:studio

# View schema changes
bun run db:migrate
```

### Linting & Types
```bash
# Lint all
bun run lint

# Type check all
bun run check-types

# Format
bun run format
```

### Building for Production
```bash
# Build all apps
bun run build

# Test production build locally
bun run start
```

---

## Environment Variables

### Root `.env.local`
```bash
# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@neon.tech/dbname

# Authentication (REQUIRED for phases 4+)
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
NEXTAUTH_URL_TRACKER=http://localhost:3000
NEXTAUTH_URL_ADMIN=http://localhost:3001

# Optional
SENDGRID_API_KEY=...
STRIPE_API_KEY=...
```

### App-Specific `.env.local`

**apps/tracker/.env.local**
```bash
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

**apps/admin/.env.local**
```bash
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3001
```

---

## Timeline

| Phase | Task | Duration | Status |
|-------|------|----------|--------|
| 1 | Foundation (apps, remove web) | ~1 day | ✅ COMPLETE |
| 2 | Database package (@pmg/db) | 2-3 days | 🔲 NEXT |
| 3 | UI package (shadcn/ui) | 2-3 days | 🔲 Then |
| 4 | Auth (@pmg/auth + Better Auth) | 2-3 days | 🔲 Then |
| 5 | Tracker features (CRUD, dashboard) | 4-5 days | 🔲 Then |
| 6 | Admin features (users, settings) | 3-4 days | 🔲 Then |
| 7 | Documentation (Starlight) | 2-3 days | 🔲 Then |
| 8 | Testing & deployment (Vercel) | 2-3 days | 🔲 Last |
| **TOTAL** | **All phases** | **3-4 weeks** | — |

---

## Key Decisions

| Decision | Recommendation | Rationale |
|----------|-----------------|-----------|
| **Auth Approach** | **✅ Shared `@pmg/auth`** | Single source of truth, consistent UX, easier maintenance |
| **Auth Provider** | **✅ Better Auth** | TypeScript-first, modern, Drizzle-compatible |
| **Database** | **✅ Neon PostgreSQL** | Serverless, free tier, great DX |
| **ORM** | **✅ Drizzle ORM** | Type-safe, excellent TS support |
| **UI Library** | **✅ shadcn/ui** | Accessible, customizable, component-driven |
| **Styling** | **✅ Tailwind CSS 4** | Utility-first, navy-gold theme ready |
| **Docs** | **✅ Astro Starlight** | Optimized for docs, searchable, fast |
| **Deployment** | **✅ Vercel** | Next.js first, global CDN, easy setup |

---

## Success Criteria

### Phase 1 ✅
- [x] Web app removed
- [x] 3 apps created with correct frameworks
- [x] Turbo configured
- [x] All packages in place

### Phase 2
- [ ] Database schema created & tested
- [ ] All tables in Neon with correct relationships
- [ ] Drizzle queries work in both apps
- [ ] Indexes created for performance

### Phase 3
- [ ] shadcn/ui setup complete
- [ ] 15+ components imported in apps
- [ ] Navy-gold theme applied globally
- [ ] Components documented

### Phase 4
- [ ] Better Auth configured
- [ ] Login/register working
- [ ] Sessions persisting
- [ ] RBAC system functional

### Phase 5
- [ ] TenderTrack360 code migrated
- [ ] All CRUD operations work
- [ ] Data displays correctly
- [ ] Forms validated & functional

### Phase 6
- [ ] Admin dashboard accessible
- [ ] User management working
- [ ] Audit logs recording
- [ ] Settings saving correctly

### Phase 7
- [ ] All docs written & published
- [ ] Code examples working
- [ ] Search functional
- [ ] No broken links

### Phase 8
- [ ] All tests passing
- [ ] Lighthouse score > 90
- [ ] Security audit passed
- [ ] Deployed to production

---

## Important Notes

### Dependency Graph
```
Phase 1 (Foundation)
    ↓
Phase 2 (Database) ← CRITICAL PATH
    ↓
Phase 3 (UI) ← Can start before Phase 2 ends
    ↓
Phase 4 (Auth) ← Depends on Phase 2
    ↓
Phase 5 & 6 (Features) ← Depend on 2-4
    ↓
Phase 7 (Docs) ← Can start early, needs Phase 5-6
    ↓
Phase 8 (Deployment) ← Last
```

### Risk Mitigation
- **Database schema changes:** Use Drizzle migrations, test locally first
- **Auth inconsistency:** Shared package prevents duplication
- **Performance issues:** Add database indexes early (in Phase 2)
- **Team knowledge gaps:** Good documentation (Phase 7) prevents confusion
- **Deployment issues:** Test on Vercel preview before production

### Post-Launch Roadmap (Future Phases 9+)
- [ ] Payment integration (Stripe)
- [ ] Email notifications (SendGrid)
- [ ] SMS alerts
- [ ] Advanced reporting
- [ ] Mobile app (React Native)
- [ ] Real-time notifications (WebSockets)
- [ ] Marketplace for vendors

---

## Contact & Support

**For questions during implementation:**
- Database schema: Reference Phase 2 docs & Drizzle docs
- Authentication: Better Auth docs & examples
- UI components: shadcn/ui official components
- Deployment: Vercel documentation

**Emergency contacts:**
- Database issues: Neon support
- Vercel issues: Vercel support dashboard
- TypeScript issues: TypeScript docs

---

**Document Version:** 3.0 (Integrated)  
**Status:** Ready to Execute  
**Start Date:** April 29, 2026  
**Expected Completion:** Late May 2026  
**Owner:** Jacob (PMG)  
**Last Updated:** April 29, 2026

---

## Next Action

🎯 **START PHASE 2 NOW:**

1. Create `packages/db/` directory structure
2. Create `package.json` with Drizzle dependencies
3. Setup Neon PostgreSQL (free tier)
4. Create `.env.local` with `DATABASE_URL`
5. Create schema with all tables
6. Run `bun install && bun run db:push`
7. Verify tables in Neon console

Estimated time: **2-3 hours**

After Phase 2 complete → **START PHASE 3 (UI Package)**