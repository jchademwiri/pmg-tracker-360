/**
 * Server-side auth instance for the tracker app.
 * Re-exported from @pmg/auth/server — single source of truth.
 *
 * Usage:
 *   import { auth } from '@/lib/auth';
 *   const session = await auth.api.getSession({ headers: await headers() });
 */
export { auth } from '@pmg/auth/server';
export type { Auth } from '@pmg/auth/server';
