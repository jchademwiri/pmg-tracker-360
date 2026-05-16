# Troubleshooting Better Auth Issues

## Common Issues and Solutions

### Authentication Issues

#### 1. "Session not found" or "Unauthorized" errors

**Symptoms:**

- User appears logged in but gets unauthorized errors
- Session seems to expire immediately
- API calls return 401 status

**Causes & Solutions:**

```typescript
// Check if session is properly configured
// src/lib/auth.ts
export const auth = betterAuth({
  // Make sure you have the correct base URL
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',

  // Ensure secret is set
  secret: process.env.BETTER_AUTH_SECRET, // Must be set!

  // Check cookie configuration
  plugins: [
    nextCookies(), // Required for Next.js
  ],
});
```

**Environment Variables Check:**

```bash
# .env.local
BETTER_AUTH_SECRET="your-long-random-secret-key"
BETTER_AUTH_URL="http://localhost:3000" # or your production URL
DATABASE_URL="postgresql://..."
```

**Debug Session:**

```typescript
// Add this to debug session issues
const session = await auth.api.getSession({ headers });
console.log('Session debug:', {
  exists: !!session,
  userId: session?.user?.id,
  activeOrg: session?.activeOrganizationId,
  expiresAt: session?.expiresAt,
});
```

#### 2. Email verification not working

**Symptoms:**

- Verification emails not sent
- Verification links don't work
- Users stuck in unverified state

**Solutions:**

```typescript
// Check Resend configuration
// src/lib/auth.ts
const resend = new Resend(process.env.RESEND_API_KEY); // Must be valid!

export const auth = betterAuth({
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      console.log('Sending verification email to:', user.email);
      console.log('Verification URL:', url);

      try {
        const result = await resend.emails.send({
          from: `${process.env.SENDER_NAME} <${process.env.SENDER_EMAIL}>`,
          to: user.email,
          subject: 'Verify your email address',
          react: VerifyEmail({ username: user.name, verificationUrl: url }),
        });

        console.log('Email sent successfully:', result);
      } catch (error) {
        console.error('Email send failed:', error);
        throw error; // Important: re-throw to prevent silent failures
      }
    },
    sendOnSignUp: true,
    expiresIn: 3600, // 1 hour
    autoSignInAfterVerification: true,
  },
});
```

**Environment Variables:**

```bash
RESEND_API_KEY="re_..."
SENDER_NAME="Tender Track 360"
SENDER_EMAIL="noreply@yourdomain.com" # Must be verified domain
```

#### 3. Google OAuth not working

**Symptoms:**

- Google sign-in button doesn't work
- OAuth callback errors
- "Invalid client" errors

**Solutions:**

```typescript
// Check Google OAuth configuration
export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      // Add redirect URI if needed
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
    },
  },
});
```

**Google Console Setup:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API
3. Set authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### Database Issues

#### 4. Migration/Schema errors

**Symptoms:**

- "Table doesn't exist" errors
- Schema mismatch errors
- Migration failures

**Solutions:**

```bash
# Generate fresh schema
npx @better-auth/cli generate

# Check generated schema matches your database
# Compare with src/db/schema.ts

# If using Kysely, apply migration
npx @better-auth/cli migrate

# Manual verification
psql $DATABASE_URL -c "\dt" # List tables
```

**Common Schema Issues:**

```typescript
// Make sure all required tables exist
export const schema = {
  user, // ✓ Required
  session, // ✓ Required
  account, // ✓ Required
  verification, // ✓ Required
  organization, // ✓ Required for your setup
  member, // ✓ Required for your setup
  invitation, // ✓ Required for your setup
  // ... other tables
};
```

#### 5. Connection/Database errors

**Symptoms:**

- "Connection refused" errors
- Timeout errors
- SSL/TLS errors

**Solutions:**

```typescript
// Check database connection
// src/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

// Add connection debugging
const client = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
  max: 1, // Limit connections in development
  onnotice: (notice) => console.log('DB Notice:', notice),
});

export const db = drizzle(client);

// Test connection
async function testConnection() {
  try {
    await db.execute('SELECT 1');
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}
```

### Organization/Multi-tenancy Issues

#### 6. Organization switching not working

**Symptoms:**

- User can't switch organizations
- Data from wrong organization showing
- Active organization not updating

**Solutions:**

```typescript
// Check session hook configuration
// src/lib/auth.ts
export const auth = betterAuth({
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          // Make sure this function works
          const organization = await getActiveOrganization(session.userId);
          console.log('Setting active org:', organization?.id);

          return {
            data: {
              ...session,
              activeOrganizationId: organization?.id,
            },
          };
        },
      },
    },
  },
  // ... rest of config
});

// Check getActiveOrganization function
export async function getActiveOrganization(userId: string) {
  try {
    const membership = await db
      .select({
        organizationId: member.organizationId,
        organization: {
          id: organization.id,
          name: organization.name,
        },
      })
      .from(member)
      .innerJoin(organization, eq(organization.id, member.organizationId))
      .where(eq(member.userId, userId))
      .limit(1);

    console.log('Active org for user:', userId, membership[0]);
    return membership[0]?.organization || null;
  } catch (error) {
    console.error('Failed to get active organization:', error);
    return null;
  }
}
```

