# 02 – Main Dashboard Audit

**Purpose:** Review the main dashboard and recommend what information should appear immediately after login, tailored to different user types.

**Depends on:** [01-codebase-audit.md](./01-codebase-audit.md) (need current dashboard state)
**Feeds into:** [03-tender-management.md](./03-tender-management.md), [04-project-management.md](./04-project-management.md), [08-navigation.md](./08-navigation.md)

---

## Task

Review the main dashboard and recommend what information should appear immediately after login. Consider different user types and their needs.

---

## A. Tender Administrator Dashboard

What should a tender administrator see first?

Consider including:
- Tenders closing soon
- Tenders requiring action today
- Briefing sessions coming up
- Tenders still in preparation
- Missing compliance documents
- Submitted tenders awaiting result
- Follow-ups due
- Recently added opportunities
- Quick action: Add Tender
- Quick action: Check New Opportunities

## B. Manager / Owner Dashboard

What should a manager see first?

Consider including:
- Total active tenders and tender pipeline value
- Win/loss rate
- Submitted vs pending tenders
- Awarded tenders
- Active projects and open POs
- Delayed POs or overdue deliveries
- Project delivery status
- Operational risk alerts
- Team workload overview
- High-value opportunities
- Quick action: Review Pipeline

## C. General System User Dashboard

What should a standard user see first?

Consider including:
- Assigned tasks
- Recent activity
- Today's deadlines
- POs requiring updates
- Projects requiring delivery confirmation
- Notifications and alerts
- Quick links to registers

## D. Dashboard Layout Recommendations

Recommend:
- Best dashboard layout and section hierarchy
- KPI card design and placement
- Charts and visualisations
- Tables and summary views
- Alert banners and notifications
- Quick action panels
- Responsive behaviour for mobile

---

## Output Format

Write your findings to `docs/audit/app-improvements/[your-name]/dashboard-audit/findings.md` using the standard template defined in [`FINDINGS-TEMPLATE.md`](./FINDINGS-TEMPLATE.md).

- Replace `[Prompt]` in the metadata with `02-dashboard-audit.md`
- Fill in all sections — delete any that don't apply
- Use the scoring rubric (1-10) consistently across all findings
- List cross-referenced findings in the Cross-References section of the template

---

## Cross-References

- **Depends on:** [01-codebase-audit.md](./01-codebase-audit.md)
- **Next:** [03-tender-management.md](./03-tender-management.md), [04-project-management.md](./04-project-management.md)
- **Related:** [06-mobile-ux.md](./06-mobile-ux.md) (dashboard on mobile), [07-premium-ui.md](./07-premium-ui.md) (visual design)
- **See also:** [00-index.md](./00-index.md) for full execution strategy
