# Phase 4: Add Unique Constraint on Invitation (organizationId, email)

**Priority:** 🟠 High  
**Estimated effort:** 2 hours  
**Files touched:** 1 (migration only, or schema + migration)  
**Depends on:** None — can be done independently

---

## Problem

The `invitation` table has no unique constraint on `(organizationId, email)`. This
means the same email address can be sent multiple pending invitations to the same
organization. Effects:

- User receives duplicate invite emails
- Two pending records exist — accepting one leaves the other as a ghost record
- Admin invite list shows the same email twice with no clear resolution

---

## Recommended approach — Partial unique index (status = 'pending')

A **full composite unique** on `(organizationId, email)` would prevent re-inviting
a user who previously had an expired or cancelled invite. That is usually too
restrictive — admins should be able to re-send an invite after the previous one
expired.

The correct constraint is: **only one pending invite per email per org at a time**.

This requires a partial unique index, which Drizzle cannot generate from a `unique()`
call. Apply it directly via migration SQL.

---

## Step 1 — Check for existing duplicate pending invitations

```sql
SELECT organization_id, email, COUNT(*) AS count
FROM invitation
WHERE status = 'pending'
GROUP BY organization_id, email
HAVING COUNT(*) > 1;
```

If duplicates exist, resolve them before adding the index. Keep the most recent
invite and cancel/expire the older ones:

```sql
-- Cancel older duplicate pending invites, keeping the latest one per org+email
UPDATE invitation
SET status = 'cancelled'
WHERE status = 'pending'
  AND id NOT IN (
    SELECT DISTINCT ON (organization_id, email) id
    FROM invitation
    WHERE status = 'pending'
    ORDER BY organization_id, email, created_at DESC
  );
```

---

## Step 2 — Option A: Schema change (Drizzle-managed)

If you want Drizzle to be aware of the constraint, update
`packages/db/src/schema.ts` and add a third argument to the `invitation` table.

> ⚠️ Drizzle `unique()` does not support `WHERE` clauses, so this creates a
> **full** composite unique (not partial). This means a cancelled or expired invite
> blocks re-inviting that email until the old record is deleted. See Option B for
> the partial approach.

```typescript
// BEFORE
export const invitation = pgTable('invitation', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: role('role'),
  status: text('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

// AFTER (full composite unique — simpler but blocks re-invite of non-active records)
export const invitation = pgTable(
  'invitation',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: role('role'),
    status: text('status').default('pending').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    inviterId: text('inviter_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    invitationOrgEmailUnique: unique('invitation_organization_id_email_unique').on(
      table.organizationId,
      table.email
    ),
  })
);
```

Then generate and run:

```bash
bun run db:generate -- --name add_invitation_org_email_unique_constraint
bun run db:migrate
```

---

## Step 2 — Option B: Partial unique index (recommended)

Skip the schema change. Create the migration manually:

```bash
bun run db:generate -- --name add_invitation_pending_unique_index
```

Open the generated migration file and replace its contents with:

```sql
-- Only one pending invite per email per org at any time.
-- Expired, cancelled, and accepted invites do not block re-inviting.
CREATE UNIQUE INDEX "invitation_organization_id_email_pending_unique"
  ON "invitation" ("organization_id", "email")
  WHERE status = 'pending';
```

Run it:

```bash
bun run db:migrate
```

> Option B is recommended. It matches the actual business rule precisely and does
> not interfere with invite history or re-invite flows.

---

## Step 3 — Audit `apps/tracker/src/server/invitations.ts` (or equivalent)

Find the `createInvitation` / `inviteUser` function. It should already check for
an existing pending invite before inserting. Verify the query looks like this:

```typescript
// ✅ CORRECT — check for existing pending invite
const existingInvite = await db
  .select()
  .from(invitation)
  .where(
    and(
      eq(invitation.organizationId, organizationId),
      eq(invitation.email, email.toLowerCase()),
      eq(invitation.status, 'pending')
    )
  )
  .limit(1);

if (existingInvite.length > 0) {
  throw new Error('A pending invitation already exists for this email address.');
}
```

If the check is missing, add it. The DB constraint is the safety net, but a
meaningful error at the application layer is better UX than a raw Postgres
constraint violation.

---

## Step 4 — Handle re-invite flow

When an admin re-invites an email that previously had an expired or cancelled
invite, the flow should:

1. Check for any existing `pending` invite → reject if found (duplicate)
2. Check for expired/cancelled invite → optionally delete or update it rather
   than inserting a new row, to keep the table clean
3. Insert the new invite record

Optional cleanup query when re-inviting:

```typescript
// Clean up old non-pending invites for this email before creating new one
await db
  .delete(invitation)
  .where(
    and(
      eq(invitation.organizationId, organizationId),
      eq(invitation.email, email.toLowerCase()),
      inArray(invitation.status, ['expired', 'cancelled'])
    )
  );
```

---

## Testing checklist

- [ ] **Duplicate pending invite (should fail):** Invite `user@example.com` to Org A,
  then immediately try to invite them again → rejected
- [ ] **Re-invite after expiry (should succeed with Option B):** Invite
  `user@example.com`, let the invite expire, then invite them again → succeeds
- [ ] **Cross-org same email (should succeed):** Invite `user@example.com` to Org A
  and also to Org B (separately) → both succeed
- [ ] **Accept then re-invite (should succeed with Option B):** Accepted invites do
  not block a new invite if the user loses access and needs to be re-invited
- [ ] **Database verification:**
  ```sql
  SELECT organization_id, email, COUNT(*)
  FROM invitation
  WHERE status = 'pending'
  GROUP BY organization_id, email
  HAVING COUNT(*) > 1;
  -- Should return 0 rows
  ```
