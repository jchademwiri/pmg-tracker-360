# Tracker 360 Monorepo v1 Implementation Plan (Next.js 16)

**Owner:** Jacob (PMG)  
**Plan Type:** Detailed phased migration plan to v1  
**Stack:** Bun + Turborepo + Next.js 16 App Router + React 19 + Tailwind v4 + Drizzle + Neon  
**Apps:** `apps/tracker` (3000), `apps/admin` (3001), `apps/docs` (3002)  
**Last Updated:** April 30, 2026

---

## 1) v1 Objective

Deliver a production-ready v1 where tracker and admin run on shared packages, real auth/RBAC is enforced, docs are complete, and CI/deployment are reliable.

### v1 Success Criteria

- Shared auth package (`@pmg/auth`) implemented and used by tracker + admin.
- Tracker core modules work end-to-end under real auth.
- Admin app supports owner/admin operations.
- `apps/docs` contains real product + developer documentation.
- Lint/typecheck/tests pass in CI, and deployment runbook is verified.

---

## 2) Current State (Done vs Pending)

### Done

- Monorepo foundation is in place.
- `@pmg/db` with schema/migrations is in place.
- `@pmg/ui` exists with a substantial component library.
- Large portion of tracker routes/components/server modules already migrated.
- **Phase 0 complete:** Baseline checks run; failures identified and documented.
- **Phase 1 complete:**
  - `@pmg/db` tsconfig fixed (`moduleResolution: Bundler`) — `check-types` passes.
  - `@pmg/ui` type resolution confirmed clean — `check-types` passes.
  - `bun run check-types` passes across all workspace packages.
  - `bun run build` passes for all 3 apps (tracker build script fixed with `--env-file`).

### Pending / Blockers

- `components.json` missing in `packages/ui`, `apps/tracker`, `apps/admin` (deferred — not blocking check-types).
- Shared auth package `@pmg/auth` not created yet — **current blocker**.
- Tracker still contains auth/session/proxy stubs.
- Admin app is still starter scaffold.
- Docs app still mostly placeholder content.
- Tests/security hardening/deployment validation incomplete.

---

## 3) Missing Imports From Old Repo (Must Track)

Source repo: `https://github.com/jchademwiri/tender-track-360.git`

### Critical Imports

- Auth route logic:
  - old: `src/app/api/auth/[...all]/route.ts`
  - target: `apps/tracker/src/app/api/auth/[...auth]/route.ts` and admin equivalent
- Invitation acceptance route (if required):
  - old: `src/app/api/accept-invitation/[invitationId]/route.ts`
- Admin route tree:
  - old: `src/app/(admin)/admin/`*
  - target: `apps/admin/src/app/(protected)/`*
- Admin shell/navigation components:
  - old: `src/components/admin/*`

### Feature Imports (Decide/Adapt)

- Billing routes: `src/app/(dashboard)/billing/*`
- Project overview route: `.../projects/overview/page.tsx`
- Transfer ownership settings flow under organization settings
- Extra profile/settings subcomponents (activity/email/preferences/privacy)
- Tenders overview split route (if still needed)

### Product Decision Imports

- Public pages: `about`, `blog`, `careers`, `contact`, `help`, `privacy`, `terms`, `training`, `waitlist`, `modules`
- Decide destination: tracker, docs, or separate marketing app

### Test Imports

- `src/server/__tests__/*`
- `src/lib/auth/permissions.test.ts`
- selected component tests worth carrying forward

---

## 4) Implementation Principles

- Do not blindly copy; adapt old code to monorepo boundaries.
- Shared concerns belong in packages (`@pmg/db`, `@pmg/ui`, `@pmg/auth`).
- Keep Next.js 16 App Router boundaries strict (server-only vs client).
- Deny-by-default auth policy for protected routes/actions.
- Deliver in vertical slices with acceptance checks per phase.

---

## 5) Phased Execution Plan

## ✅ Phase 0 - Baseline and Alignment — COMPLETE

### Goal

Create a clear baseline and prevent hidden regressions.

### Completed

- Ran baseline checks: `bun run build`, `bun run lint`, `bun run check-types`.
- Identified root causes of all failures.
- Scope and sequence confirmed.

