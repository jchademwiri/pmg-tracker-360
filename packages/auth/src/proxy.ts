/**
 * Proxy helpers for @pmg/auth.
 *
 * Exports the session cookie name so proxy.ts can check for its existence
 * without importing the full auth instance (which would cause DB connections
 * on every request).
 *
 * Usage in apps/tracker/src/proxy.ts:
 *   import { SESSION_COOKIE_NAME } from '@pmg/auth/proxy';
 *   const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
 */

/**
 * The cookie name Better Auth uses for session tokens.
 * Default is 'better-auth.session_token' but can be customized in betterAuth config.
 */
export const SESSION_COOKIE_NAME = 'better-auth.session_token';

/**
 * Protected route prefixes that require authentication.
 * Used by proxy.ts to determine which routes need session checks.
 */
export const PROTECTED_PREFIXES = ['/dashboard', '/onboarding'];

/**
 * Auth-only route prefixes that should redirect to /dashboard if already logged in.
 * Used by proxy.ts to prevent logged-in users from seeing login/signup pages.
 */
export const AUTH_ONLY_PREFIXES = [
  '/login',
  '/sign-up',
  '/forgot-password',
  '/reset-password',
];

/**
 * Public routes that don't require any auth checks.
 */
export const PUBLIC_PREFIXES = ['/api/auth', '/api/webhook'];
