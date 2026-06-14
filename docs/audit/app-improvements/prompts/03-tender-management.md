# 03 – Tender Management Mini Dashboard

**Purpose:** When the user clicks **Tender Management**, the first page should be a mini dashboard for the tender module — not just a table. Propose a premium, intuitive layout for the tender landing page, register, detail page, and workflow.

**Depends on:** [01-codebase-audit.md](./01-codebase-audit.md), [02-dashboard-audit.md](./02-dashboard-audit.md)
**Feeds into:** [05-workflow.md](./05-workflow.md), [09-forms-data-capture.md](./09-forms-data-capture.md)

---

## A. Tender Overview Section

Suggest KPI cards such as:
- Total active tenders
- Closing this week / Closing today
- Briefing sessions upcoming
- In preparation
- Submitted
- Awaiting result
- Awarded
- Lost / unsuccessful
- Extensions recorded
- Follow-ups due

## B. Tender Pipeline View

Recommend a status-based pipeline:
- New Opportunity → To Review → Approved to Prepare → In Preparation → Ready for Submission → Submitted → Awaiting Result → Awarded / Lost / Cancelled

## C. Tender Register

Recommend how the tender register should be structured:
- Columns, filters, search
- Status badges, date indicators, risk indicators, priority labels
- Row actions and bulk actions
- Mobile table/card layout

## D. Tender Detail Page

Recommend the ideal structure:
- Tender summary (client/municipality/department, reference number, description)
- Closing date and time
- Briefing session details
- Compulsory requirements
- Documents checklist
- Internal preparation checklist
- Pricing status
- Submission status
- Communication and follow-up log
- Extension history
- Result/outcome
- Award conversion action

## E. Tender Workflow Improvements

Audit and improve the full tender flow:
1. Add new tender
2. Capture tender details
3. Assign internal owner
4. Add deadlines and briefing dates
5. Track documents required
6. Track pricing/preparation progress
7. Submit tender
8. Record proof of submission
9. Track follow-up dates
10. Record extensions
11. Record result
12. Convert awarded tender into a project

Recommend missing steps, validations, automation opportunities, or UX improvements.

---

## Output Format

Write your findings to `docs/audit/app-improvements/[your-name]/tender-management/findings.md` using the standard template defined in [`FINDINGS-TEMPLATE.md`](./FINDINGS-TEMPLATE.md).

- Replace `[Prompt]` in the metadata with `03-tender-management.md`
- Fill in all sections — delete any that don't apply
- Use the scoring rubric (1-10) consistently across all findings
- List cross-referenced findings in the Cross-References section of the template

---

## Cross-References

- **Depends on:** [01-codebase-audit.md](./01-codebase-audit.md), [02-dashboard-audit.md](./02-dashboard-audit.md)
- **Next:** [05-workflow.md](./05-workflow.md), [09-forms-data-capture.md](./09-forms-data-capture.md)
- **Related:** [04-project-management.md](./04-project-management.md) (tender-to-project handoff), [06-mobile-ux.md](./06-mobile-ux.md) (tender views on mobile)
- **See also:** [00-index.md](./00-index.md) for full execution strategy
