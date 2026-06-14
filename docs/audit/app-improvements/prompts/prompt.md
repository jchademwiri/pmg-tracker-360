# PMG Tracker 360 – Tracker App UI/UX Research, Audit, and Improvement Plan

You are a senior product designer, SaaS UX consultant, and full-stack UI engineer. I want you to deeply review and improve the **Tracker app** inside our **PMG Tracker 360 monorepo**.

The Tracker app has two core business areas:

1. **Tender Management**

   * Checking and registering tenders
   * Tracking tender progress
   * Managing submissions, follow-ups, extensions, results, and awards

2. **Project Management**

   * Creating projects from awarded tenders
   * Managing projects through purchase orders
   * Tracking POs, partial deliveries, delivery status, and project completion

Your task is to perform a full UI/UX research and improvement audit focused on making the app feel **premium, mobile-friendly, intuitive, and operationally useful**.

---


## 0. Codebase Audit Requirement

Before making any UI/UX recommendations, first perform a detailed audit of the existing codebase.

You must inspect the **PMG Tracker 360 monorepo**, with primary focus on the **Tracker app**.

Do not make assumptions about the current structure. First understand what already exists.

Audit the following:

### A. Monorepo Structure

Identify:

* The apps inside the monorepo
* The location of the Tracker app
* The framework and routing structure used
* Shared packages or components
* Shared UI libraries
* Shared database/schema packages
* Authentication and layout structure
* Existing navigation structure

### B. Tracker App Pages and Routes

Inspect and document all current Tracker routes/pages, especially:

* Main dashboard
* Tender management pages
* Tender register/list pages
* Add/edit tender pages
* Tender detail pages
* Project management pages
* Project register/list pages
* Add/edit project pages
* Project detail pages
* Purchase order pages
* Delivery-related pages, if any

For each page, explain:

* What the page currently does
* What data it displays
* What actions are available
* What components it uses
* What UX problems are visible
* What is missing compared to the intended workflow

### C. Navigation Audit

Review the current sidebar/top navigation.

Document:

* Current navigation groups
* Current links
* Current labels
* Active states
* Mobile navigation behaviour
* Whether the navigation matches the actual tender and project workflow
* Any confusing, duplicated, or missing links

Recommend improvements only after documenting the current state.

### D. Component Audit

Inspect existing UI components used in Tracker.

Identify:

* Dashboard cards
* Tables/registers
* Forms
* Buttons
* Badges
* Dialogs/modals
* Tabs
* Filters
* Search fields
* Empty states
* Loading states
* Detail page components
* Mobile-specific components, if any

For each major component, assess:

* Reusability
* Consistency
* Responsiveness
* Visual polish
* Accessibility
* Data clarity
* Whether it supports the tender/project workflow properly

### E. Database and Data Model Audit

Inspect the schema and data flow related to:

* Tenders
* Tender statuses
* Tender follow-ups
* Tender extensions
* Tender results/outcomes
* Projects
* Linked tender-to-project conversion
* Purchase orders
* PO items
* Partial deliveries
* Delivery status
* Activity logs
* Users/roles, if applicable

Document:

* Existing tables/models
* Existing fields
* Missing fields needed for the improved UX
* Status values currently used
* Whether relationships support the full tender-to-project lifecycle
* Any schema limitations affecting the UI/UX

### F. Business Logic and Workflow Audit

Inspect the existing actions, server functions, API routes, services, or mutations.

Identify how the app currently handles:

* Adding a tender
* Editing a tender
* Updating tender status
* Recording follow-ups
* Recording extensions
* Recording results
* Converting awarded tender to project
* Creating projects
* Creating purchase orders
* Updating PO statuses
* Recording partial deliveries
* Completing POs
* Completing projects

For each flow, document:

* What currently exists
* What is incomplete
* What is confusing
* What should be improved
* What should be automated
* What validations are missing

### G. Mobile Responsiveness Audit

Inspect layouts and components for mobile usability.

Check:

