# Better Auth Core Concepts

## What is Better Auth?

Better Auth is a TypeScript-first authentication framework that handles user management, sessions, and security for web applications. Unlike simple auth libraries, it provides a complete system with database integration, middleware, and extensible plugins.

## Key Concepts

### 1. Authentication vs Authorization

**Authentication** = "Who are you?"

- Verifying user identity (login with email/password)
- Managing sessions and tokens
- Handling user registration and password resets

**Authorization** = "What can you do?"

- Role-based access control (admin, manager, viewer)
- Permission checking
- Resource-level access control

### 2. Users and Sessions

**User**: A person with an account in your system

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'manager';
  // ... other fields
}
```

**Session**: A temporary authentication state

```typescript
interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  // ... session data
}
```

### 3. Multi-Tenancy (Organizations)

Your project uses **organization-based multi-tenancy**:

- Users can belong to multiple organizations
- Each user has different roles in different organizations
- Data is isolated by organization

```typescript
// User can be admin in Org A, but viewer in Org B
UserA in OrgA: role = 'admin'
UserA in OrgB: role = 'viewer'
```

### 4. Database Integration

Better Auth manages these core tables:

- `user` - User accounts and profiles
- `session` - Active user sessions
- `account` - Social login connections
- `verification` - Email verification tokens
- `organization` - Your business organizations
- `member` - User-organization relationships

## How Better Auth Works

### 1. Server-Side (API Routes)

Better Auth creates API endpoints automatically:

```
POST /api/auth/sign-up     # Create new user
POST /api/auth/sign-in     # Login user
POST /api/auth/sign-out    # Logout user
GET  /api/auth/session     # Get current session
```

### 2. Client-Side (React Components)

You use the auth client to interact with these APIs:

```typescript
import { authClient } from '@/lib/auth-client';

// Sign up a new user
await authClient.signUp.email({
  email: 'user@example.com',
  password: 'securepassword',
  name: 'John Doe',
});

// Sign in existing user
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'securepassword',
});
```

### 3. Middleware Protection

Routes are protected using middleware:

```typescript
// src/middleware.ts
export default authMiddleware({
  // Protect these routes
  matcher: ['/dashboard/:path*', '/admin/:path*'],
});
```

## Security Features

### 1. Password Security

- Automatic password hashing (bcrypt)
- Configurable password requirements
- Secure password reset flows

### 2. Session Security

- Secure session cookies
- Automatic session expiration
- CSRF protection

### 3. Rate Limiting

- Login attempt limiting
- API rate limiting
- Brute force protection

## Your Project's Auth Flow

### 1. User Registration

1. Admin creates user account (admin-only registration)
2. System sends invitation email
3. User sets password and activates account
4. User is added to organization with assigned role

### 2. User Login

1. User enters email/password
2. Better Auth validates credentials
3. Session is created and stored
4. User is redirected to dashboard

### 3. Route Protection

1. User tries to access protected route
2. Middleware checks for valid session
3. If authenticated, request continues
4. If not, user is redirected to login

### 4. Role-Based Access

1. User makes request to protected resource
2. System checks user's role in current organization
3. Access granted/denied based on permissions

## Next Steps

Now that you understand the basics:

1. **Review [Your Current Setup](./02-current-setup.md)** to see how these concepts are implemented
2. **Explore [Database Schema](./03-database-schema.md)** to understand the data structure
3. **Learn [User Management](./04-user-management.md)** to work with users and roles

## Key Takeaways

- Better Auth handles the complex security aspects automatically
- Your project uses organization-based multi-tenancy
- Authentication (login) and authorization (permissions) are separate concerns
- The system is already configured - you're learning to use and extend it
