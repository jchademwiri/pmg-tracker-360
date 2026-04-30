/**
 * Browser auth client for the tracker app.
 * Re-exported from @pmg/auth/client — single source of truth.
 *
 * Usage in client components:
 *   import { authClient, signOut } from '@/lib/auth-client';
 */
export { authClient, signOut, signInWithGoogle, getRedirectPath } from '@pmg/auth/client';
