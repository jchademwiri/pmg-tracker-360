/**
 * RBAC helpers for @pmg/auth.
 *
 * These run in server components, server actions, and route handlers.
 * They call auth.api.getSession() which validates the session token against the DB.
 *
 * Usage:
 *   import { requireSession, requireRole } from '@pmg/auth/rbac';
 *
 *   // In a server component or layout:
 *   const { session, user } = await requireSession(await headers());
 *
 *   // In a server action:
 *   const { user } = await requireRole(await headers(), ['owner', 'admin']);
 */

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from './server';
import type { Role, SessionCheck, UserSessionCheck } from './types';

/**
 * Fetches the current session without throwing.
 * Returns a typed SessionCheck or NoSessionCheck.
 */
export async function checkUserSession(): Promise<UserSessionCheck> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        hasSession: false,
        hasOrganization: false,
        activeOrganizationId: null,
        user: null,
      };
    }

    const activeOrganizationId =
      session.session.activeOrganizationId ?? null;

    return {
      hasSession: true,
      hasOrganization: !!activeOrganizationId,
      activeOrganizationId,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified ?? false,
        // Better Auth stores org-level role in the member table.
        // The user.role field is the global platform role ('user' | 'admin').
        // We cast to Role here; org-level role checks use requireOrgRole().
        role: (session.user.role as Role) ?? 'member',
        image: session.user.image ?? null,
      },
    };
  } catch {
    return {
      hasSession: false,
      hasOrganization: false,
      activeOrganizationId: null,
      user: null,
    };
  }
}

/**
 * Requires a valid session. Redirects to /login if not authenticated.
 * Returns the typed SessionCheck (always hasSession: true).
 *
 * Use in dashboard layouts and server components that need the user.
 */
export async function requireSession(
  returnTo?: string
): Promise<SessionCheck> {
  const check = await checkUserSession();

  if (!check.hasSession) {
    const loginUrl = returnTo
      ? `/login?returnTo=${encodeURIComponent(returnTo)}`
      : '/login';
    redirect(loginUrl);
  }

  return check;
}

/**
 * Requires a valid session AND an active organization.
 * Redirects to /login if not authenticated, /onboarding if no org.
 */
export async function requireOrganization(
  returnTo?: string
): Promise<SessionCheck & { activeOrganizationId: string }> {
  const check = await requireSession(returnTo);

  if (!check.hasOrganization || !check.activeOrganizationId) {
    redirect('/onboarding');
  }

  return check as SessionCheck & { activeOrganizationId: string };
}

/**
 * Requires a valid session with one of the specified roles.
 * Redirects to /login if not authenticated, throws 403 if wrong role.
 *
 * Note: this checks the global user.role field. For org-level role checks,
 * query the member table directly with the organizationId.
 */
export async function requireRole(
  allowedRoles: Role[],
  returnTo?: string
): Promise<SessionCheck> {
  const check = await requireSession(returnTo);

  if (!allowedRoles.includes(check.user.role as Role)) {
    // Redirect to dashboard with an error rather than exposing a 403 page
    redirect('/dashboard?error=unauthorized');
  }

  return check;
}

/**
 * Returns true if the given role is in the allowed list.
 * Pure helper — no redirects.
 */
export function hasRole(userRole: string, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole as Role);
}

/**
 * Role hierarchy: owner > admin > manager > member.
 * Returns true if userRole meets the minimum required role.
 */
export function meetsMinimumRole(userRole: string, minimum: Role): boolean {
  const hierarchy: Role[] = ['member', 'manager', 'admin', 'owner'];
  const userIndex = hierarchy.indexOf(userRole as Role);
  const minIndex = hierarchy.indexOf(minimum);
  return userIndex >= minIndex;
}