* Sidebar behaviour
* Header behaviour
* Dashboard layout
* Table responsiveness
* Forms on mobile
* Detail pages on mobile
* Action buttons on mobile
* Filters/search on mobile
* Whether registers become usable mobile cards
* Whether important actions remain accessible on small screens

### H. Visual Design Audit

Review the current visual quality of the Tracker app.

Assess:

* Spacing
* Typography
* Card design
* Colour usage
* Status colours
* Button hierarchy
* Icon usage
* Page headers
* Section hierarchy
* Empty states
* Loading states
* Error/success states
* Overall premium SaaS feel

### I. Audit Output Required Before Recommendations

Before proposing new designs, provide a clear audit summary:

1. Current route structure
2. Current navigation structure
3. Current dashboard structure
4. Current tender management flow
5. Current project management flow
6. Current PO management flow
7. Existing reusable components
8. Existing database/schema support
9. Existing mobile issues
10. Existing UI polish issues
11. Missing workflow steps
12. Highest-risk UX gaps

Only after this audit should you propose the improved dashboard, Tender Management mini dashboard, Project Management mini dashboard, workflows, route structure, component structure, and phased implementation roadmap.



## 1. Research Objective

Research best practices from modern SaaS platforms, tender/procurement systems, CRM pipelines, project management tools, ERP dashboards, and PO tracking systems.

Focus especially on:

* Dashboard design best practices
* Tender pipeline UX
* Project and PO management UX
* Mobile-first admin interfaces
* Premium SaaS layout patterns
* KPI cards and operational summaries
* Register/table design
* Status-driven workflows
* Quick actions and contextual navigation
* Empty states, loading states, filters, search, and bulk actions

Use this research to propose an improved structure and user journey for the Tracker app.

---

## 2. Current App Context

The Tracker app currently has two main navigation categories:

### A. Tender Management

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

### B. Project Management

This area should help users manage awarded work and delivery through projects and POs:

1. Create a project manually or from an awarded tender
2. Link the project to a client
3. Create and manage purchase orders
4. Track PO status
5. Track partial deliveries
6. Track pending, ordered, delivered, and completed items
7. Monitor active project progress
8. Close or complete projects once delivered

---

## 3. Main Dashboard Audit

Review the main dashboard and recommend what information should appear immediately after login.

Consider different user types:

### Tender Administrator

What should a tender administrator see first?

Examples to consider:

* Tenders closing soon
* Tenders requiring action today
* Briefing sessions coming up
* Tenders still in preparation
* Missing compliance documents
* Submitted tenders awaiting result
* Follow-ups due
* Recently added opportunities
* Quick action: Add Tender
* Quick action: Check New Opportunities

### Manager / Owner

What should a manager see first?

Examples to consider:

* Total active tenders
* Tender pipeline value
* Win/loss rate
* Submitted vs pending tenders
* Awarded tenders
* Active projects
* Open POs
* Delayed POs or overdue deliveries
* Project delivery status
* Operational risk alerts
* Team workload overview
* High-value opportunities
* Quick action: Review Pipeline

### General System User

What should a standard user see first?

Examples to consider:

* Assigned tasks
* Recent activity
* Today’s deadlines
* POs requiring updates
* Projects requiring delivery confirmation
* Notifications and alerts
* Quick links to registers

Recommend the best dashboard layout, sections, KPI cards, charts, tables, alerts, and quick actions.

---

## 4. Tender Management Mini Dashboard

When the user clicks **Tender Management**, the first page should not just be a table. It should be a mini dashboard for the tender module.

Propose a premium, intuitive layout for the tender landing page.

Include recommendations for:

### Tender Overview Section

Suggest KPI cards such as:

* Total active tenders
* Closing this week
* Closing today
* Briefing sessions upcoming
* In preparation
* Submitted
* Awaiting result
* Awarded
* Lost / unsuccessful
* Extensions recorded
* Follow-ups due

### Tender Pipeline View

Recommend a status-based pipeline such as:

* New Opportunity
* To Review
* Approved to Prepare
* In Preparation
* Ready for Submission
* Submitted
* Awaiting Result
* Awarded
* Lost / Cancelled

### Tender Register

Recommend how the tender register should be structured.

Include suggestions for:

