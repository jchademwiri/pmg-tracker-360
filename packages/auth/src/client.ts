/**
 * Better Auth browser client for @pmg/auth.
 *
 * Usage in client components:
 *   import { authClient, signOut } from '@pmg/auth/client';
 *
 * This replaces apps/tracker/src/lib/auth-client.ts
 */

'use client';

import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';
import { ac, owner, admin, manager, member } from './permissions';

export const authClient = createAuthClient({
  baseURL:
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000',
  plugins: [
    organizationClient({
      ac,
      roles: { owner, admin, manager, member },
    }),
  ],
});

/**
 * Returns the post-login redirect path.
 * On the main domain → /dashboard.
 * On a subdomain → / (subdomain root).
 */
export function getRedirectPath(): string {
  if (typeof window === 'undefined') return '/dashboard';

  const hostname = window.location.hostname;
  const mainDomainUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';

  let mainHostname = 'localhost';
  try {
    mainHostname = new URL(mainDomainUrl).hostname;
  } catch {
    // keep fallback
  }

  const currentHost = hostname.replace(/^www\./, '');
  const rootHost = mainHostname.replace(/^www\./, '');

  if (currentHost !== rootHost && currentHost.endsWith(rootHost)) {
    return '/';
  }

  return '/dashboard';
}

export const signInWithGoogle = async (callbackURL?: string) => {
  const finalCallbackURL = callbackURL ?? getRedirectPath();
  await authClient.signIn.social({
    provider: 'google',
    callbackURL: finalCallbackURL,
  });
};

export const signOut = async () => {
  try {
    await authClient.signOut();
  } catch (error) {
    console.error('Auth client sign out error:', error);

    const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';
    try {
      const response = await fetch(`${baseUrl}/api/auth/sign-out`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Sign out API call failed: ${response.status}`);
      }
    } catch (apiError) {
      console.error('Direct API sign out also failed:', apiError);
    }

    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
  }
};
