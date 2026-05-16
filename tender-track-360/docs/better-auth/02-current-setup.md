# Your Current Better Auth Setup

## Overview

Your Tender Track 360 project has a sophisticated Better Auth configuration with multi-tenancy, role-based access control, and email integration. Let's break down what you already have.

## Configuration Files

### 1. Server Configuration (`src/lib/auth.ts`)

Your main auth configuration includes:

```typescript
export const auth = betterAuth({
  // Database integration with Drizzle ORM
  database: drizzleAdapter(db, {
    provider: 'pg', // PostgreSQL
    schema,
  }),

  // Email/password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // Custom email sending with Resend
    },
  },

  // Social login (Google)
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },

  // Organization plugin for multi-tenancy
  plugins: [
    organization({
      ac, // Access control
      roles: { owner, admin, member, manager },
    }),
    nextCookies(), // Next.js cookie handling
  ],
});
```

### 2. Client Configuration (`src/lib/auth-client.ts`)

Your client-side auth setup:

```typescript
export const authClient = createAuthClient({
  baseURL:
    process.env.NODE_ENV === 'production'
      ? 'https://tender-track-360.vercel.app/'
      : 'http://localhost:3000',
  plugins: [organizationClient()],
});
```

### 3. Role System (`src/lib/auth/permissions.ts`)

Your access control system defines:

```typescript
// Available actions
const statement = {
  project: ['create', 'share', 'update', 'delete'],
};

// Role permissions
const owner = ac.newRole({
  project: ['create', 'update', 'delete'], // Can't share
});
const admin = ac.newRole({
  project: ['create', 'update'], // Can't delete or share
});
const member = ac.newRole({
  project: ['create'], // Can only create
});
const manager = ac.newRole({
  project: ['create', 'update'], // Can create and update
});
```

## Key Features You Have

### 1. **Multi-Tenant Organizations**

- Users can belong to multiple organizations
- Each user has different roles per organization
- Organization switching capability
- Isolated data per organization

### 2. **Email Integration with Resend**

- Email verification on signup
- Password reset emails
- Custom email templates in `/emails/` folder
- Professional email styling

### 3. **Social Authentication**

- Google OAuth integration
- Automatic account linking
- Callback URL handling

### 4. **Advanced Session Management**

- Automatic active organization tracking
- Session hooks for custom logic
- Secure cookie handling

### 5. **Database Integration**

- PostgreSQL with Drizzle ORM
- Automatic schema management
- Type-safe database operations

## Environment Variables You Need

Make sure these are set in your `.env` file:

```bash
# Database
DATABASE_URL="postgresql://..."

# Better Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000" # or production URL

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Email (Resend)
RESEND_API_KEY="your-resend-api-key"
SENDER_NAME="Tender Track 360"
SENDER_EMAIL="noreply@yourdomain.com"
```

## API Routes Available

Better Auth automatically creates these endpoints:

### Authentication

- `POST /api/auth/sign-up` - Create new user
- `POST /api/auth/sign-in` - Login user
- `POST /api/auth/sign-out` - Logout user
- `GET /api/auth/session` - Get current session

### Email/Password

- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/verify-email` - Verify email address

### Social Auth

- `GET /api/auth/sign-in/google` - Google OAuth login
- `GET /api/auth/callback/google` - Google OAuth callback

### Organizations

- `POST /api/auth/organization/create` - Create organization
- `POST /api/auth/organization/invite-member` - Invite user
- `GET /api/auth/organization/list` - List user's organizations
- `POST /api/auth/organization/set-active` - Switch organization

## How to Use in Your Code

### Server-Side (API Routes, Server Components)

```typescript
import { auth } from '@/lib/auth';

// Get current session
const session = await auth.api.getSession({ headers });

// Check if user is authenticated
if (!session) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

// Access user data
const user = session.user;
const activeOrg = session.activeOrganizationId;
```

### Client-Side (React Components)

```typescript
import { authClient } from '@/lib/auth-client';

// Sign up new user
await authClient.signUp.email({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
});

// Sign in user
await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password123',
});

// Create organization
await authClient.organization.create({
  name: 'My Company',
  slug: 'my-company',
});
```

## What Makes Your Setup Special

1. **Admin-Only Registration**: Only admins can create users (controlled signup)
2. **Organization-First**: Every user must belong to an organization
3. **Role-Based Permissions**: Fine-grained access control per organization
4. **Email Verification Required**: Security-first approach
5. **Professional Email Templates**: Custom branded emails

## Next Steps

1. **Learn [Database Schema](./03-database-schema.md)** to understand the data structure
2. **Practice [User Management](./04-user-management.md)** to work with users
3. **Explore [Client Usage](./07-client-usage.md)** to build auth features

## Common Tasks You'll Do

- **Create users**: Admin creates accounts for team members
- **Manage organizations**: Add/remove users, change roles
- **Handle sessions**: Check authentication, get user data
- **Protect routes**: Ensure only authorized users access features
- **Send emails**: Verification, password resets, invitations
