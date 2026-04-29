# Monorepo Implementation Plan

## Current Status ✅

### Apps (Complete)
- **`apps/docs`** - Astro Starlight documentation site
- **`apps/tracker`** - Next.js 16 app for tender and PO management
- **`apps/admin`** - Next.js 16 admin dashboard

### Packages (Existing)
- **`packages/ui`** - Shared UI components (button, card, code)
- **`packages/eslint-config`** - Shared ESLint configuration
- **`packages/typescript-config`** - Shared TypeScript configuration

---

## Remaining Tasks

### 1. Database Package
- Add `packages/db` for shared database logic (drizzel-orm, Drizzle, or similar)
- Configure database client and schema

### 2. UI Package Enhancement
- Set up shadcn/ui in `packages/ui`
- Add common components (forms, tables, dialogs, etc.)
- Document usage for all apps

### 3. Authentication
- Decide: shared `auth` package vs per-app auth
- Implement Better Auth or NextAuth
- Configure for both tracker and admin apps

### 4. Tracker App Features
- Migrate code from https://www.tendertrack360.co.za/
- Implement tender and PO management features
- Connect to database
- Add authentication

### 5. Admin App Features
- Build admin dashboard features
- User management
- System configuration
- Connect to database

### 6. Documentation
- Document usage, setup, and architecture
- Add guides for developers
- Document API endpoints and data models

---

## Tech Stack Decisions

| Component | Recommended | Notes |
|-----------|-------------|-------|
| Database | drizzel-orm | Easy to use with TypeScript |
| Auth | Better Auth | Modern, TypeScript-first |
| UI | shadcn/ui | Accessible, customizable |
| Docs | Astro Starlight | ✅ Already implemented |

---

## Next Steps
1. Add `packages/db` with drizzel-orm
2. Set up shadcn/ui in `packages/ui`
3. Implement authentication
4. Build tracker app features
5. Build admin app features
6. Document everything in `apps/docs`
