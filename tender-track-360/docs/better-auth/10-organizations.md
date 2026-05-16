# Organization Management - Multi-Tenancy with Better Auth

## Overview

Your Tender Track 360 system uses organization-based multi-tenancy, where users can belong to multiple organizations with different roles in each. This guide explains how to work with organizations in your Better Auth setup.

## Understanding Multi-Tenancy

### Key Concepts

1. **Organization**: A business entity (company, department, team)
2. **Member**: A user's membership in an organization with a specific role
3. **Active Organization**: The organization a user is currently working in
4. **Role Isolation**: Users have different permissions in different organizations

### Data Structure

```typescript
// User belongs to multiple organizations
User: john@example.com
├── Member of "Acme Corp" (role: admin)
├── Member of "Beta Inc" (role: member)
└── Current session: activeOrganizationId = "acme-corp-id"

// All data is scoped to the active organization
Tenders, Documents, Tasks → filtered by activeOrganizationId
```

## Organization Operations

### 1. Create Organization

```typescript
// Client-side organization creation
import { authClient } from '@/lib/auth-client'

const createOrganization = async (name: string, slug: string) => {
  try {
    const result = await authClient.organization.create({
      name,
      slug, // URL-friendly identifier
      logo: null // Optional logo URL
    })

    if (result.data) {
      console.log('Organization created:', result.data)
      // User automatically becomes owner
      return result.data
    }
  } catch (error) {
    console.error('Failed to create organization:', error)
    throw error
  }
}

// Usage in React component
function CreateOrgForm() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createOrganization(name, slug)
      alert('Organization created successfully!')
    } catch (error) {
      alert('Failed to create organization')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Organization Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        placeholder="URL Slug (e.g., acme-corp)"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        required
      />
      <button type="submit">Create Organization</button>
    </form>
  )
}
```

### 2. List User's Organizations

```typescript
// Get all organizations user belongs to
const getUserOrganizations = async () => {
  try {
    const result = await authClient.organization.list()
    return result.data || []
  } catch (error) {
    console.error('Failed to load organizations:', error)
    return []
  }
}

// React component to display organizations
function OrganizationList() {
  const [organizations, setOrganizations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrgs = async () => {
      const orgs = await getUserOrganizations()
      setOrganizations(orgs)
      setLoading(false)
    }
    loadOrgs()
  }, [])

  if (loading) return <div>Loading organizations...</div>

  return (
    <div className="space-y-4">
      {organizations.map((org: any) => (
        <div key={org.id} className="border p-4 rounded">
          <h3 className="font-semibold">{org.name}</h3>
          <p className="text-gray-600">Role: {org.role}</p>
          <p className="text-sm text-gray-500">
            Member since: {new Date(org.createdAt).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  )
}
```

### 3. Switch Active Organization

```typescript
// Switch to different organization
const switchOrganization = async (organizationId: string) => {
  try {
    await authClient.organization.setActive({ organizationId })

    // Refresh the page to update session context
    window.location.reload()
  } catch (error) {
    console.error('Failed to switch organization:', error)
    throw error
  }
}

// Organization switcher component
function OrganizationSwitcher() {
  const [organizations, setOrganizations] = useState([])
  const [activeOrgId, setActiveOrgId] = useState('')

  useEffect(() => {
    const loadData = async () => {
      // Load organizations
      const orgs = await getUserOrganizations()
      setOrganizations(orgs)

      // Get current active organization
      const session = await authClient.getSession()
      setActiveOrgId(session.data?.activeOrganizationId || '')
    }
    loadData()
  }, [])

  const handleSwitch = async (orgId: string) => {
    try {
      await switchOrganization(orgId)
    } catch (error) {
      alert('Failed to switch organization')
    }
  }

  return (
    <select
      value={activeOrgId}
      onChange={(e) => handleSwitch(e.target.value)}
      className="p-2 border rounded"
    >
      {organizations.map((org: any) => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </select>
  )
}
```

## Member Management

### 1. Invite Users to Organization

```typescript
// Invite user to organization
const inviteUser = async (email: string, role: string) => {
  try {
    const result = await authClient.organization.inviteMember({
      email,
      role
    })

    if (result.data) {
      console.log('Invitation sent:', result.data)
      return result.data
    }
  } catch (error) {
    console.error('Failed to invite user:', error)
    throw error
  }
}

// Invite form component
function InviteUserForm() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await inviteUser(email, role)
      alert('Invitation sent successfully!')
      setEmail('')
    } catch (error) {
      alert('Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Email Address</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label>Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="member">Member</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
      >
        {loading ? 'Sending...' : 'Send Invitation'}
      </button>
    </form>
  )
}
```

### 2. List Organization Members

