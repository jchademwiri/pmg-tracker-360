# Invitation Flow Audit

**Date:** 2026-06-08  
**Reporter:** Jacob  
**Symptom:** Invited user had to create an organization before joining, required email verification,
and the invitation was not accepted automatically — required a resend.

---

## Current flow (what actually happens)

```
Admin sends invite
       ↓
User receives email → clicks link → GET /api/accept-invitation/[id]
       ↓
auth.api.acceptInvitation() called — FAILS because user has no account yet
       ↓
Redirect to /invite/accept/[id]   ← correct fallback
       ↓
AcceptInvitationClient renders — user fills in name + password
       ↓
POST /api/invite/complete-signup
  1. auth.api.signUpEmail() called
  2. emailVerified manually set to true in DB  ← works
  3. auth.api.acceptInvitation(signUpResult.headers)  ← UNRELIABLE (see Bug 2)
       ↓
Redirect to /dashboard
       ↓
Better Auth middleware checks: no active organization → redirect to /onboarding  ← Bug 3
       ↓
User forced to CREATE an organization
       ↓
Admin must resend invitation because:
  - Either Bug 2 caused acceptInvitation to fail silently
  - Or user skipped the invitation flow entirely after onboarding
```

---

## Bugs found — ordered by severity

---

### Bug 1 — `complete-signup` uses unreliable headers to accept the invitation

**File:** `apps/tracker/src/app/api/invite/complete-signup/route.ts`  
**Severity:** 🔴 Critical — root cause of the resend issue

After `signUpEmail()` completes, the code does:

```typescript
const signUpResult: any = await auth.api.signUpEmail({ ... });
const signUpHeaders: Headers | undefined = signUpResult?.headers;

// Then uses those headers to accept the invitation:
await auth.api.acceptInvitation({
  body: { invitationId },
  headers: signUpHeaders,   // ← problem
});
```

`signUpResult.headers` is the **response headers** from the sign-up call, not a
session cookie header. Better Auth's `acceptInvitation` requires an authenticated
session to work. If `signUpResult.headers` does not contain a valid `Set-Cookie`
with the new session token in the format Better Auth expects for its own internal
API calls, `acceptInvitation` silently fails (note the `try/catch` that swallows
the error and continues).

**Evidence of the silent failure:**
```typescript
try {
  await auth.api.acceptInvitation(acceptInvitationOptions);
} catch (acceptErr) {
  console.error('Accept invitation failed after signup:', acceptErr);
  // proceed — user was created; we can still return success ← ❌ wrong
}
```

The function returns `{ success: true }` even when the invitation was never
accepted. The user lands on `/dashboard` as a valid user but is not a member
of the invited organization.

**Fix:** After signup, get a proper session for the newly created user and use
that to accept the invitation. The most reliable pattern is to sign in
immediately after signup and use the resulting session:

```typescript
// In complete-signup/route.ts

// 1. Sign up
const signUpResult = await auth.api.signUpEmail({
  body: { name, email, password },
});

// 2. Immediately sign in to get a real authenticated session
const signInResult = await auth.api.signInEmail({
  body: { email, password },
});

// 3. Use the sign-in session headers for acceptInvitation
const sessionHeaders = signInResult?.headers;

await auth.api.acceptInvitation({
  body: { invitationId },
  headers: sessionHeaders,
});
```

Alternatively, if Better Auth supports direct member insertion, bypass the API
call entirely and write to the `member` table directly after signup:

```typescript
import { db } from '@pmg/db';
import { member, invitation } from '@pmg/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// After signup and email verification, accept the invite directly in the DB
const invite = await db.query.invitation.findFirst({
  where: eq(invitation.id, invitationId),
});

if (invite && invite.status === 'pending') {
  // Add user to the organization
  await db.insert(member).values({
    id: nanoid(),
    organizationId: invite.organizationId,
    userId: newUser.id,
    role: invite.role ?? 'member',
    createdAt: new Date(),
  });

  // Mark invitation as accepted
  await db.update(invitation)
    .set({ status: 'accepted' })
    .where(eq(invitation.id, invitationId));
}
```

This approach bypasses the flaky header-forwarding entirely and is fully reliable.

---

### Bug 2 — Invited users land on `/onboarding` and are forced to create an organization

**Files:**  
- `apps/tracker/src/app/onboarding/page.tsx`  
- Wherever the middleware/auth redirect to onboarding is configured  
**Severity:** 🔴 Critical — this is the most visible symptom

After signup, Better Auth routes users with no active organization to `/onboarding`.
The onboarding page shows `CreateOrganizationForm` with no awareness that the user
arrived via an invitation and already has an organization to join.

The user creates a brand-new organization, becomes its owner, and is now completely
disconnected from the invited organization. The invitation record is still `pending`.

