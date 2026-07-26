---
title: Workspace Setup & Settings
description: Detailed guide to managing tenant organization settings, workspace slugs, and profile branding in PMG Tracker 360.
---

Organizations in **PMG Tracker 360** act as isolated operational environments. This guide explains how to manage workspace metadata, configure company branding, and manage organization limits.

---

## 1. Managing Workspace Profile & Details

Organization Owners and Admins can manage organization settings via `/dashboard/organization`:

* **Organization Name**: Update the official display name of your business entity.
* **Workspace Slug**: Unique URL slug used for workspace routing. Modifying the slug updates workspace URLs for all team members.
* **Company Logo & Icon**: Upload brand logos used in exported reports and purchase order headers.
* **Tax & Registration Numbers**: Store VAT numbers, CIPC registration numbers, and official business address details for billing.

---

## 2. Organization Limits & Subscription Caps

Your organization capability and resource allowances depend on your active plan tier:

| Feature Limit | Free Plan | Starter Plan | Pro Plan |
| :--- | :--- | :--- | :--- |
| **Owned Organizations** | 1 Workspace | 1 Workspace | Up to 2 Workspaces |
| **Active Projects** | Unlimited | Unlimited | Unlimited |
| **Team Members** | Up to 3 Users | Up to 10 Users | Unlimited Users |
| **Storage Allocation** | 100 MB | 5 GB | 20 GB |

> [!TIP]
> If your company requires managing multiple subsidiary entities or separate bidding divisions, upgrade to the **Pro Plan** under `/dashboard/billing` to create additional tenant workspaces under a single user account.

---

## 3. Deleting or Deactivating a Workspace

* Only the **Organization Owner** can initiate workspace deletion or deactivation.
* Deleting a workspace permanently archives all associated tenders, projects, purchase orders, and team memberships.
* A mandatory confirmation modal requiring the workspace slug name must be completed before deletion is executed.
