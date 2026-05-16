# Client-Side Usage - Building Auth Features

## Overview

This guide shows you how to use Better Auth in your React components and client-side code. You'll learn to build login forms, handle authentication state, and create user interfaces.

## Setting Up Auth Hooks

### 1. Create Custom Hooks

First, create reusable hooks for common auth operations:

```typescript
// src/hooks/use-session.ts
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';

export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const session = await authClient.getSession();
      return session.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// src/hooks/use-auth.ts
export function useAuth() {
  const { data: session, isLoading } = useSession();

  return {
    user: session?.user || null,
    isAuthenticated: !!session,
    isLoading,
    activeOrganization: session?.activeOrganizationId,
  };
}
```

### 2. Auth Context Provider

Create a context for auth state management:

```typescript
// src/contexts/auth-context.tsx
'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useSession } from '@/hooks/use-session'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isLoading } = useSession()

  const value = {
    user: session?.user || null,
    isAuthenticated: !!session,
    isLoading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}
```

## Authentication Forms

### 1. Sign In Form

```typescript
// src/components/auth/sign-in-form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await authClient.signIn.email({
        email,
        password
      })

      if (result.error) {
        setError(result.error.message)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An error occurred during sign in')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className="text-blue-600 hover:underline"
        >
          Sign in with Google
        </button>
      </div>
    </form>
  )
}
```

### 2. User Registration Form (Admin Only)

```typescript
// src/components/admin/create-user-form.tsx
'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'

export function CreateUserForm() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'member'
  })
  const [isLoading, setIsLoading] = useState(false)

  // Only admins can see this form
  if (user?.role !== 'admin' && user?.role !== 'owner') {
    return <div>Access denied</div>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Call your API endpoint to create user
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        alert('User created and invitation sent!')
        setFormData({ name: '', email: '', role: 'member' })
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      alert('Failed to create user')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label htmlFor="role">Role</label>
        <select
          id="role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full p-2 border rounded"
        >
          <option value="member">Member</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-600 text-white p-2 rounded disabled:opacity-50"
      >
        {isLoading ? 'Creating...' : 'Create User'}
      </button>
    </form>
  )
}
```

## User Profile Management

### 1. Profile Display Component

```typescript
// src/components/user/user-profile.tsx
'use client'

import { useAuth } from '@/hooks/use-auth'
import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

export function UserProfile() {
  const { user, isLoading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')

  if (isLoading) return <div>Loading...</div>
  if (!user) return <div>Not authenticated</div>

  const handleSave = async () => {
    try {
      await authClient.updateUser({ name })
      setIsEditing(false)
      // Refresh the page to get updated session
      window.location.reload()
    } catch (error) {
      alert('Failed to update profile')
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center space-x-4">
        <img
          src={user.image || '/default-avatar.png'}
          alt="Profile"
          className="w-16 h-16 rounded-full"
        />

        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <div className="space-x-2">
                <button
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-300 px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
              <p className="text-sm text-gray-500">Role: {user.role}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="mt-2 text-blue-600 hover:underline"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${user.emailVerified ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">
            Email {user.emailVerified ? 'verified' : 'not verified'}
          </span>
          {!user.emailVerified && (
            <button
              onClick={resendVerification}
              className="text-blue-600 hover:underline text-sm"
            >
              Resend verification
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

### 2. Password Change Form

```typescript
// src/components/user/change-password-form.tsx
'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'

export function ChangePasswordForm() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      await authClient.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        revokeOtherSessions: true
      })

      setSuccess(true)
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      setError(err.message || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="currentPassword">Current Password</label>
        <input
          id="currentPassword"
          type="password"
          value={formData.currentPassword}
          onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
          required
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label htmlFor="newPassword">New Password</label>
        <input
          id="newPassword"
          type="password"
          value={formData.newPassword}
          onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
          required
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword">Confirm New Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
          className="w-full p-2 border rounded"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      {success && (
        <div className="text-green-600 text-sm">
          Password changed successfully! Other sessions have been signed out.
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
      >
        {isLoading ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  )
}
```

## Organization Management

### 1. Organization Switcher

```typescript
// src/components/organization/org-switcher.tsx
'use client'

import { useState, useEffect } from 'react'
import { authClient } from '@/lib/auth-client'

export function OrganizationSwitcher() {
  const [organizations, setOrganizations] = useState([])
  const [activeOrg, setActiveOrg] = useState(null)

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      const result = await authClient.organization.list()
      setOrganizations(result.data || [])

      // Get current active organization
      const session = await authClient.getSession()
      setActiveOrg(session.data?.activeOrganizationId)
    } catch (error) {
      console.error('Failed to load organizations:', error)
    }
  }

  const switchOrganization = async (orgId: string) => {
    try {
      await authClient.organization.setActive({ organizationId: orgId })
      window.location.reload() // Refresh to update session
    } catch (error) {
      console.error('Failed to switch organization:', error)
    }
  }

  return (
    <div className="relative">
      <select
        value={activeOrg || ''}
        onChange={(e) => switchOrganization(e.target.value)}
        className="p-2 border rounded"
      >
        {organizations.map((org: any) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
    </div>
  )
}
```

## Route Protection

### 1. Protected Route Component

```typescript
// src/components/auth/protected-route.tsx
'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string[]
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallback = <div>Access denied</div>
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/sign-in')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return null // Will redirect
  }

  if (requiredRole && !requiredRole.includes(user?.role || '')) {
    return fallback
  }

  return <>{children}</>
}

// Usage
function AdminPanel() {
  return (
    <ProtectedRoute requiredRole={['admin', 'owner']}>
      <div>Admin content here</div>
    </ProtectedRoute>
  )
}
```

## Next Steps

1. **Learn [Middleware & Protection](./08-middleware.md)** for server-side route protection
2. **Explore [Organization Management](./10-organizations.md)** for multi-tenancy features
3. **Practice [Testing Auth](./15-testing.md)** to test your auth components

## Key Takeaways

- Use React Query for efficient session management
- Create reusable hooks for common auth operations
- Handle loading and error states properly
- Implement role-based UI components
- Always validate permissions on both client and server