**Fix — detect invited users in onboarding:**

Check for a pending invitation for the current user's email at the start of the
onboarding flow. If one exists, skip org creation and redirect to the invite
acceptance flow instead.

In `apps/tracker/src/app/onboarding/page.tsx`, convert to a server component
and add the check:

```typescript
// onboarding/page.tsx (server component)
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@pmg/db';
import { invitation } from '@pmg/db/schema';
import { and, eq } from 'drizzle-orm';

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) redirect('/login');

  // If this user has a pending invitation, don't force org creation
  const pendingInvite = await db.query.invitation.findFirst({
    where: and(
      eq(invitation.email, session.user.email),
      eq(invitation.status, 'pending')
    ),
  });

  if (pendingInvite) {
    // Redirect them to accept the invitation instead of creating an org
    redirect(`/invite/accept/${pendingInvite.id}`);
  }

  // No invite — show org creation form as normal
  return (
    // ... existing JSX
  );
}
```

**Additionally**, the middleware that redirects `no active org → /onboarding` should
carry the invitation context. If the user clicked an invitation link and then had
to log in, the `callbackUrl` should survive through the flow:

```
/invite/accept/[id]
  → user not logged in → /login?callbackUrl=/invite/accept/[id]
  → user logs in → redirect back to /invite/accept/[id]
  → invite accepted → /dashboard with org set
  → NEVER touches /onboarding
```

Verify your middleware preserves `callbackUrl` through the login flow for
invitation paths specifically.

---

### Bug 3 — Email verification is required despite invitation proving email ownership

**File:** `apps/tracker/src/app/api/invite/complete-signup/route.ts`  
**Severity:** 🟠 High — causes friction and breaks the expected flow

The code already attempts to fix this:

```typescript
const signUpResult: any = await auth.api.signUpEmail({
  body: { name, email, password },
  // @ts-ignore - some SDKs accept this option as per docs
  overrideDefaultEmailVerification: true,   // ← attempt to skip verification
});

// Also manually sets verified in DB:
await db.update(user)
  .set({ emailVerified: true })
  .where(eq(user.email, email));
```

The manual DB update (`emailVerified: true`) should work, but it runs **after**
`signUpEmail` has already potentially sent a verification email and gated
the session on that verification being complete.

The ordering matters: Better Auth may have already created the session in an
`unverified` state before the DB update runs, meaning the middleware blocks the
user until they verify — even though you just set `emailVerified = true`.

**Fix — set `emailVerified` before the session is created, or use a transaction:**

```typescript
// 1. Check if the user row already exists (in case of race condition)
// 2. Sign up
const signUpResult = await auth.api.signUpEmail({
  body: { name, email, password },
});

// 3. Set emailVerified IMMEDIATELY — before any redirect or session use
await db.update(user)
  .set({ emailVerified: true })
  .where(eq(user.email, email));

// 4. Now sign in to get a fresh session that reads the updated emailVerified state
const signInResult = await auth.api.signInEmail({
  body: { email, password },
});
```

Also check your Better Auth config in `apps/tracker/src/lib/auth.ts`. You likely
want to configure the email verification requirement to be skipped for
invite-originated signups:

```typescript
// In auth config
emailVerification: {
  sendVerificationEmail: async ({ user, url }) => {
    // Don't send verification email if user was created via invitation
    // Check if there's a pending invitation for this email
    const pendingInvite = await db.query.invitation.findFirst({
      where: and(
        eq(invitation.email, user.email),
        eq(invitation.status, 'pending')
      ),
    });
    if (pendingInvite) return; // skip — invitation email already verified ownership
    // otherwise send verification email normally
    await sendEmail(user.email, url);
  },
}
```

---

### Bug 4 — `/api/accept-invitation` tries to accept before checking if the user exists

**File:** `apps/tracker/src/app/api/accept-invitation/[invitationId]/route.ts`  
**Severity:** 🟠 High — causes a confusing error on every new-user click

```typescript
export async function GET(request, { params }) {
  const { invitationId } = await params;
  try {
    const data = await auth.api.acceptInvitation({  // ← always called first
      body: { invitationId },
      headers: await headers(),
    });
    return NextResponse.redirect(new URL(`/dashboard?invitationId=${invitationId}`, request.url));
  } catch (error) {
    // Fails for new users → redirect to /invite/accept/[id]
    return NextResponse.redirect(new URL(`/invite/accept/${invitationId}`, request.url));
  }
}
```

For a **new user** clicking the invite link, this always throws because they have
no session. The catch redirect is correct, but the initial failed call is logged
as an error and wastes a round-trip.

**Fix — check session before attempting acceptInvitation:**

