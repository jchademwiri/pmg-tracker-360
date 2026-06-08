# Tender Track 360 — Audit Overview

**Project:** Tender Track 360  
**Date:** June 8, 2026  
**Scope:** `apps/admin`, `apps/tracker`, `packages/db`

---

## Key Strengths

- Consistent design language within each app
- Server/client component separation in admin; tracker uses `force-dynamic` as a workaround
- Proper authentication and role-based access control
- Comprehensive database schema with proper relations

## Top Priority Improvements

1. Tracker app lacks consistent empty states and loading patterns across modules
2. Admin console needs responsive/mobile support
3. Database schema has redundant fields, missing indexes, and inconsistent soft-deletion patterns
4. Both apps need consistent error handling and toast notification patterns

---

## Audit Files — Pick One to Fix

| File | Area | Severity | Est. Effort |
|------|------|----------|-------------|
| [01-admin-app.md](01-admin-app.md) | Admin Console (all modules) | 🔴 High | 2-3 days |
| [02-tracker-layout-auth.md](02-tracker-layout-auth.md) | Tracker layout, auth, onboarding | 🟡 Medium | 1 day |
| [03-tracker-landing.md](03-tracker-landing.md) | Landing/marketing pages | 🟡 Medium | 0.5 day |
| [04-tracker-dashboard.md](04-tracker-dashboard.md) | Tracker dashboard | 🟡 Medium | 0.5 day |
| [05-tracker-tenders.md](05-tracker-tenders.md) | Tenders module | 🔴 Critical | 2-3 days |
| [06-tracker-clients.md](06-tracker-clients.md) | Clients module | 🟡 Medium | 0.5 day |
| [07-tracker-projects-po.md](07-tracker-projects-po.md) | Projects + Purchase Orders | 🟡 Medium | 1 day |
| [08-tracker-calendar-reports.md](08-tracker-calendar-reports.md) | Calendar + Reports | 🔴 Critical | 2-3 days |
| [09-tracker-settings-billing-org.md](09-tracker-settings-billing-org.md) | Settings, Billing, Organization | 🟢 Low | 1 day |
| [10-database-schema.md](10-database-schema.md) | Database schema + improvements | 🔴 Critical | 1-2 days |
| [11-cross-cutting.md](11-cross-cutting.md) | Error handling, loading, toasts, testing | 🟡 Medium | 1-2 days |

---

## Priority Matrix

### 🔴 Critical (Fix Immediately)
1. Implement tender document upload → [05-tracker-tenders.md](05-tracker-tenders.md)
2. Fix schema drift between source and migrations → [10-database-schema.md](10-database-schema.md)
3. Resolve `followUp` vs `tenderExtension` duplication → [10-database-schema.md](10-database-schema.md)
4. Implement actual reports/charts → [08-tracker-calendar-reports.md](08-tracker-calendar-reports.md)

### 🟡 High (Fix This Sprint)
5. Add responsive layout to admin console → [01-admin-app.md](01-admin-app.md)
6. Replace `alert()` with proper dialogs → [06-tracker-clients.md](06-tracker-clients.md), [07-tracker-projects-po.md](07-tracker-projects-po.md)
7. Add missing database indexes → [10-database-schema.md](10-database-schema.md)
8. Convert text status fields to pgEnums → [10-database-schema.md](10-database-schema.md)
9. Fix currency display inconsistency ($ vs R) → [05-tracker-tenders.md](05-tracker-tenders.md)
10. Extract shared utilities → [11-cross-cutting.md](11-cross-cutting.md)

### 🟢 Medium (Fix This Month)
11. Add user detail view to admin → [01-admin-app.md](01-admin-app.md)
12. Add ticket detail view with notes → [01-admin-app.md](01-admin-app.md)
13. Convert currency fields to numeric type → [10-database-schema.md](10-database-schema.md)
14. Add CSV export for data tables → [01-admin-app.md](01-admin-app.md), [06-tracker-clients.md](06-tracker-clients.md)
15. Add skeleton loading to admin console → [01-admin-app.md](01-admin-app.md)
16. Replace emoji icons with SVGs → [03-tracker-landing.md](03-tracker-landing.md)
17. Add toast notifications to admin → [01-admin-app.md](01-admin-app.md)
18. Add breadcrumbs to admin → [01-admin-app.md](01-admin-app.md)

### ⚪ Low (Backlog)
19. Add command palette (Cmd+K) → [02-tracker-layout-auth.md](02-tracker-layout-auth.md)
20. Add OAuth providers → [02-tracker-layout-auth.md](02-tracker-layout-auth.md)
21. Add calendar integration → [08-tracker-calendar-reports.md](08-tracker-calendar-reports.md)
22. Add PO PDF generation → [07-tracker-projects-po.md](07-tracker-projects-po.md)
23. Add 2FA setup → [09-tracker-settings-billing-org.md](09-tracker-settings-billing-org.md)
24. Add session history view → [01-admin-app.md](01-admin-app.md)
25. Run accessibility audit → [11-cross-cutting.md](11-cross-cutting.md)

---

*Each file is self-contained with its own context, issues, and actionable suggestions.*
