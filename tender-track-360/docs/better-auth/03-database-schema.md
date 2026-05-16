# Database Schema - Understanding Your Auth Tables

## Overview

Your Better Auth setup uses PostgreSQL with Drizzle ORM. The schema includes core authentication tables plus organization-specific tables for multi-tenancy. Let's explore each table and how they work together.

## Core Authentication Tables

### 1. User Table

The main user account information:

```typescript
export const user = pgTable('user', {
  id: text('id').primaryKey(), // Unique user ID
  name: text('name').notNull(), // Display name
  email: text('email').notNull().unique(), // Email (unique)
  emailVerified: boolean('email_verified').defaultFn(() => false),
  image: text('image'), // Profile picture URL
  createdAt: timestamp('created_at'), // Account creation
  updatedAt: timestamp('updated_at'), // Last update
});
```

**Key Points:**

- Email must be unique across the entire system
- Email verification is required (`emailVerified: false` by default)
- Profile images are stored as URLs (not files)

### 2. Session Table

Manages user login sessions:

```typescript
export const session = pgTable('session', {
  id: text('id').primaryKey(), // Session ID
  expiresAt: timestamp('expires_at'), // When session expires
  token: text('token').unique(), // Session token
  userId: text('user_id').references(() => user.id),
  activeOrganizationId: text('active_organization_id'), // Current org
  ipAddress: text('ip_address'), // Security tracking
  userAgent: text('user_agent'), // Browser info
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});
```

**Key Points:**

- Each session is linked to a user
- `activeOrganizationId` tracks which org the user is currently working in
- IP and user agent help with security monitoring
- Sessions automatically expire

### 3. Account Table

Handles password and social login data:

```typescript
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id'), // Provider-specific ID
  providerId: text('provider_id'), // 'credential' or 'google'
  userId: text('user_id').references(() => user.id),
  password: text('password'), // Hashed password
  accessToken: text('access_token'), // OAuth tokens
  refreshToken: text('refresh_token'),
  // ... other OAuth fields
});
```

**Key Points:**

- One user can have multiple accounts (email + Google)
- Passwords are automatically hashed by Better Auth
- OAuth tokens are stored for social logins

### 4. Verification Table

Manages email verification and password reset tokens:

```typescript
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier'), // Email address
  value: text('value'), // Verification token
  expiresAt: timestamp('expires_at'), // Token expiration
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});
```

**Key Points:**

- Used for email verification and password resets
- Tokens automatically expire (1 hour by default)
- One-time use tokens

## Organization Tables (Multi-Tenancy)

### 5. Organization Table

Your business organizations:

```typescript
export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // "Acme Corp"
  slug: text('slug').unique(), // "acme-corp" (URL-friendly)
  logo: text('logo'), // Logo URL
  createdAt: timestamp('created_at'),
  metadata: text('metadata'), // JSON for extra data
});
```

**Key Points:**

- Each organization has a unique slug for URLs
- Metadata can store custom organization settings
- Logo is stored as URL (like user images)

### 6. Member Table

Links users to organizations with roles:

```typescript
export const member = pgTable('member', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organization.id),
  userId: text('user_id').references(() => user.id),
  role: text('role').default('member'), // 'owner', 'admin', 'member', 'manager'
  createdAt: timestamp('created_at'),
});
```

**Key Points:**

- One user can be a member of multiple organizations
- Each membership has a specific role
- Roles determine permissions within that organization

### 7. Invitation Table

Manages pending organization invitations:

```typescript
export const invitation = pgTable('invitation', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').references(() => organization.id),
  email: text('email'), // Invited email
  role: text('role'), // Intended role
  status: text('status').default('pending'), // 'pending', 'accepted', 'expired'
  expiresAt: timestamp('expires_at'),
  inviterId: text('inviter_id').references(() => user.id), // Who sent invite
});
```

**Key Points:**

- Invitations are sent to email addresses (user may not exist yet)
- Tracks who sent the invitation
- Invitations expire automatically

## Role System

Your project defines four roles with different permissions:

```typescript
export const role = pgEnum('role', ['owner', 'admin', 'member', 'manager']);

// Permissions (from permissions.ts)
const owner = ac.newRole({
  project: ['create', 'update', 'delete'], // Most permissions
});
const admin = ac.newRole({
  project: ['create', 'update'], // Can't delete
});
const manager = ac.newRole({
  project: ['create', 'update'], // Same as admin
});
const member = ac.newRole({
  project: ['create'], // Least permissions
});
```

## Relationships and Data Flow

### User → Organization Flow

1. User signs up (creates `user` record)
2. Admin invites user to organization (creates `invitation`)
3. User accepts invitation (creates `member` record)
4. User can now access organization data

### Session → Organization Flow

1. User logs in (creates `session`)
2. System sets `activeOrganizationId` in session
3. All requests use this organization context
4. User can switch organizations (updates session)

### Multi-Organization Example

```
User: john@example.com
├── Member of "Acme Corp" (role: admin)
├── Member of "Beta Inc" (role: member)
└── Current session: activeOrganizationId = "acme-corp-id"
```

## Database Queries You'll Use

### Get User with Organizations

```typescript
const userWithOrgs = await db
  .select()
  .from(user)
  .leftJoin(member, eq(member.userId, user.id))
  .leftJoin(organization, eq(organization.id, member.organizationId))
  .where(eq(user.id, userId));
```

### Check User Role in Organization

```typescript
const membership = await db
  .select()
  .from(member)
  .where(and(eq(member.userId, userId), eq(member.organizationId, orgId)))
  .limit(1);

const userRole = membership[0]?.role;
```

### Get Organization Members

```typescript
const members = await db
  .select({
    id: member.id,
    role: member.role,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  })
  .from(member)
  .innerJoin(user, eq(user.id, member.userId))
  .where(eq(member.organizationId, orgId));
```

## Schema Management

### Generate Migrations

```bash
# Generate schema changes
npx @better-auth/cli generate

# Apply migrations (if using Kysely)
npx @better-auth/cli migrate
```

### Manual Schema Updates

If you add custom fields, update the schema and run migrations:

```typescript
// Add custom field to user table
export const user = pgTable('user', {
  // ... existing fields
  department: text('department'), // Custom field
  phoneNumber: text('phone_number'), // Custom field
});
```

## Next Steps

1. **Learn [User Management](./04-user-management.md)** to work with these tables
2. **Explore [Sessions](./05-sessions.md)** to understand session handling
3. **Practice [Client Usage](./07-client-usage.md)** to build features

## Key Takeaways

- Your schema supports multi-tenant organizations
- Users can belong to multiple organizations with different roles
- Sessions track the active organization
- All auth data is properly normalized and related
- Better Auth handles the complex queries automatically