* Columns
* Filters
* Search
* Status badges
* Date indicators
* Risk indicators
* Priority labels
* Row actions
* Bulk actions
* Mobile table/card layout

### Tender Detail Page

Recommend the ideal structure for a tender detail page.

Suggested sections:

* Tender summary
* Client / municipality / department
* Reference number
* Description
* Closing date and time
* Briefing session details
* Compulsory requirements
* Documents checklist
* Internal preparation checklist
* Pricing status
* Submission status
* Communication and follow-up log
* Extension history
* Result/outcome
* Award conversion action

### Tender Workflow Improvements

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

Recommend any missing steps, validations, automation opportunities, or UX improvements.

---

## 5. Project Management Mini Dashboard

When the user clicks **Project Management**, the first page should be a project and PO mini dashboard.

This page should quickly communicate the health of active projects and purchase orders.

Recommend a premium, intuitive layout for the project landing page.

Include recommendations for:

### Project Overview Section

Suggest KPI cards such as:

* Total active projects
* Projects created from awarded tenders
* Projects in progress
* Projects awaiting PO
* Projects with open POs
* Projects delayed
* Projects completed this month
* Total PO value
* Pending PO value
* Delivered PO value
* Partially delivered POs
* Overdue deliveries

### Project Register

Recommend how the project register should be structured.

Include suggestions for:

* Columns
* Filters
* Search
* Status badges
* Progress indicators
* Client filters
* PO status indicators
* Row actions
* Mobile card layout

### Project Detail Page

Recommend the ideal structure for a project detail page.

Suggested sections:

* Project summary
* Linked tender details, if applicable
* Client details
* Contract / appointment details
* Start date and expected completion date
* Project status
* PO summary
* Delivery progress
* Documents
* Activity log
* Notes
* Risks/issues
* Completion status

### Purchase Order Management

Audit and improve the PO flow.

The app should support:

1. Create PO under project
2. Capture PO number
3. Capture supplier/client details where applicable
4. Add PO items
5. Track ordered items
6. Track partial deliveries
7. Track fully delivered items
8. Track outstanding quantities
9. Track delivery notes
10. Track invoices, if applicable
11. Mark PO as complete
12. Link PO status back to project progress

Recommend the ideal PO statuses.

Example statuses:

* Draft
* Issued
* Awaiting Delivery
* Partially Delivered
* Delivered
* Completed
* Cancelled
* Disputed / On Hold

Recommend the best UI for PO tables, PO detail pages, delivery tracking, and partial delivery handling.

---

## 6. Full End-to-End Workflow

Map the full operational journey from tender discovery to project completion.

The flow should include:

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

Identify:

* Missing steps
* Confusing steps
* Duplicated steps
* Poor navigation areas
* Places where automation can help
* Places where notifications/reminders are needed
* Places where the UI should prevent user mistakes

---

## 7. Mobile-Friendly UX Requirements

The improved UI must work well on mobile.

Review and recommend:

* Mobile navigation structure
* Bottom nav vs sidebar behaviour
* Table-to-card conversion for small screens
* Sticky action buttons
* Compact KPI cards
* Mobile-friendly forms
* Step-by-step form flows
* Search and filter drawers
* Touch-friendly buttons
* Reduced clutter on small screens

Suggest how tender registers, project registers, and PO registers should look on mobile.

---

## 8. Premium SaaS UI Direction

Recommend a premium design direction for the Tracker app.

Consider:

* Clean dashboard layout
* Modern cards
* Strong spacing
* Clear typography hierarchy
* Status badges
* Progress indicators
* Empty states
* Alert banners
* Quick actions
* Command palette, if useful
* Timeline/activity log components
* Tabbed detail pages
* Responsive layouts
* High-quality loading skeletons
* Professional colour usage
* Consistent icon system

The design must feel suitable for a serious business operations platform, not a basic admin panel.

---

## 9. Navigation Improvement

Review the current navigation and propose an improved information architecture.

Current main categories:

1. Tender Management
2. Project Management

Recommend whether the navigation should include additional links such as:

### Tender Management

