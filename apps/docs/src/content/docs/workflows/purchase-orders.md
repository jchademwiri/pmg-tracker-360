---
title: Purchase Orders & Financial Budgeting
description: Issue, manage, and audit purchase orders and track committed supplier costs against project budgets.
---

Managing sub-contractor and supplier costs is vital to project profitability. **PMG Tracker 360** features a built-in **Purchase Order (PO) Module** that links supplier expenditure directly to active projects.

---

## 1. Creating a Purchase Order

1. Navigate to `/dashboard/billing` or inside any active project and click **Create Purchase Order**.
2. Complete the PO issue form:
   * **PO Number**: Unique purchase order number (e.g., `PO-2026-0412`).
   * **Target Project**: Select the active project this PO is billed against.
   * **Supplier / Sub-contractor Name**: Vendor receiving the order.
   * **PO Date & Expected Delivery Date**: Issuance and delivery schedule.
   * **Total PO Value**: Financial amount in ZAR.
   * **Line Items**: Itemized goods or services breakdown.

---

## 2. Real-Time Budget Auditing & Caps

When a purchase order is linked to a project, PMG Tracker 360 automatically computes project budget telemetries:

$$\text{Remaining Budget} = \text{Awarded Contract Value} - \sum \text{Issued PO Values}$$

* **Visual Progress Bar**: Displays total allocated vs remaining contract budget.
* **Budget Warning Alert**: Displays a caution notice if a new PO exceeds the available project contract value, preventing cost overruns.

---

## 3. Purchase Order Delivery Tracking

Every purchase order moves through 3 status phases:
1. **Draft**: PO created by project manager, awaiting internal approval.
2. **Sent**: Transmitted to supplier/sub-contractor.
3. **Delivered**: Supplier delivered goods/services; delivery note signed and timestamp recorded.

Once marked as **Delivered**, the purchase order is finalized into financial reports and billing statements.
