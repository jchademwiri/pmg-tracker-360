---
title: Tendering & Procurement Pipeline Flow
description: Technical mapping and operational guide of PMG Tracker 360's tendering-to-project-to-PO workflows.
---

This guide outlines the step-by-step end-to-end tendering and procurement lifecycle of **PMG Tracker 360**. It provides a comprehensive map of the database tables, state machine transitions, and operational workflows that coordinate bids, contracts, projects, and delivery milestones.

---

## 1. Pipeline Architectural Overview

Procurement in PMG Tracker progresses linearly through three distinct business phases across four linked tables in the database:

```mermaid
graph LR
    classDef table fill:#27272a,stroke:#d97706,stroke-width:2px,color:#fff;
    classDef step fill:#18181b,stroke:#a1a1aa,color:#fff;

    subgraph Phase A: Bidding (tender table)
        T1[1. Create Draft]:::step --> T2[2. Submitted / Pending]:::step
        T2 --> T3[3. Won / Awarded]:::step
    end

    subgraph Phase B: Activation (project table)
        T3 -->|Linked Import| P1[4. Active Project]:::step
    end

    subgraph Phase C: Execution (purchase_order table)
        P1 -->|Issue PO| PO1[5. Draft PO]:::step
        PO1 --> PO2[6. Sent to Supplier]:::step
        PO2 --> PO3[7. Delivered & Audited]:::step
    end

    tender[(tender)]:::table -.-> T3
    project[(project)]:::table -.-> P1
    po[(purchase_order)]:::table -.-> PO1
```

---

## 2. Table-by-Table Schema Relationships

The relational mappings declared inside the codebase schema coordinate all progressive imports:

### A. The `tender` Table
Stores high-level public/private bid metrics before operational execution begins:
* **Primary Key**: `id`
* **Foreign Key**: `clientId` (references `client.id`)
* **State Values (`status`)**: `'draft' | 'submitted' | 'won' | 'lost' | 'pending'`
* **Unique Constraint**: `tenderNumber` is validated case-insensitively to prevent duplicates within the same organization.

### B. The `project` Table
Activated only when a tender is won:
* **Primary Key**: `id`
* **Foreign Key**: `tenderId` (references `tender.id`, nullable)
* **Inheritance Rules**: Selecting a won tender automatically pre-fills the `projectNumber` (copied from `tenderNumber`), description, and client link (`clientId`).
* **State Values (`status`)**: `'active' | 'completed' | 'cancelled'`

### C. The `purchase_order` Table
Authorized and issued under the context of an active project to track financials:
* **Primary Key**: `id`
* **Foreign Key**: `projectId` (references `project.id`)
* **Financial Auditing**: Stores PO number, supplier name, and amount strings.
* **State Values (`status`)**: `'draft' | 'sent' | 'delivered'`
* **Timelines**: Track `poDate`, `expectedDeliveryDate`, and `deliveredAt`.

---

## 3. Operational State Machine Transitions

| State Action | Origin State | Destination State | Triggering Mechanism / Action |
| :--- | :--- | :--- | :--- |
| **Drafting** | None | `tender.status = 'draft'` | User fills in bid criteria under `/tenders/create`. |
| **Bidding** | `'draft'` | `tender.status = 'submitted'` | Operator submits the completed paperwork to the buyer. |
| **Awarding** | `'submitted'` | `tender.status = 'won'` | Procurement agency awards the contract; status changes to `'won'`. |
| **Activating** | `'won'` | `project.status = 'active'` | Project is created by importing the won tender. `project.tenderId` is established. |
| **Procuring** | None | `purchase_order.status = 'draft'` | Operator issues a budget order bound to `project.id`. |
| **Ordering** | `'draft'` | `purchase_order.status = 'sent'` | PO is transmitted to the sub-contractor/supplier. |
| **Fulfilling** | `'sent'` | `purchase_order.status = 'delivered'` | Goods are delivered, notes are signed, and `deliveredAt` timestamp is recorded. |

---

## 4. Business Intelligence & Reports Integration

Once a Purchase Order transitions to `delivered`, the financial engine updates the platform telemetries:
- **Won Bid Value vs. PO Allocations**: Aggregated graphs show total awarded values against actual committed supplier balances.
- **Tender Win Rates**: Calculated dynamically under `/dashboard/reports` using won-to-total ratio checks over selected periods.
