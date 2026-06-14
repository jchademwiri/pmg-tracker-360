# 05 – End-to-End Workflow

**Purpose:** Map the full operational journey from tender discovery to project completion. Identify gaps, confusion points, and automation opportunities.

**Depends on:** [01-codebase-audit.md](./01-codebase-audit.md), [02-dashboard-audit.md](./02-dashboard-audit.md), [03-tender-management.md](./03-tender-management.md), [04-project-management.md](./04-project-management.md)
**Feeds into:** [10-deliverables-roadmap.md](./10-deliverables-roadmap.md)

---

## Task

Map the complete tender-to-project lifecycle and identify every improvement opportunity.

---

## Full Operational Journey

1. Tender opportunity discovered
2. Tender registered
3. Tender reviewed internally
4. Tender approved for preparation
5. Tender prepared
6. Tender submitted
7. Tender followed up
8. Tender result received
9. Tender awarded
10. Tender converted into project
11. Project created
12. PO created
13. PO items ordered
14. Delivery tracked
15. Partial deliveries recorded
16. PO completed
17. Project completed
18. Project archived / closed

## Analysis Required

For each step, identify:
- Missing steps that should be added
- Confusing steps that need clarification
- Duplicated steps that should be consolidated
- Poor navigation areas between steps
- Places where automation can help
- Places where notifications/reminders are needed
- Places where the UI should prevent user mistakes

## Current App Context

The Tracker app currently has two main navigation categories:

### Tender Management
This area should help users manage the full tender lifecycle:
1. Discover/check tender opportunities
2. Add/register a new tender
3. Capture tender details
4. Track briefing dates, closing dates, compulsory requirements, and submission status
5. Manage internal preparation progress
6. Track follow-ups and communication
7. Record tender extensions
8. Record outcome/result
9. Convert awarded tender into a project

### Project Management
This area should help users manage awarded work and delivery through projects and POs:
1. Create a project manually or from an awarded tender
2. Link the project to a client
3. Create and manage purchase orders
4. Track PO status
5. Track partial deliveries
6. Track pending, ordered, delivered, and completed items
7. Monitor active project progress
8. Close or complete projects once delivered

## Output

Produce a visual or structured workflow map showing:
- Each step in the lifecycle
- Current state (what exists vs what's missing)
- Recommended improvements per step
- Automation opportunities
- Notification/reminder triggers
- UI safeguards against mistakes

---

## Cross-References

- **Depends on:** [01-codebase-audit.md](./01-codebase-audit.md), [02-dashboard-audit.md](./02-dashboard-audit.md), [03-tender-management.md](./03-tender-management.md), [04-project-management.md](./04-project-management.md)
- **Next:** [10-deliverables-roadmap.md](./10-deliverables-roadmap.md)
- **Related:** [09-forms-data-capture.md](./09-forms-data-capture.md) (form UX at each step), [08-navigation.md](./08-navigation.md) (navigation between steps)
- **See also:** [00-index.md](./00-index.md) for full execution strategy
