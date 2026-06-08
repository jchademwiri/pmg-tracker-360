# Tender Track 360 — Audit Index

**Project:** Tender Track 360  
**Date:** June 8, 2026  
**Scope:** `apps/admin`, `apps/tracker`, `packages/db`

---

> **This file is an index.** The full audit has been broken into focused, standalone reports in [`docs/audit/`](audit/).
>
> 👉 **Start here:** [`docs/audit/00-overview.md`](audit/00-overview.md) for the executive summary and priority matrix.

---

## Audit Reports

| # | Report | Area | Priority | Effort |
|---|--------|------|----------|--------|
| 00 | [Overview & Priority Matrix](audit/00-overview.md) | All | — | — |
| 01 | [Admin App](audit/01-admin-app.md) | Admin Console (all modules) | 🔴 High | 2-3 days |
| 02 | [Tracker Layout & Auth](audit/02-tracker-layout-auth.md) | Layout, auth, onboarding | 🟡 Medium | 1 day |
| 03 | [Tracker Landing](audit/03-tracker-landing.md) | Landing/marketing pages | 🟡 Medium | 0.5 day |
| 04 | [Tracker Dashboard](audit/04-tracker-dashboard.md) | Dashboard module | 🟡 Medium | 0.5 day |
| 05 | [Tracker Tenders](audit/05-tracker-tenders.md) | Tenders module | 🔴 Critical | 2-3 days |
| 06 | [Tracker Clients](audit/06-tracker-clients.md) | Clients module | 🟡 Medium | 0.5 day |
| 07 | [Tracker Projects & POs](audit/07-tracker-projects-po.md) | Projects + Purchase Orders | 🟡 Medium | 1 day |
| 08 | [Tracker Calendar & Reports](audit/08-tracker-calendar-reports.md) | Calendar + Reports | 🔴 Critical | 2-3 days |
| 09 | [Tracker Settings/Billing/Org](audit/09-tracker-settings-billing-org.md) | Settings, Billing, Organization | 🟢 Low | 1 day |
| 10 | [Database Schema](audit/10-database-schema.md) | Database schema + improvements | 🔴 Critical | 1-2 days |
| 11 | [Cross-Cutting Concerns](audit/11-cross-cutting.md) | Error handling, loading, toasts, testing | 🟡 Medium | 1-2 days |

---

## How to Use

1. **Pick a file** from the table above based on what you want to fix
2. **Each file is self-contained** with its own context, issues, and actionable suggestions
3. **Files list the specific code** that needs to be modified
4. **Start with 🔴 Critical items** for maximum impact

---

*Full audit completed June 8, 2026. See [`docs/audit/README.md`](audit/README.md) for more details.*
