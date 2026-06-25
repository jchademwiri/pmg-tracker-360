# PDF Report Catalogue

Status: Draft  
Owner: PMG Tracker 360  
Created: 2026-06-25

## 1. Purpose

This document lists the PDF reports that should be supported by PMG Tracker 360. It defines the purpose, priority, audience, filters, and expected content of each report.

The catalogue prevents random report creation by giving the team a controlled list of reports to design, build, test, and release over time.

## 2. Report Categories

Reports are grouped into two applications:

```txt
Tracker App Reports
Admin App Reports
```

Tracker reports focus on tenant operations: tenders, projects, purchase orders, delivery, clients, risks, activities, and documents.

Admin reports focus on platform operations: organizations, users, usage, support, feedback, sessions, security, waitlist, and system health.

## 3. Priority Levels

| Priority | Meaning |
|---|---|
| P0 | Required for MVP |
| P1 | Important follow-up after MVP |
| P2 | Useful later |
| P3 | Optional/future enhancement |

## 4. Tracker App Reports

### 4.1 Tender Register Report

Priority: P0  
Audience: Tender admins, contractors, managers  
Purpose: Export a structured list of tenders for tracking, review, and internal reporting.

Recommended filters:

- Status
- Client
- Priority
- Submission date range
- Search term

Recommended sections:

- Report header and selected filters
- Summary cards: total tenders, open tenders, awarded tenders, lost tenders, pending/evaluation tenders
- Tender register table

Recommended columns:

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

### 4.2 Tender Pipeline Report

Priority: P1  
Audience: Tender admins, management  
Purpose: Show tenders grouped by current pipeline stage.

Recommended filters:

- Status group
- Client
- Submission date range
- Priority

Recommended sections:

- Pipeline summary
- Open/under preparation tenders
- Awaiting results tenders
- Awarded tenders
- Lost tenders

Recommended columns:

- Tender number
- Client
- Description
- Stage/status
- Submission date
- Value
- Next action

### 4.3 Closing Soon Tender Report

Priority: P1  
Audience: Tender admins, management  
Purpose: Show tenders that require urgent attention before submission deadline.

Recommended filters:

- Days ahead: 7, 14, 30
- Client
- Priority

Recommended sections:

- Urgency summary
- Closing soon tender table

Recommended columns:

- Tender number
- Client
- Description
- Submission date
- Days remaining
- Status
- Priority
- Responsible person, if available

### 4.4 Tender Briefing Schedule Report

Priority: P1  
Audience: Tender admins, staff attending briefings  
Purpose: Show upcoming tender briefings/site meetings.

Recommended filters:

- Date range
- Client
- Compulsory/non-compulsory, if available

Recommended columns:

- Tender number
- Client
- Briefing date
- Briefing location
- Contact person
- Notes

### 4.5 Tender Win/Loss Report

Priority: P1  
Audience: Business owners, managers, tender admins  
Purpose: Measure tender outcomes and identify performance patterns.

Recommended filters:

- Date range
- Client
- Status

Recommended sections:

- Win/loss summary
- Awarded tender table
- Lost tender table
- Loss reasons, where captured

Recommended columns:

- Tender number
- Client
- Description
- Submitted value
- Award value
- Result
- Loss reason
- Evaluation notes

### 4.6 Tender Validity / Extension Report

Priority: P2  
Audience: Tender admins  
Purpose: Track tender validity periods and extensions.

Recommended filters:

- Expiring within days
- Client
- Status

Recommended columns:

- Tender number
- Client
- Original validity date
- Extended validity date
- Extension status
- Notes

### 4.7 Tender Activity Timeline Report

Priority: P2  
Audience: Tender admins, managers  
Purpose: Provide an audit-style timeline of actions and follow-ups for a tender.

Recommended filters:

- Tender
- Date range
- Activity type

Recommended columns:

- Date
- User
- Activity type
- Description
- Notes

## 5. Project Delivery Reports

### 5.1 Active Projects Report

Priority: P1  
Audience: Project managers, contractors, management  
Purpose: Export all active projects and their current delivery state.

Recommended filters:

- Status
- Client
- Contract date range

