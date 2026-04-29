'use server';

// ============================================================
// AUTH STUB — Phase 4 will replace this with real Better Auth
// Returns a hardcoded session so all pages render without auth.
// To test a "logged out" state, set STUB_AUTH=false in .env.local
// ============================================================

const STUB_ORGANIZATION_ID = 'stub-org-id';

export async function checkUserSession() {
  // TODO: Replace with real auth in Phase 4
  // const session = await auth.api.getSession({ headers: await headers() });
  return {
    hasSession: true,
    hasOrganization: true,
    activeOrganizationId: STUB_ORGANIZATION_ID,
    user: {
      id: 'stub-user-id',
      name: 'Dev User',
      email: 'dev@tendertrack360.co.za',
      role: 'owner' as const,
    },
  };
}

export type SessionCheck = Awaited<ReturnType<typeof checkUserSession>>;