#### 7. Role permissions not working

**Symptoms:**

- Users can access features they shouldn't
- Role checks failing
- Permission errors

**Solutions:**

```typescript
// Check role configuration
// src/lib/auth/permissions.ts
import { createAccessControl } from 'better-auth/plugins/access';

const statement = {
  project: ['create', 'share', 'update', 'delete'], // Make sure actions match your needs
} as const;

const ac = createAccessControl(statement);

// Verify role definitions
const owner = ac.newRole({
  project: ['create', 'update', 'delete'], // Check permissions are correct
});

// Debug role checking
const checkUserPermission = async (userId: string, action: string) => {
  const session = await auth.api.getSession({ headers });
  console.log('Checking permission:', {
    userId,
    action,
    userRole: session?.user?.role,
    hasPermission: session?.user?.role === 'owner', // Adjust logic
  });
};
```

### Development Issues

#### 8. Hot reload/Development server issues

**Symptoms:**

- Auth stops working after code changes
- Session lost on refresh
- Inconsistent behavior

**Solutions:**

```typescript
// Add error boundaries
function AuthErrorBoundary({ children }: { children: ReactNode }) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = (error: any) => {
      console.error('Auth error:', error)
      setHasError(true)
    }

    window.addEventListener('unhandledrejection', handleError)
    return () => window.removeEventListener('unhandledrejection', handleError)
  }, [])

  if (hasError) {
    return (
      <div>
        <p>Authentication error occurred. Please refresh the page.</p>
        <button onClick={() => window.location.reload()}>Refresh</button>
      </div>
    )
  }

  return <>{children}</>
}

// Wrap your app
function App() {
  return (
    <AuthErrorBoundary>
      <AuthProvider>
        {/* Your app */}
      </AuthProvider>
    </AuthErrorBoundary>
  )
}
```

#### 9. TypeScript errors

**Symptoms:**

- Type errors with Better Auth
- Session type issues
- Missing type definitions

**Solutions:**

```typescript
// Create proper type definitions
// src/types/auth.ts
import type { User as BetterAuthUser } from 'better-auth'

export interface User extends BetterAuthUser {
  role: 'owner' | 'admin' | 'member' | 'manager'
  emailVerified: boolean
}

export interface Session {
  user: User
  activeOrganizationId: string | null
  expiresAt: Date
}

// Use in components
import type { User, Session } from '@/types/auth'

function UserProfile({ user }: { user: User }) {
  // TypeScript will know about role property
  return <div>Role: {user.role}</div>
}
```

## Debugging Tools

### 1. Enable Debug Logging

```typescript
// Add to your auth configuration
export const auth = betterAuth({
  // ... other config
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
    disabled: false,
  },
});
```

### 2. Session Debug Component

```typescript
// Create a debug component for development
function SessionDebug() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const result = await authClient.getSession()
        setSession(result.data)
      } catch (error) {
        console.error('Session check failed:', error)
      }
    }
    checkSession()
  }, [])

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded text-xs max-w-sm">
      <h4>Session Debug</h4>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  )
}
```

### 3. API Route Testing

```typescript
// Create test endpoints for debugging
// app/api/debug/session/route.ts
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  return Response.json({
    hasSession: !!session,
    userId: session?.user?.id,
    userEmail: session?.user?.email,
    activeOrg: session?.activeOrganizationId,
    expiresAt: session?.expiresAt,
    headers: Object.fromEntries(request.headers.entries()),
  });
}
```

## Getting Help

### 1. Check Better Auth Documentation

- [Official Docs](https://better-auth.com/docs)
- [GitHub Issues](https://github.com/better-auth/better-auth/issues)
- [Discord Community](https://discord.gg/better-auth)

### 2. Enable Verbose Logging

```bash
# Set environment variable for detailed logs
DEBUG=better-auth:* npm run dev
```

### 3. Common Error Messages

| Error                        | Likely Cause                 | Solution                     |
| ---------------------------- | ---------------------------- | ---------------------------- |
| "Invalid session"            | Session expired or malformed | Check session configuration  |
| "Email not verified"         | User hasn't verified email   | Check email sending setup    |
| "Organization not found"     | Active org not set           | Check organization switching |
| "Insufficient permissions"   | Role check failing           | Verify role configuration    |
| "Database connection failed" | DB config issue              | Check DATABASE_URL           |

## Prevention Tips

1. **Always check environment variables** in production
2. **Test auth flows** in different browsers/incognito mode
3. **Monitor email delivery** in production
4. **Set up proper error logging** for production issues
5. **Keep Better Auth updated** to latest stable version

Remember: Most auth issues are configuration-related. Double-check your environment variables, database schema, and Better Auth configuration when troubleshooting.
