# PDF Report Catalogue

Status: Draft  
Owner: PMG Tracker 360  
Created: 2026-06-25

## Purpose

This catalogue lists the PDF reports to support in PMG Tracker 360. It defines report names, priorities, audiences, filters, and expected sections so reports are built consistently rather than randomly.

## Priority Legend

| Priority | Meaning |
|---|---|
| P0 | Required for MVP |
| P1 | Important follow-up |
| P2 | Useful later |
| P3 | Optional future enhancement |

## Tracker App Reports

### 1. Tender Register Report

Priority: P0

Purpose: Export a structured list of tenders for tracking, review, and internal reporting.

Filters:

- Status
- Client
- Priority
- Submission date range
- Search term

Sections:

- Header and selected filters
- Summary cards
- Tender register table

Columns:

- Tender number
- Client
- Description
- Status
- Priority
- Submission date
- Briefing date
- Estimated value
- Award value
- Contact person

### 2. Tender Pipeline Report

Priority: P1

Purpose: Show tenders grouped by stage, such as open, under preparation, awaiting results, awarded, and lost.

Columns:

- Tender number
- Client
- Description
- Stage/status
- Submission date
- Value
- Next action

### 3. Closing Soon Tender Report

Priority: P1

Purpose: Show tenders that require urgent attention before submission deadline.

Filters:

- Days ahead: 7, 14, 30
- Client
- Priority

Columns:

- Tender number
- Client
- Description
- Submission date
- Days remaining
- Status
- Priority

### 4. Tender Briefing Schedule Report

Priority: P1

Purpose: Show upcoming tender briefings and site meetings.

Columns:

- Tender number
- Client
- Briefing date
- Briefing location
- Contact person
- Notes

### 5. Tender Win/Loss Report

Priority: P1

Purpose: Measure tender outcomes and support performance review.

Sections:

- Win/loss summary
- Awarded tender table
- Lost tender table
- Loss reasons, where captured

### 6. Tender Validity / Extension Report

Priority: P2

Purpose: Track tender validity dates and extensions.

### 7. Tender Activity Timeline Report

Priority: P2

Purpose: Provide an audit-style timeline of actions and follow-ups for a tender.

## Project Delivery Reports

### 8. Active Projects Report

Priority: P1

Purpose: Export all active projects and their delivery state.

Columns:

- Project number
- Client
- Description
- Status
- Contract start date
- Contract end date
- Award value
- PO count
- Delivery progress

### 9. Project Status Report

Priority: P0

Purpose: Provide a management-ready status report for a specific project.

Sections:

- Project summary
- Contract information
- Purchase order summary
- Delivery summary
- Risk register
- Activity log
- Close-out status, if applicable

### 10. Project Risk Register Report

Priority: P1

Purpose: Export risks and mitigation actions linked to a project.

Columns:

- Risk title
- Category
- Probability
- Impact
- Risk level
- Mitigation
- Owner
- Due date
- Status

### 11. Project Activity Report

Priority: P2

Purpose: Show project activities, updates, and timeline entries.

### 12. Project Close-Out Report

Priority: P2

Purpose: Summarise completed projects and close-out information.

## Purchase Order and Delivery Reports

### 13. Purchase Order Register Report

Priority: P1

Purpose: Export all purchase orders for monitoring and follow-up.

Columns:

- PO number
- Project
- Client
- Supplier
- Description
- Status
- PO date
- Expected delivery date
- Total amount

### 14. Purchase Order Detail Report

Priority: P0

Purpose: Generate a formal detail report for a single purchase order.

Sections:

- PO summary
- Project/client information
- Supplier information
- Line items
- Delivery notes
- Delivery item breakdown
- Totals

Columns:

- Item number
- SAP reference
- Description
- Unit
- Quantity ordered
- Quantity delivered
- Unit price
- Subtotal
- Delivery status

### 15. PO Delivery Status Report

Priority: P1

Purpose: Track delivered, partially delivered, and outstanding purchase order quantities.

### 16. Delivery Note Report

Priority: P1

Purpose: Produce a formal report for a recorded delivery note.

### 17. Outstanding Deliveries Report

Priority: P1

Purpose: Show items that are ordered but not fully delivered.

## Client and Document Reports

### 18. Client Directory Report

Priority: P2

Purpose: Export organization client records.

### 19. Client Tender History Report

Priority: P2

Purpose: Show all tenders linked to a specific client.

### 20. Document Register Report

Priority: P2

Purpose: Export uploaded or linked documents for tenders, projects, and purchase orders.

### 21. Missing Documents Report

Priority: P3

Purpose: Identify missing required documents where document rules are later defined.

## Admin App Reports

### 22. Platform Overview Report

Priority: P0

Purpose: Summarise platform usage and operational health.

Sections:

- User metrics
- Organization metrics
- Tender/project metrics
- Session metrics
- Support and feedback metrics
- Waitlist metrics
- Plan distribution

### 23. Organization Usage Report

Priority: P0

Purpose: Show usage by organization.

Columns:

- Organization name
- Slug
- Plan
- Member count
- Tender count
- Project count
- Purchase order count
- Created date

### 24. User Register Report

Priority: P1

Purpose: Export users and membership information.

### 25. Support Tickets Report

Priority: P1

Purpose: Export support tickets for follow-up and performance review.

### 26. Feedback Report

Priority: P1

Purpose: Export user feedback for product planning.

### 27. Active Sessions Report

Priority: P1

Purpose: Show currently active sessions and session context.

### 28. Suspicious Sessions Report

Priority: P1

Purpose: Focus on sessions that need admin review.

### 29. Security Audit Log Report

Priority: P2

Purpose: Export security-sensitive platform activity.

### 30. Waitlist Report

Priority: P2

Purpose: Export waitlist records.

### 31. Pending Invitations Report

Priority: P2

Purpose: Show organization invitations that are pending or expiring soon.

## MVP Delivery Order

1. Shared PDF engine foundation
2. Tender Register Report
3. Purchase Order Detail Report
4. Project Status Report
5. Platform Overview Report
6. Organization Usage Report

## Future Report Ideas

- Monthly Tender Performance Report
- Monthly Project Delivery Report
- Supplier Performance Report
- Client Performance Report
- Overdue Actions Report
- Contract Expiry Report
- Compliance Pack Report
- Executive Summary Report
- Audit Trail Report
- Report Bundle ZIP Export