### Baseline Findings (Resolved)

- `tracker#build` was failing: `validate-env.mjs` ran as plain Node without `.env.local` loaded. Fixed by adding `--env-file=.env.local` to the build script.
- `@pmg/db#check-types` was failing: `moduleResolution: NodeNext` in base tsconfig required `.js` extensions on relative imports. Fixed by overriding to `Bundler` in `packages/db/tsconfig.json`.
- `@pmg/ui#check-types` was failing: confirmed clean after db fix unblocked the pipeline.

---

## ✅ Phase 1 - Stabilize `@pmg/ui` — COMPLETE

### Goal

Make shared UI package clean and reusable by both apps.

### Completed

- Fixed `@pmg/db` tsconfig (`moduleResolution: Bundler`) — unblocked workspace `check-types`.
- Confirmed `@pmg/ui` type resolution is clean.
- `bun run check-types` passes across all packages.
- `bun run build` passes for all 3 apps.

### Deferred (Non-blocking)

- `components.json` files for `packages/ui`, `apps/tracker`, `apps/admin` — not required for type resolution; can be added when shadcn CLI usage is needed.
- UI smoke pages — deferred to Phase 3 when real auth is wired.

---

## 🔄 Phase 2 - Build Shared Auth Package `@pmg/auth` — NEXT

### Goal

Implement real auth + RBAC once for all apps.

### Target Package Structure

```
packages/auth/
├── src/
│   ├── server.ts
│   ├── client.ts
│   ├── middleware.ts
│   ├── rbac.ts
│   ├── types.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── .env.example
```

### Tasks

- Create `packages/auth` and configure exports.
- Configure Better Auth + Drizzle adapter to `@pmg/db`.
- Wire tables: `user`, `session`, `account`, `verification`.
- Add organization-aware behavior using existing org/member tables.
- Implement RBAC helpers for `owner`, `admin`, `manager`, `member`.
- Define env contract (`BETTER_AUTH_SECRET`, trusted origins, app URLs).
- Add typed server/client helper utilities.

### Code/Logic Improvements

- Remove fallback auth secret behavior in app runtime paths.
- Introduce consistent auth error model: unauthenticated vs unauthorized.
- Centralize session fetch helper for server actions/routes.

### Exit Criteria

- Register/login/logout/session flow works end-to-end.
- Role checks are reusable from tracker and admin.

---

## Phase 3 - Integrate Auth in Tracker and Remove Stubs (1-2 days)

### Goal

Replace temporary tracker auth logic with real shared auth.

### Tasks

- Replace/remove stubs in tracker:
  - `src/lib/auth.ts`
  - `src/lib/session-check.ts`
  - `src/proxy.ts`
- Add tracker auth route handler:
  - `src/app/api/auth/[...auth]/route.ts`
- Add protected-route enforcement for dashboard/module routes.
- Verify login/signup/reset flows under real session state.
- Verify organization-aware behavior after login.

### Code/Logic Improvements

- Apply deny-by-default access for protected areas.
- Standardize unauthenticated redirects.
- Add server action guards to avoid auth bypass.

### Exit Criteria

- Tracker has no auth stubs.
- Protected pages/actions require valid session and role.

---

## Phase 4 - Complete Tracker v1 Feature Gaps (2-4 days)

### Goal

Close remaining tracker gaps and ensure feature completeness.

### Tasks

- Implement invoices module/pages (list/detail/create/edit).
- Reconcile missing routes imported from old repo where still needed.
- Complete transfer ownership flow if in v1 scope.
- Ensure consistent loading/error empty states across modules.
- Confirm document/file flows respect permissions and org boundaries.

### Code/Logic Improvements

- Standardize Zod validation usage for actions/forms.
- Standardize server-action error handling format.
- Audit heavy list queries and indexing strategy.

### Exit Criteria

- Tracker v1 modules pass smoke tests with real auth:
  - tenders, projects, purchase orders, invoices, org/member flows.

---

## Phase 5 - Build Admin App v1 (3-5 days)

### Goal

Move admin from starter scaffold to operational console.

### Tasks

