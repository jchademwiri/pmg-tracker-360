/**
 * Session check helper for the tracker app.
 * Re-exported from @pmg/auth/rbac — real Better Auth session validation.
 *
 * Usage in server components and server actions:
 *   import { checkUserSession } from '@/lib/session-check';
 *   const session = await checkUserSession();
 *   if (!session.hasSession) redirect('/login');
 */
export { checkUserSession } from '@pmg/auth/rbac';
export type { UserSessionCheck, SessionCheck, NoSessionCheck } from '@pmg/auth/types';
