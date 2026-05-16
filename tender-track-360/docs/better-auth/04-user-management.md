# User Management with Better Auth

## Overview

In your Tender Track 360 system, user management is admin-controlled and organization-centric. This guide shows you how to create, manage, and work with users in your Better Auth setup.

## User Creation Flow

### 1. Admin-Only Registration

Unlike typical systems, only admins can create new users:

```typescript
// Server-side API route (admin only)
import { auth } from '@/lib/auth';

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  // Check if user is admin
  if (!session || session.user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { email, name, role } = await request.json();

  // Create user account
  const newUser = await auth.api.signUp({
    email,
    name,
    password: generateTemporaryPassword(), // Generate temp password
    // User will be prompted to change on first login
  });

  // Add to organization
  await auth.api.organization.inviteMember({
    organizationId: session.activeOrganizationId,
    email,
    role,
  });
}
```

### 2. User Invitation Process

```typescript
// Send invitation email
await auth.api.organization.inviteMember({
  organizationId: 'org-123',
  email: 'newuser@example.com',
  role: 'member',
});

// This creates an invitation record and sends email
// User clicks link and sets their password
```

## Working with Users

### 1. Get Current User

```typescript
// Server-side
import { auth } from '@/lib/auth'

const session = await auth.api.getSession({ headers })
if (session) {
  const user = session.user
  console.log(user.id, user.name, user.email)
}

// Client-side
import { useSession } from '@/hooks/use-session'

function UserProfile() {
  const { data: session } = useSession()

  if (!session) return <div>Not logged in</div>

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
    </div>
  )
}
```

### 2. Update User Profile

```typescript
// Client-side profile update
import { authClient } from '@/lib/auth-client'

const updateProfile = async (data: { name: string; image?: string }) => {
  try {
    await authClient.updateUser({
      name: data.name,
      image: data.image
    })

    // Refresh session to get updated data
    window.location.reload()
  } catch (error) {
    console.error('Failed to update profile:', error)
  }
}

// Usage in React component
function ProfileForm() {
  const [name, setName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await updateProfile({ name })
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
      />
      <button type="submit">Update Profile</button>
    </form>
  )
}
```

### 3. Change Password

```typescript
// Client-side password change
const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
    await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: true, // Sign out other devices
    });

    alert('Password changed successfully');
  } catch (error) {
    console.error('Failed to change password:', error);
  }
};
```

## Organization User Management

### 1. List Organization Members

```typescript
// Server-side API to get organization members
import { db } from '@/db';
import { member, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const members = await db
    .select({
      id: member.id,
      role: member.role,
      createdAt: member.createdAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(eq(member.organizationId, session.activeOrganizationId));

  return Response.json({ members });
}
```

### 2. Change User Role

```typescript
// Admin can change user roles
const changeUserRole = async (memberId: string, newRole: string) => {
  try {
    await authClient.organization.updateMemberRole({
      memberId,
      role: newRole,
    });

    // Refresh member list
    // ... update UI
  } catch (error) {
    console.error('Failed to change role:', error);
  }
};
```

### 3. Remove User from Organization

```typescript
// Admin can remove users
const removeUser = async (memberId: string) => {
  try {
    await authClient.organization.removeMember({
      memberId,
    });

    // Update UI to remove user from list
  } catch (error) {
    console.error('Failed to remove user:', error);
  }
};
```

## User Roles and Permissions

### 1. Check User Role

```typescript
// Server-side role checking
const checkUserRole = async (userId: string, organizationId: string) => {
  const membership = await db
    .select()
    .from(member)
    .where(
      and(eq(member.userId, userId), eq(member.organizationId, organizationId))
    )
    .limit(1);

  return membership[0]?.role || null;
};

// Usage in API route
const userRole = await checkUserRole(
  session.user.id,
  session.activeOrganizationId
);

if (userRole !== 'admin' && userRole !== 'owner') {
  return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
}
```

### 2. Role-Based UI

```typescript
// Client-side role-based rendering
function AdminPanel() {
  const { data: session } = useSession()

  // Get user's role in current organization
  const userRole = session?.user.role // This comes from session

  if (userRole !== 'admin' && userRole !== 'owner') {
    return <div>Access denied</div>
  }

  return (
    <div>
      <h2>Admin Panel</h2>
      <button onClick={() => inviteUser()}>Invite User</button>
      <UserList />
    </div>
  )
}
```

## Email Verification

### 1. Check Verification Status

```typescript
// Check if user's email is verified
const checkEmailVerification = (user: User) => {
  if (!user.emailVerified) {
    return (
      <div className="alert alert-warning">
        Please verify your email address to access all features.
        <button onClick={resendVerification}>Resend Verification</button>
      </div>
    )
  }
  return null
}
```

### 2. Resend Verification Email

```typescript
const resendVerification = async () => {
  try {
    await authClient.sendVerificationEmail({
      email: session.user.email,
    });

    alert('Verification email sent!');
  } catch (error) {
    console.error('Failed to send verification:', error);
  }
};
```

## User Search and Filtering

### 1. Search Users in Organization

```typescript
// Server-side user search
export async function GET(request: Request) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const role = url.searchParams.get('role');

  let query = db
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
    .where(eq(member.organizationId, organizationId));

  // Add search filter
  if (search) {
    query = query.where(
      or(ilike(user.name, `%${search}%`), ilike(user.email, `%${search}%`))
    );
  }

  // Add role filter
  if (role) {
    query = query.where(eq(member.role, role));
  }

  const users = await query;
  return Response.json({ users });
}
```

## Common User Management Patterns

### 1. User Profile Component

```typescript
function UserCard({ member }: { member: Member }) {
  const canEdit = useCanEditUser(member.id) // Custom hook for permissions

  return (
    <div className="user-card">
      <img src={member.user.image || '/default-avatar.png'} alt="Avatar" />
      <div>
        <h3>{member.user.name}</h3>
        <p>{member.user.email}</p>
        <span className="role-badge">{member.role}</span>
      </div>

      {canEdit && (
        <div className="actions">
          <button onClick={() => editUser(member.id)}>Edit</button>
          <button onClick={() => removeUser(member.id)}>Remove</button>
        </div>
      )}
    </div>
  )
}
```

### 2. Bulk User Operations

```typescript
const bulkUpdateRoles = async (memberIds: string[], newRole: string) => {
  try {
    await Promise.all(
      memberIds.map((id) =>
        authClient.organization.updateMemberRole({
          memberId: id,
          role: newRole,
        })
      )
    );

    // Refresh UI
  } catch (error) {
    console.error('Bulk update failed:', error);
  }
};
```

## Next Steps

1. **Learn [Sessions](./05-sessions.md)** to understand session management
2. **Explore [Role-Based Access](./06-roles-permissions.md)** for permission systems
3. **Practice [Client Usage](./07-client-usage.md)** to build user interfaces

## Key Takeaways

- Only admins can create users in your system
- Users are always associated with organizations
- Role-based permissions control what users can do
- Email verification is required for full access
- User management is organization-scoped