Recommended columns:

- Project number
- Client
- Description
- Status
- Contract start date
- Contract end date
- Award value
- PO count
- Delivery progress

### 5.2 Project Status Report

Priority: P0  
Audience: Project managers, management, contractors  
Purpose: Provide a management-ready status report for a specific project.

Recommended filters:

- Project ID

Recommended sections:

- Project summary
- Contract information
- Purchase order summary
- Delivery summary
- Risk register
- Activity log
- Close-out status, if applicable

Recommended columns:

- Purchase order number
- Supplier
- Status
- PO date
- Expected delivery date
- Total amount
- Delivered value

### 5.3 Project Risk Register Report

Priority: P1  
Audience: Project managers, management  
Purpose: Export risks and mitigation actions linked to a project.

Recommended filters:

- Project
- Risk level
- Status

Recommended columns:

- Risk title
- Category
- Probability
- Impact
- Risk level
- Mitigation
- Owner
- Due date
- Status

### 5.4 Project Activity Report

Priority: P2  
Audience: Project managers  
Purpose: Show project activities, updates, and timeline entries.

Recommended filters:

- Project
- Activity type
- Date range

Recommended columns:

- Date
- User
- Type
- Description
- Notes

### 5.5 Project Close-Out Report

Priority: P2  
Audience: Project managers, compliance/admin users  
Purpose: Summarise completed projects and close-out information.

Recommended filters:

- Project
- Close-out status
- Completion date range

Recommended sections:

- Project summary
- Final delivery state
- Outstanding issues
- Documents
- Lessons learned, if captured

## 6. Purchase Order and Delivery Reports

### 6.1 Purchase Order Register Report

Priority: P1  
Audience: Procurement officers, project managers  
Purpose: Export all purchase orders for monitoring and follow-up.

Recommended filters:

- Status
- Project
- Supplier
- PO date range

Recommended columns:

- PO number
- Project
- Client
- Supplier
- Description
- Status
- PO date
- Expected delivery date
- Total amount

### 6.2 Purchase Order Detail Report

Priority: P0  
Audience: Procurement officers, project managers, suppliers  
Purpose: Generate a formal detail report for a single purchase order.

Recommended filters:

- Purchase order ID

Recommended sections:

- PO summary
- Project/client information
- Supplier information
- Line items
- Delivery notes
- Delivery item breakdown
- Totals

Recommended columns:

- Item number
- SAP reference
- Description
- Unit
- Quantity ordered
- Quantity delivered
- Unit price
- Subtotal
- Delivery status

### 6.3 PO Delivery Status Report

Priority: P1  
Audience: Project managers, procurement officers  
Purpose: Track delivered, partially delivered, and outstanding purchase order quantities.

Recommended filters:

- Project
- Supplier
- Status
- Expected delivery date range

Recommended columns:

- PO number
- Project
- Supplier
- Item description
- Quantity ordered
- Quantity delivered
- Outstanding quantity
- Delivery value
- Status

### 6.4 Delivery Note Report

Priority: P1  
Audience: Project managers, procurement officers  
Purpose: Produce a formal report for a recorded delivery note.

Recommended filters:

- Delivery note ID

Recommended sections:

- Delivery note summary
- Related purchase order
- Project/client information
- Delivered items
- Recipient information
- POD file reference, if available

### 6.5 Outstanding Deliveries Report

Priority: P1  
Audience: Project managers, procurement officers  
Purpose: Show items that are ordered but not fully delivered.

Recommended filters:

- Project
- Supplier
- Expected delivery date range

Recommended columns:

- Project
- PO number
- Supplier
- Item
- Quantity ordered
- Quantity delivered
- Outstanding quantity
- Expected delivery date

## 7. Client and Document Reports

### 7.1 Client Directory Report

Priority: P2  
Audience: Organization users  
Purpose: Export organization client records.

Recommended filters:

- Search term
- Active/deleted status, if applicable

Recommended columns:

- Client name
- Contact person
- Email
- Phone
- Notes

### 7.2 Client Tender History Report

Priority: P2  
Audience: Tender admins, managers  
Purpose: Show all tenders linked to a specific client.

Recommended filters:

