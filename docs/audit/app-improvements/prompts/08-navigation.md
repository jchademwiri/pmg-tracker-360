# 08 – Navigation Improvement

**Purpose:** Review the current navigation and propose an improved information architecture for the Tracker app.

**Depends on:** [01-codebase-audit.md](./01-codebase-audit.md), [02-dashboard-audit.md](./02-dashboard-audit.md), [03-tender-management.md](./03-tender-management.md), [04-project-management.md](./04-project-management.md)
**Feeds into:** [10-deliverables-roadmap.md](./10-deliverables-roadmap.md)

---

## Task

Design the optimal navigation structure that maps to the actual business workflow.

---

## A. Current State Analysis

From the codebase audit, review:
- Current navigation groups and links
- Current labels and hierarchy
- Active states and indicators
- Mobile navigation behaviour

## B. Recommended Navigation Structure

### Tender Management
Consider including:
- Tender Overview (mini dashboard)
- Tender Register
- Add Tender
- Tender Calendar
- Follow-ups
- Submitted Tenders
- Awarded Tenders
- Tender Reports

### Project Management
Consider including:
- Project Overview (mini dashboard)
- Project Register
- Add Project
- Purchase Orders
- Deliveries
- Overdue Items
- Project Reports

### System / Settings
Consider whether to add:
- Settings
- User management
- Organisation management
- Notifications

## C. Navigation Placement Rules

Explain what should be in:
- **Sidebar** — persistent, always visible navigation
- **Page tabs** — secondary navigation within a module
- **Quick actions** — contextual buttons on pages
- **Breadcrumbs** — for deep navigation paths
- **Command palette** — for power users and quick access

## D. Navigation UX Patterns

Recommend:
- Collapsible sidebar vs fixed sidebar
- Section grouping and dividers
- Badge counts on navigation items (e.g., "Follow-ups (3)")
- Active state indicators
- Mobile navigation (bottom nav bar, hamburger menu, or drawer)
- Keyboard shortcuts for power users

---

## Output Format

Write your findings to `docs/audit/app-improvements/[your-name]/navigation/findings.md` using the standard template defined in [`FINDINGS-TEMPLATE.md`](./FINDINGS-TEMPLATE.md).

- Replace `[Prompt]` in the metadata with `08-navigation.md`
- Fill in all sections — delete any that don't apply
- Use the scoring rubric (1-10) consistently across all findings
- List cross-referenced findings in the Cross-References section of the template

---

## Cross-References

- **Depends on:** [01-codebase-audit.md](./01-codebase-audit.md), [02-dashboard-audit.md](./02-dashboard-audit.md), [03-tender-management.md](./03-tender-management.md), [04-project-management.md](./04-project-management.md)
- **Next:** [10-deliverables-roadmap.md](./10-deliverables-roadmap.md)
- **Related:** [06-mobile-ux.md](./06-mobile-ux.md) (mobile navigation), [05-workflow.md](./05-workflow.md) (navigation between workflow steps)
- **See also:** [00-index.md](./00-index.md) for full execution strategy