- Add admin auth route handler + protected layout.
- Enforce owner/admin-only role checks.
- Build routes and screens:
  - dashboard
  - users
  - organizations
  - settings
  - logs
  - reports
- Implement data table experiences (search/filter/pagination/sort).
- Implement CSV export where needed.
- Add audit logging for sensitive admin actions.

### Code/Logic Improvements

- Keep business logic in server modules/actions, not page components.
- Centralize admin permission checks.
- Use optimistic UI only where consistency guarantees are clear.

### Exit Criteria

- Admin app supports core owner/admin workflows end-to-end.

---

## Phase 6 - Docs Completion (`apps/docs`) (1-2 days)

### Goal

Replace placeholder docs with migration and product docs.

### Tasks

- Add getting started docs:
  - local setup
  - env vars
  - run commands
- Add tracker user guides.
- Add admin user guides.
- Add architecture + package boundary documentation.
- Add operational docs (deploy, rollback, troubleshooting).
- Validate links/navigation/search.

### Exit Criteria

- Docs are usable as onboarding and operations reference.

---

## Phase 7 - Testing, Security, and Deployment Hardening (2-4 days)

### Goal

Make v1 safe and repeatable in production.

### Testing Tasks

- Add tests for auth/session/RBAC.
- Add tests for core tracker/admin server logic.
- Add smoke/integration tests for critical user journeys.
- Add CI gates for lint + typecheck + tests.

### Security Tasks

- Harden env secret handling and configuration validation.
- Add auth endpoint protections (rate limiting, CSRF approach).
- Validate security headers and HTTPS assumptions.
- Review audit trail coverage for sensitive actions.

### Deployment Tasks

- Configure Vercel projects/envs for tracker/admin/docs.
- Document preview/staging workflow.
- Add go-live checklist and rollback runbook.

### Exit Criteria

- CI green on required checks.
- Deployment flow tested and documented.

---

## 6) Execution Order (Strict)

- ✅ Phase 0 - Baseline
- ✅ Phase 1 - `@pmg/ui` stabilization
- 🔄 Phase 2 - `@pmg/auth` package ← **current**
- ⬜ Phase 3 - Tracker auth integration
- ⬜ Phase 4 - Tracker feature gap closure
- ⬜ Phase 5 - Admin app implementation
- ⬜ Phase 6 - Docs completion
- ⬜ Phase 7 - Hardening + deployment

---

## 7) Detailed Validation Checklist for v1

### Functional

- Register -> login -> session persists -> logout.
- RBAC blocks unauthorized actions and routes.
- Tracker CRUD flows work and persist correctly.
- Admin user/org/log/report workflows are operational.

### Technical Quality

- `bun run lint` passes.
- `bun run check-types` passes. ✅
- Required automated tests pass locally and in CI.
- No critical runtime errors in core flows.

### Product Readiness

- Docs cover setup, operations, and troubleshooting.
- Env variable contract documented and validated.
- Deployment/rollback steps tested once before release.

---

## 8) Risks and Mitigations

- **Risk:** Auth migration causes widespread breakage.  
**Mitigation:** Build `@pmg/auth` first, then replace stubs in a controlled phase.
- **Risk:** UI package instability blocks all apps.  
**Mitigation:** Resolve `@pmg/ui` health before auth/admin work. ✅ Done.
- **Risk:** Admin scope grows and delays v1.  
**Mitigation:** Keep admin v1 focused on must-have operations; defer extras.
- **Risk:** Imported code from old repo violates monorepo boundaries.  
**Mitigation:** Enforce package ownership and do adaptation, not raw copying.

---

## 9) Immediate Next Sprint Plan (Actionable)

- Scaffold `packages/auth` with Better Auth + Drizzle adapter wired to `@pmg/db`.
- Wire tables: `user`, `session`, `account`, `verification`, org/member.
- Implement RBAC helpers for `owner`, `admin`, `manager`, `member`.
- Export typed `server.ts`, `client.ts`, `middleware.ts`, `rbac.ts` from the package.
- Verify `@pmg/auth` builds and `check-types` passes.

---

**Document Version:** 7.0  
**Format:** Detailed phased migration guide (v1 target)  
**Last Updated:** April 30, 2026
