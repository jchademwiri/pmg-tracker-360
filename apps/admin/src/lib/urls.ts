/**
 * Shared URL resolution utilities for the admin console.
 *
 * Centralises the admin base-URL resolution so `auth.ts` and `actions.ts`
 * don't duplicate the same chain.
 */

export const ADMIN_PRODUCTION_URL = 'https://admin.tendertrack360.co.za';

/* ------------------------------------------------------------------ */
/*  Pure helpers                                                       */
/* ------------------------------------------------------------------ */

export function getOrigin(value?: string): string | null {
  if (!value) return null;

  try {
    const url = new URL(
      value.startsWith('http://') || value.startsWith('https://')
        ? value
        : `https://${value}`,
    );

    return url.origin;
  } catch {
    return null;
  }
}

export function getAdminOrigin(value?: string): string | null {
  const origin = getOrigin(value);
  if (!origin) return null;

  return new URL(origin).hostname.startsWith('admin.') ? origin : null;
}

/* ------------------------------------------------------------------ */
/*  Base URL resolution                                                */
/* ------------------------------------------------------------------ */

/**
 * Resolves the admin console's canonical base URL.
 *
 * Priority (highest first):
 *  1. User-configured `NEXT_PUBLIC_ADMIN_URL` or `ADMIN_PUBLIC_URL`
 *  2. Production → hardcoded `ADMIN_PRODUCTION_URL`
 *     (skips Vercel auto-injected vars because they can clash with the
 *      custom domain and cause the session cookie to be set for the
 *      wrong origin)
 *  3. Non-production → Vercel preview URLs / localhost
 */
export function getAdminBaseURL(): string {
  // 1. User-configured env vars (highest priority)
  const configured =
    getOrigin(process.env.NEXT_PUBLIC_ADMIN_URL) ||
    getOrigin(process.env.ADMIN_PUBLIC_URL);
  if (configured) return configured;

  // 2. Production — hardcoded URL
  if (process.env.NODE_ENV === 'production') {
    return ADMIN_PRODUCTION_URL;
  }

  // 3. Non-production — preview deployments / local dev
  return (
    getAdminOrigin(process.env.NEXT_PUBLIC_URL) ||
    getAdminOrigin(process.env.BETTER_AUTH_URL) ||
    getAdminOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    getAdminOrigin(process.env.VERCEL_URL) ||
    'http://localhost:3001'
  );
}
