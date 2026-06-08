# Database Layer (`packages/db`) Audit

**Area:** Database Schema, Migrations, Configuration  
**Priority:** 🔴 Critical  
**Est. Effort:** 1-2 days  
**Related Issues:** #2, #3, #6, #7, #13, #18, #19, #24

---

## Schema Overview

The database uses **Drizzle ORM** with **PostgreSQL** (via `postgres.js`). The schema defines 17+ tables across auth, organization, notification, audit, and tender management domains.

---

## Issues Found

### 🔴 Critical

| # | Issue | Details |
|---|-------|---------|
| 1 | **Schema drift between source and migrations** | `packages/db/src/schema.ts` has fields not present in `packages/db/migrations/schema.ts` (e.g., `tender.evaluationDate`, `tender.validityDays`, `tender.validityDate`, `tender.briefingDate`, `tender.briefingLocation`, `tender.isBriefingMandatory`, `tender.briefingAttended`, `purchaseOrder.poDate`, `purchaseOrder.deliveryAddress`). Migrations may not reflect the current schema. |
| 2 | **Duplicate table: `followUp` vs `tenderExtension`** | The migration schema has a `follow_up` table, while the source schema has `tender_extension`. These appear to serve the same purpose (tracking tender follow-ups/extensions). This creates confusion. |

### 🟡 Medium

| # | Issue | Details |
|---|-------|---------|
| 3 | **`value` stored as text** | Both `tender.value` and `purchaseOrder.totalAmount` are stored as `text` instead of `numeric(12,2)`. This prevents numeric sorting, aggregation, and validation at the database level. |
| 4 | **`size` stored as text** | `document.size` is stored as `text` instead of `bigint`. This prevents sorting by file size. |
| 5 | **Missing indexes** | The source schema lacks indexes on frequently queried columns: `tender.status`, `tender.clientId`, `client.organizationId`, `project.status`, `project.organizationId`. Only `tender.submission_date` has an index. |
| 6 | **Inconsistent soft-deletion** | Some tables have `deletedAt` (client, tender, project, purchaseOrder, tenderExtension) but others don't (notification, feedback, supportTickets). The pattern should be consistent. |
| 7 | **`status` fields as text** | Multiple tables use `text` for status fields (tender, project, purchaseOrder, invitation, ownershipTransfer). These should use `pgEnum` for type safety and constraint enforcement. |
| 8 | **JSON stored as text** | `securityAuditLog.details`, `sessionTracking.deviceInfo`, `sessionTracking.locationInfo`, and `organization.metadata` store JSON as `text` instead of `jsonb`. This prevents querying inside the JSON and wastes storage. |
| 9 | **No `updatedAt` trigger** | Many tables have `updatedAt` columns but no database-level trigger to auto-update them. Application code must remember to set it, which is error-prone. |

### 🟢 Low

| # | Issue | Details |
|---|-------|---------|
| 10 | **Missing `notes` column in migration** | `purchaseOrder` has `notes` in source but not in migration schema. |
| 11 | **`user.role` as text** | User roles are stored as `text` instead of using the existing `role` pgEnum. |
| 12 | **No cascade delete for `notification`** | `notification.organizationId` references organization with cascade, but there's no cleanup job for orphaned notifications when users are deleted. |
| 13 | **`verification` table lacks unique constraint** | No unique constraint on `(identifier, value)` pair, which could lead to duplicate verification records. |
| 14 | **No database-level check constraints** | Status fields lack CHECK constraints (e.g., `tender.status IN ('draft', 'open', 'submitted', ...)`). |
| 15 | **Database scripts not reviewed for safety** | `packages/db/scripts/` contains 7 utility scripts (create-admin, promote-admin, reset-db, seed-platform-org, etc.). `reset-db.ts` is particularly dangerous if accidentally run in production. These should have environment guards. |
| 16 | **Bulk import utilities lack validation** | `packages/db/imports/` contains bulk import SQL and JSON files. No validation layer exists to ensure imported data matches schema constraints. |

---

## Improvement Recommendations

### 1. Schema Consistency (High Priority)

Note: All SQL changes should be implemented as Drizzle migrations, not raw SQL.

```sql
-- Add missing indexes
CREATE INDEX idx_tender_status ON tender(status);
CREATE INDEX idx_tender_client_id ON tender(client_id);
CREATE INDEX idx_tender_org_id ON tender(organization_id);
CREATE INDEX idx_client_org_id ON client(organization_id);
CREATE INDEX idx_project_status ON project(status);
CREATE INDEX idx_project_org_id ON project(organization_id);
CREATE INDEX idx_member_org_id ON member(organization_id);
CREATE INDEX idx_member_user_id ON member(user_id);
```

### 2. Type Safety (Medium Priority)

```sql
-- Convert text status fields to enums
CREATE TYPE tender_status AS ENUM ('draft', 'open', 'submitted', 'evaluation', 'awarded', 'lost', 'cancelled');
CREATE TYPE project_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE po_status AS ENUM ('draft', 'sent', 'delivered');
```

### 3. Numeric Types (Medium Priority)

```sql
-- Convert currency fields to numeric
ALTER TABLE tender ALTER COLUMN value TYPE numeric(12,2) USING value::numeric;
ALTER TABLE purchase_order ALTER COLUMN total_amount TYPE numeric(12,2) USING total_amount::numeric;
```

### 4. JSONB Migration (Low Priority)

```sql
-- Convert JSON-as-text to jsonb
ALTER TABLE session_tracking ALTER COLUMN device_info TYPE jsonb USING device_info::jsonb;
ALTER TABLE session_tracking ALTER COLUMN location_info TYPE jsonb USING location_info::jsonb;
ALTER TABLE security_audit_log ALTER COLUMN details TYPE jsonb USING details::jsonb;
```

### 5. Connection Configuration (Medium Priority)

The `packages/db/src/client.ts` has minimal configuration:

```ts
export const client = postgres(process.env.DATABASE_URL);
```

Should add connection pool, SSL, and timeout settings for production:

```ts
export const client = postgres(process.env.DATABASE_URL, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
});
```

### 6. Auto-UpdatedAt Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updatedAt
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... repeat for session, account, organization, client, tender, project, purchase_order, tender_extension
```

---

## Files to Modify

- `packages/db/src/schema.ts` — Schema fixes, new enums
- `packages/db/src/client.ts` — Connection configuration
- `packages/db/drizzle.config.ts` — Migration config
- `packages/db/migrations/` — New migration file(s)
- `packages/db/scripts/reset-db.ts` — Add environment guard