* Tender Overview
* Tender Register
* Add Tender
* Tender Calendar
* Follow-ups
* Submitted Tenders
* Awarded Tenders
* Tender Reports

### Project Management

* Project Overview
* Project Register
* Add Project
* Purchase Orders
* Deliveries
* Overdue Items
* Project Reports

Explain what should be in the sidebar, what should be in page tabs, and what should be available as quick actions.

---

## 10. Forms and Data Capture UX

Audit the forms for:

* Adding a tender
* Editing a tender
* Recording tender follow-ups
* Recording extensions
* Recording results
* Creating a project
* Creating a PO
* Recording partial delivery
* Completing a PO
* Completing a project

Recommend improvements such as:

* Multi-step forms
* Smart defaults
* Required field grouping
* Inline validation
* Save as draft
* Auto-generated statuses
* Conditional fields
* Attachment uploads
* Confirmation screens
* Better error messages
* Better success messages

---

## 11. Deliverables Required

Produce a detailed UI/UX improvement report with the following sections:

1. Executive summary
2. Current app understanding
3. Main dashboard recommendations
4. Tender Management mini dashboard recommendations
5. Tender Register recommendations
6. Tender detail page recommendations
7. Tender workflow improvements
8. Project Management mini dashboard recommendations
9. Project Register recommendations
10. Project detail page recommendations
11. PO management recommendations
12. End-to-end tender-to-project workflow map
13. Navigation and information architecture proposal
14. Mobile UX recommendations
15. Premium UI design system recommendations
16. Missing features or improvement opportunities
17. Prioritised implementation roadmap
18. Suggested page structure and route structure
19. Suggested components to build or improve
20. Final recommended user journey

---

## 12. Implementation Output

After completing the research and audit, provide:

### A. Recommended Routes

Suggest a clean route structure, for example:

* `/dashboard`
* `/tenders`
* `/tenders/register`
* `/tenders/new`
* `/tenders/calendar`
* `/tenders/follow-ups`
* `/tenders/submitted`
* `/tenders/awarded`
* `/tenders/[id]`
* `/projects`
* `/projects/register`
* `/projects/new`
* `/projects/[id]`
* `/projects/[id]/purchase-orders`
* `/purchase-orders`
* `/purchase-orders/[id]`

### B. Recommended Components

Suggest reusable UI components such as:

* KPI cards
* Status badge
* Tender pipeline board
* Project progress card
* PO status card
* Deadline alert card
* Register table
* Mobile register card
* Activity timeline
* Follow-up log
* Extension history
* Document checklist
* Empty state
* Quick action panel
* Filter drawer
* Command menu

### C. Recommended Database/Status Improvements

If the current schema does not support the improved UX, suggest additional fields or status values needed for:

* Tender stage
* Tender priority
* Tender risk level
* Tender follow-up date
* Tender extension history
* Tender outcome
* Project source tender ID
* Project status
* PO status
* PO delivery status
* PO item quantity ordered
* PO item quantity delivered
* PO item outstanding quantity
* Delivery notes
* Activity logs

### D. Prioritised Roadmap

Break the implementation into phases:

#### Phase 1: Navigation and dashboard polish

#### Phase 2: Tender mini dashboard and register improvements

#### Phase 3: Tender detail page and workflow improvements

#### Phase 4: Project mini dashboard and project register improvements

#### Phase 5: PO tracking and partial delivery improvements

#### Phase 6: Mobile optimisation and premium UI polish

#### Phase 7: Reporting, alerts, and automation

For each phase, include:

* Objective
* Pages affected
* Components needed
* Expected UX improvement
* Development notes

---

## 13. Final Goal

The final recommendation must help us turn the Tracker app into a premium, mobile-friendly, operational SaaS platform where:

* A tender administrator immediately knows what to work on
* A manager immediately sees operational performance and risks
* A user can easily move from tender opportunity to awarded project
* Projects and POs are clearly tracked
* Partial deliveries are easy to record
* Statuses are clear
* Navigation is intuitive
* Mobile usage is practical
* The UI feels polished, modern, and professional

Be specific, practical, and implementation-ready.