```typescript
// Server-side API to get organization members
// app/api/organization/members/route.ts
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { member, user } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
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
          emailVerified: user.emailVerified
        }
      })
      .from(member)
      .innerJoin(user, eq(user.id, member.userId))
      .where(eq(member.organizationId, session.activeOrganizationId))
      .orderBy(member.createdAt)

    return Response.json({ members })
  } catch (error) {
    console.error('Failed to fetch members:', error)
    return Response.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}

// Client-side component to display members
function MembersList() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const response = await fetch('/api/organization/members')
        const data = await response.json()
        setMembers(data.members || [])
      } catch (error) {
        console.error('Failed to load members:', error)
      } finally {
        setLoading(false)
      }
    }
    loadMembers()
  }, [])

  if (loading) return <div>Loading members...</div>

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Organization Members</h2>

      {members.map((member: any) => (
        <div key={member.id} className="flex items-center justify-between p-4 border rounded">
          <div className="flex items-center space-x-3">
            <img
              src={member.user.image || '/default-avatar.png'}
              alt="Avatar"
              className="w-10 h-10 rounded-full"
            />
            <div>
              <h3 className="font-medium">{member.user.name}</h3>
              <p className="text-gray-600 text-sm">{member.user.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-gray-100 rounded text-sm">
              {member.role}
            </span>
            <div className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${
                member.user.emailVerified ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-xs text-gray-500">
                {member.user.emailVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### 3. Update Member Role

```typescript
// Update member role (admin only)
const updateMemberRole = async (memberId: string, newRole: string) => {
  try {
    const result = await authClient.organization.updateMemberRole({
      memberId,
      role: newRole
    })

    if (result.data) {
      console.log('Role updated:', result.data)
      return result.data
    }
  } catch (error) {
    console.error('Failed to update role:', error)
    throw error
  }
}

// Role update component
function RoleUpdateButton({ member, onUpdate }: { member: any, onUpdate: () => void }) {
  const [newRole, setNewRole] = useState(member.role)
  const [loading, setLoading] = useState(false)

  const handleUpdate = async () => {
    if (newRole === member.role) return

    setLoading(true)
    try {
      await updateMemberRole(member.id, newRole)
      onUpdate() // Refresh member list
      alert('Role updated successfully!')
    } catch (error) {
      alert('Failed to update role')
      setNewRole(member.role) // Reset to original
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <select
        value={newRole}
        onChange={(e) => setNewRole(e.target.value)}
        disabled={loading}
        className="p-1 border rounded text-sm"
      >
        <option value="member">Member</option>
        <option value="manager">Manager</option>
        <option value="admin">Admin</option>
      </select>

      {newRole !== member.role && (
        <button
          onClick={handleUpdate}
          disabled={loading}
          className="px-2 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
        >
          {loading ? '...' : 'Update'}
        </button>
      )}
    </div>
  )
}
```

### 4. Remove Member

```typescript
// Remove member from organization
const removeMember = async (memberId: string) => {
  try {
    const result = await authClient.organization.removeMember({ memberId })

    if (result.data) {
      console.log('Member removed:', result.data)
      return result.data
    }
  } catch (error) {
    console.error('Failed to remove member:', error)
    throw error
  }
}

// Remove member button
function RemoveMemberButton({ member, onRemove }: { member: any, onRemove: () => void }) {
  const [loading, setLoading] = useState(false)

  const handleRemove = async () => {
    if (!confirm(`Remove ${member.user.name} from the organization?`)) {
      return
    }

    setLoading(true)
    try {
      await removeMember(member.id)
      onRemove() // Refresh member list
      alert('Member removed successfully!')
    } catch (error) {
      alert('Failed to remove member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRemove}
      disabled={loading}
      className="px-2 py-1 bg-red-600 text-white rounded text-sm disabled:opacity-50"
    >
      {loading ? '...' : 'Remove'}
    </button>
  )
}
```

## Organization Settings

### 1. Update Organization Details

```typescript
// Update organization information
const updateOrganization = async (orgId: string, updates: { name?: string, logo?: string }) => {
  try {
    // Call your API endpoint
    const response = await fetch(`/api/organization/${orgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })

    if (response.ok) {
      const data = await response.json()
      return data.organization
    } else {
      throw new Error('Failed to update organization')
    }
  } catch (error) {
    console.error('Failed to update organization:', error)
    throw error
  }
}

// Organization settings form
function OrganizationSettings({ organization }: { organization: any }) {
  const [name, setName] = useState(organization.name)
  const [logo, setLogo] = useState(organization.logo || '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await updateOrganization(organization.id, { name, logo })
      alert('Organization updated successfully!')
    } catch (error) {
      alert('Failed to update organization')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Organization Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label>Logo URL</label>
        <input
          type="url"
          value={logo}
          onChange={(e) => setLogo(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Updating...' : 'Update Organization'}
      </button>
    </form>
  )
}
```

## Data Scoping Patterns

### 1. Server-Side Data Filtering

```typescript
// Always filter data by active organization
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // All queries should include organization filter
  const tenders = await db
    .select()
    .from(tender)
    .where(eq(tender.organizationId, session.activeOrganizationId));

  return Response.json({ tenders });
}
```

### 2. Client-Side Organization Context

```typescript
// Create organization context for client components
const OrganizationContext = createContext<{
  activeOrganization: Organization | null
  switchOrganization: (id: string) => Promise<void>
}>({
  activeOrganization: null,
  switchOrganization: async () => {}
})

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [activeOrganization, setActiveOrganization] = useState(null)

  const switchOrganization = async (id: string) => {
    await authClient.organization.setActive({ organizationId: id })
    // Update local state and refresh
    window.location.reload()
  }

  return (
    <OrganizationContext.Provider value={{ activeOrganization, switchOrganization }}>
      {children}
    </OrganizationContext.Provider>
  )
}
```

## Next Steps

1. **Learn [Security Best Practices](./12-security.md)** for multi-tenant security
2. **Explore [Extending Better Auth](./11-extensions.md)** for custom features
3. **Practice [Testing Auth](./15-testing.md)** to test organization features

## Key Takeaways

- Organizations provide data isolation and role-based access
- Users can belong to multiple organizations with different roles
- Always filter data by active organization on the server
- Organization switching requires session updates
- Member management is role-based (admins can invite/remove users)
