# PMG Tracker 360 – Tracker App UI/UX Research, Audit, and Improvement Plan

You are a senior product designer, SaaS UX consultant, and full-stack UI engineer. Your task is to deeply review and improve the **Tracker app** inside our **PMG Tracker 360 monorepo**.

The Tracker app has two core business areas:

1. **Tender Management** — Checking, registering, tracking, submitting, following up on tenders, recording extensions, results, and awards.
2. **Project Management** — Creating projects from awarded tenders, managing POs, tracking partial deliveries, delivery status, and project completion.

Your goal is to produce a premium, mobile-friendly, intuitive, operationally useful SaaS platform.

---

## How This Audit Works

This audit is broken into **11 focused sub-prompts**. Each sub-prompt is a self-contained task that can be assigned to a sub-agent. They are ordered by dependency — later prompts build on findings from earlier ones.

### Sub-Prompts

| # | File | Scope | Depends On |
|---|------|-------|------------|
| 0 | [01-codebase-audit.md](./01-codebase-audit.md) | Full codebase audit — structure, routes, components, schema, mobile, visual | — |
| 1 | [02-dashboard-audit.md](./02-dashboard-audit.md) | Main dashboard audit and recommendations | 01 |
| 2 | [03-tender-management.md](./03-tender-management.md) | Tender mini dashboard, register, detail page, workflow | 01, 02 |
| 3 | [04-project-management.md](./04-project-management.md) | Project mini dashboard, register, detail page, PO management | 01, 02 |
| 4 | [05-workflow.md](./05-workflow.md) | End-to-end tender-to-project workflow mapping | 01, 02, 03, 04 |
| 5 | [06-mobile-ux.md](./06-mobile-ux.md) | Mobile-first UX requirements and recommendations | 01, 02, 03, 04 |
| 6 | [07-premium-ui.md](./07-premium-ui.md) | Premium SaaS UI direction and design system | 01 |
| 7 | [08-navigation.md](./08-navigation.md) | Navigation and information architecture | 01, 02, 03, 04 |
| 8 | [09-forms-data-capture.md](./09-forms-data-capture.md) | Forms and data capture UX | 01, 03, 04 |
| 9 | [10-deliverables-roadmap.md](./10-deliverables-roadmap.md) | Deliverables, implementation output, and phased roadmap | All above |

---

## Execution Strategy

### Recommended Agent Deployment

- **Phase 1** (parallel): Spawn agents for `01-codebase-audit.md` and `07-premium-ui.md` — these have no dependencies.
- **Phase 2** (parallel): Once Phase 1 completes, spawn agents for `02-dashboard-audit.md`, `06-mobile-ux.md`.
- **Phase 3** (parallel): Once 02 completes, spawn agents for `03-tender-management.md`, `04-project-management.md`, `08-navigation.md`.
- **Phase 4** (parallel): Once 03 and 04 complete, spawn agents for `05-workflow.md`, `09-forms-data-capture.md`.
- **Phase 5**: Once all above complete, spawn agent for `10-deliverables-roadmap.md` to synthesize everything.

### Input for Each Agent

Each sub-agent should receive:
1. The specific sub-prompt file content
2. The `01-codebase-audit.md` findings (once available) as foundational context
3. Any cross-referenced sub-prompt findings listed in the "Depends On" column

### Findings Template

All sub-agents must use [`FINDINGS-TEMPLATE.md`](./FINDINGS-TEMPLATE.md) when writing their `findings.md` files. This ensures consistent structure across all audit areas, making synthesis in Phase 5 straightforward.

### Final Synthesis

After all sub-agents complete, the findings from `10-deliverables-roadmap.md` should be merged into a final comprehensive report.

---

## Final Goal

The final recommendation must help us turn the Tracker app into a premium, mobile-friendly, operational SaaS platform where:

- A tender administrator immediately knows what to work on
- A manager immediately sees operational performance and risks
- A user can easily move from tender opportunity to awarded project
- Projects and POs are clearly tracked
- Partial deliveries are easy to record
- Statuses are clear
- Navigation is intuitive
- Mobile usage is practical
- The UI feels polished, modern, and professional

Be specific, practical, and implementation-ready.