- Client ID
- Date range
- Status

Recommended columns:

- Tender number
- Description
- Status
- Submission date
- Value
- Award value

### 7.3 Document Register Report

Priority: P2  
Audience: Organization users, compliance users  
Purpose: Export uploaded/linked documents for tenders/projects/POs.

Recommended filters:

- Linked entity type
- Entity ID
- Document type

Recommended columns:

- Document name
- Type
- Linked record
- Uploaded date
- Uploaded by

### 7.4 Missing Documents Report

Priority: P3  
Audience: Compliance/admin users  
Purpose: Identify missing required documents where document rules are later defined.

Recommended filters:

- Entity type
- Required document type

## 8. Admin App Reports

### 8.1 Platform Overview Report

Priority: P0  
Audience: Platform administrators  
Purpose: Summarise platform usage and operational health.

Recommended sections:

- User metrics
- Organization metrics
- Tender/project metrics
- Session/security metrics
- Support and feedback metrics
- Waitlist metrics
- Plan distribution

Recommended summary cards:

- Total users
- New users this week
- Active organizations
- New organizations this week
- Total tenders
- Active projects
- Live sessions
- Suspicious sessions
- Open tickets
- Waitlist total

### 8.2 Organization Usage Report

Priority: P0  
Audience: Platform administrators  
Purpose: Show usage by organization.

Recommended filters:

- Organization
- Plan
- Status

Recommended columns:

- Organization name
- Slug
- Plan
- Member count
- Tender count
- Project count
- Purchase order count
- Created date

### 8.3 User Register Report

Priority: P1  
Audience: Platform administrators  
Purpose: Export users and membership information.

Recommended filters:

- Search term
- Verified/unverified
- Role
- Organization

Recommended columns:

- Name
- Email
- Email verified
- Role
- Organizations
- Created date
- Last activity, if available

### 8.4 Support Tickets Report

Priority: P1  
Audience: Platform administrators, support staff  
Purpose: Export support tickets for follow-up and performance review.

Recommended filters:

- Status
- Priority
- Date range

Recommended columns:

- Ticket number/ID
- Subject
- User
- Organization
- Status
- Priority
- Created date
- Updated date

### 8.5 Feedback Report

Priority: P1  
Audience: Platform administrators, product owners  
Purpose: Export user feedback for product planning.

Recommended filters:

- Type/category
- Date range
- Status, if available

Recommended columns:

- User
- Organization
- Type/category
- Message summary
- Created date

### 8.6 Active Sessions Report

Priority: P1  
Audience: Platform administrators, security reviewers  
Purpose: Show currently active sessions and session context.

Recommended filters:

- Suspicious only
- User
- Date range

Recommended columns:

- User
- Email
- IP address
- Device/browser
- Location, if available
- Last active
- Suspicious flag

### 8.7 Suspicious Sessions Report

Priority: P1  
Audience: Platform administrators, security reviewers  
Purpose: Focus specifically on flagged or suspicious sessions.

Recommended columns:

- User
- Email
- IP address
- Reason/flag
- Last active
- Created date

### 8.8 Security Audit Log Report

Priority: P2  
Audience: Platform administrators  
Purpose: Export security-sensitive activity.

Recommended filters:

- User
- Action type
- Date range

Recommended columns:

- Date
- User
- Action
- Entity
- IP/device details

### 8.9 Waitlist Report

Priority: P2  
Audience: Platform administrators, growth/sales users  
Purpose: Export waitlist records.

Recommended filters:

- Date range
- Source, if available

Recommended columns:

- Name
- Email
- Company
- Use case
- Created date

### 8.10 Pending Invitations Report

Priority: P2  
Audience: Platform administrators  
Purpose: Show organization invitations that are pending or expiring soon.

Recommended filters:

- Organization
- Expiring within days

Recommended columns:

- Email
- Organization
- Role
- Status
- Expires at

## 9. MVP Delivery Order

Recommended order:

1. Shared PDF engine foundation
2. Tender Register Report
3. Purchase Order Detail Report
4. Project Status Report
5. Platform Overview Report
6. Organization Usage Report

## 10. Future Report Ideas

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
