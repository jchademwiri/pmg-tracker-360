# Better Auth Learning Guide for Tender Track 360

## Overview

Better Auth is a comprehensive authentication framework for TypeScript that provides secure user management, session handling, and extensible features through plugins. This guide focuses on how Better Auth is implemented in Tender Track 360 and how to work with it effectively.

## What You Already Have

Your project already includes:

- ✅ Better Auth core setup with Drizzle ORM
- ✅ Organization-based multi-tenancy
- ✅ Email/password authentication
- ✅ Role-based access control (owner, admin, member, manager)
- ✅ Session management
- ✅ Basic user management

## Learning Path

### 1. **Understanding the Basics** (Start Here)

- [Core Concepts](./01-core-concepts.md) - Authentication vs Authorization, Sessions, Users
- [Your Current Setup](./02-current-setup.md) - How Better Auth is configured in your project
- [Database Schema](./03-database-schema.md) - Understanding the auth tables

### 2. **Working with Authentication**

- [User Management](./04-user-management.md) - Creating, updating, managing users
- [Session Handling](./05-sessions.md) - How sessions work and are managed
- [Role-Based Access](./06-roles-permissions.md) - Understanding your role system

### 3. **Frontend Integration**

- [Client-Side Usage](./07-client-usage.md) - Using auth in React components
- [Middleware & Protection](./08-middleware.md) - Protecting routes and pages
- [Forms & UI](./09-auth-forms.md) - Login, signup, profile forms

### 4. **Advanced Features**

- [Organization Management](./10-organizations.md) - Multi-tenant setup
- [Extending Better Auth](./11-extensions.md) - Plugins and customizations
- [Security Best Practices](./12-security.md) - Keeping your auth secure

### 5. **Troubleshooting & Development**

- [Common Issues](./13-troubleshooting.md) - Solutions to frequent problems
- [Development Tips](./14-dev-tips.md) - Workflow and debugging
- [Testing Auth](./15-testing.md) - How to test authentication features

## Quick Reference

### Key Files in Your Project

```
src/lib/auth.ts          # Better Auth configuration
src/lib/auth-client.ts   # Client-side auth methods
src/db/schema.ts         # Database schema with auth tables
src/middleware.ts        # Route protection middleware
```

### Essential Commands

```bash
# Generate/update database schema
npx @better-auth/cli generate

# Apply migrations (if using Kysely)
npx @better-auth/cli migrate

# Start development server
pnpm dev
```

### Common Patterns You'll Use

```typescript
// Check if user is authenticated
const session = await auth.api.getSession({ headers });

// Protect a route
if (!session) {
  redirect('/sign-in');
}

// Check user role
if (session.user.role !== 'admin') {
  throw new Error('Unauthorized');
}
```

## Next Steps

1. **Start with [Core Concepts](./01-core-concepts.md)** to understand the fundamentals
2. **Review [Your Current Setup](./02-current-setup.md)** to see how it's implemented
3. **Practice with [Client-Side Usage](./07-client-usage.md)** to build auth features
4. **Explore [Organization Management](./10-organizations.md)** for multi-tenancy

## Getting Help

- **Better Auth Docs**: https://better-auth.com/docs
- **Your Project Issues**: Check `docs/04-development/troubleshooting.md`
- **Community**: Better Auth GitHub discussions
- **Local Testing**: Use your development environment to experiment

Remember: Better Auth is already working in your project - this guide helps you understand and extend what's already there!
