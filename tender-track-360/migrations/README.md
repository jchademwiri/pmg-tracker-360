# Database Migration for Organization Deletion & Advanced Features

This migration adds support for:

- Soft deletion of organizations with grace period
- Ownership transfer functionality
- Bulk operations management
- Enhanced security audit logging
- Session tracking and monitoring

## How to Apply the Migration

### Option 1: Using psql (PostgreSQL)

```bash
psql -d your_database_name -f migrations/add-soft-deletion-columns.sql
```

### Option 2: Using your database client

Copy and paste the contents of `add-soft-deletion-columns.sql` into your database client and execute.

### Option 3: Using Drizzle (if configured)

```bash
npx drizzle-kit push:pg
```

## After Migration

Once the migration is applied, you can re-enable soft deletion filtering in the code by updating `src/server/organizations.ts`:

1. Uncomment the soft deletion filters in the query functions
2. Change queries like:
   ```typescript
   where: eq(organization.slug, slug);
   ```
   to:
   ```typescript
   where: and(eq(organization.slug, slug), isNull(organization.deletedAt));
   ```

## New Features Available

### 1. Organization Soft Deletion

- Navigate to `/dashboard/settings/organisation/[organizationId]/danger`
- Only organization owners can access the danger zone
- Multi-step confirmation process with organization name verification
- 30-day grace period for restoration
- Data export before deletion

### 2. Ownership Transfer

- Two-step process with email notifications
- Transfer expires after 72 hours
- Only admins/managers can receive ownership
- Complete audit trail

### 3. Bulk Operations

- Bulk role changes with individual validation
- Bulk member removal with confirmation
- Bulk invitation management
- Progress tracking and rollback support

### 4. Enhanced Security

- Session tracking with device fingerprinting
- Suspicious activity detection
- Comprehensive audit logging
- IP address and user agent tracking

## Database Schema Changes

### New Columns Added

- `organization.deleted_at` - Soft deletion timestamp
- `organization.deleted_by` - User who deleted the organization
- `organization.deletion_reason` - Reason for deletion
- `organization.permanent_deletion_scheduled_at` - When permanent deletion is scheduled
- Similar soft deletion columns for `tender`, `follow_up`, and `contract` tables

### New Tables Created

- `ownership_transfer` - Tracks ownership transfers
- `security_audit_log` - Security events and audit trail
- `organization_deletion_log` - Deletion and restoration log
- `session_tracking` - Enhanced session tracking
- `organization_security_settings` - Organization security configuration

## Rollback

If you need to rollback this migration, run:

```sql
-- Remove new tables
DROP TABLE IF EXISTS organization_security_settings;
DROP TABLE IF EXISTS session_tracking;
DROP TABLE IF EXISTS organization_deletion_log;
DROP TABLE IF EXISTS security_audit_log;
DROP TABLE IF EXISTS ownership_transfer;

-- Remove new columns from existing tables
ALTER TABLE organization
DROP COLUMN IF EXISTS deleted_at,
DROP COLUMN IF EXISTS deleted_by,
DROP COLUMN IF EXISTS deletion_reason,
DROP COLUMN IF EXISTS permanent_deletion_scheduled_at;

ALTER TABLE tender
DROP COLUMN IF EXISTS deleted_at,
DROP COLUMN IF EXISTS deleted_by;

ALTER TABLE follow_up
DROP COLUMN IF EXISTS deleted_at,
DROP COLUMN IF EXISTS deleted_by;

ALTER TABLE contract
DROP COLUMN IF EXISTS deleted_at,
DROP COLUMN IF EXISTS deleted_by;
```

## Testing

After migration, test the following:

1. Organization listing still works
2. Organization access by slug works
3. Member management functions properly
4. New danger zone page is accessible to owners
5. Soft deletion and restoration work correctly

## Support

If you encounter any issues with the migration, check:

1. Database user has sufficient privileges
2. All referenced tables exist
3. No naming conflicts with existing columns
4. PostgreSQL version supports the syntax used