```typescript
export async function GET(request, { params }) {
  const { invitationId } = await params;
  const requestHeaders = await headers();

  // Check if user is authenticated first
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    // Not logged in — send to the invite acceptance / signup page
    return NextResponse.redirect(
      new URL(`/invite/accept/${invitationId}`, request.url)
    );
  }

  try {
    await auth.api.acceptInvitation({
      body: { invitationId },
      headers: requestHeaders,
    });
    return NextResponse.redirect(
      new URL(`/dashboard?invitationId=${invitationId}`, request.url)
    );
  } catch (error) {
    console.error('acceptInvitation failed for authenticated user:', error);
    return NextResponse.redirect(
      new URL(`/invite/accept/${invitationId}`, request.url)
    );
  }
}
```

---

### Bug 5 — Existing user accepting an invitation is not redirected to set their active org

**File:** `apps/tracker/src/app/api/accept-invitation/[invitationId]/route.ts`  
**Severity:** 🟠 Medium — existing users accept but end up on wrong org context

When `acceptInvitation` succeeds for an **existing user**, they are redirected to
`/dashboard?invitationId=${invitationId}`. But if they previously had a different
organization active, their active org context does not switch to the newly joined org.

**Fix — after accepting, explicitly set the active organization:**

```typescript
// After successful acceptInvitation, get the org from the invitation record
const invite = await db.query.invitation.findFirst({
  where: eq(invitation.id, invitationId),
});

if (invite) {
  // Set the accepted org as the active org for this session
  await rememberActiveOrganization(invite.organizationId);
}

return NextResponse.redirect(new URL('/dashboard', request.url));
```

---

### Bug 6 — `resendInvitation` creates a new `expiresAt` but the original invite record is reused

**File:** `apps/tracker/src/app/(dashboard)/organization/[slug]/components/invitations-tab.tsx`  
**Severity:** 🟡 Low — minor but worth noting

The resend flow calls `resendInvitation(invitationId)` from the server. Depending
on how that server action is implemented, it may simply resend the email with the
same token and same `expiresAt`. If the invite expired, the user will receive a
fresh email but clicking it will still hit an expired invitation record.

**Fix — confirm `resendInvitation` server action:**  
Verify `apps/tracker/src/server/invitations.ts` `resendInvitation` does both:
1. Updates `expiresAt` to `now + 7 days`
2. Resets `status` back to `'pending'` if it was `'expired'`

---

## Summary table

| # | Bug | File | Severity | Causes resend? |
|---|---|---|---|---|
| 1 | `acceptInvitation` uses unreliable signup headers | `complete-signup/route.ts` | 🔴 Critical | Yes — invitation never marked accepted |
| 2 | Invited users routed to org creation onboarding | `onboarding/page.tsx` + middleware | 🔴 Critical | Yes — user disconnects from invite entirely |
| 3 | Email verification fires despite invitation proving ownership | `complete-signup/route.ts` | 🟠 High | Partial — blocks session |
| 4 | `acceptInvitation` called before checking session | `accept-invitation/route.ts` | 🟠 High | No — but adds error noise |
| 5 | Active org context not switched after acceptance | `accept-invitation/route.ts` | 🟠 Medium | No — UX confusion |
| 6 | `resendInvitation` may not refresh `expiresAt` | `server/invitations.ts` | 🟡 Low | No — but resent emails may be to expired invites |

---

## Recommended fix order

**Deploy 1 (fixes the resend issue immediately):**

1. Fix Bug 1 — replace header-forwarding in `complete-signup` with
   sign-in-after-signup + direct DB member insertion
2. Fix Bug 2 — add pending invite check to onboarding, redirect invited users
   back to `/invite/accept/[id]`

**Deploy 2 (cleans up auth UX):**

3. Fix Bug 3 — skip verification email in Better Auth config for invite-originated signups
4. Fix Bug 4 — check session before calling `acceptInvitation` in the GET route
5. Fix Bug 5 — set active org after acceptance

**Deploy 3 (minor polish):**

6. Fix Bug 6 — verify resend updates `expiresAt` and resets `status`

---

## The ideal invitation flow after fixes

```
Admin sends invite
       ↓
User receives email → clicks link
       ↓
GET /api/accept-invitation/[id]
  → no session → redirect /invite/accept/[id]   (no wasted API call)
       ↓
/invite/accept/[id] — server checks:
  - invite exists? ✓
  - user exists? NO → show signup form
       ↓
User fills name + password → POST /api/invite/complete-signup
  1. signUpEmail()
  2. set emailVerified = true (DB)
  3. signInEmail() to get real session
  4. direct DB insert into member table (reliable)
  5. update invitation.status = 'accepted'
  6. set activeOrganizationId on session
       ↓
Redirect → /dashboard (correct org already active)
  → onboarding NEVER shown for invited users
       ↓
User is a member of the invited org, email verified, no resend needed ✓
```
