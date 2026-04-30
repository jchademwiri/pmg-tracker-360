/**
 * Next.js 16 proxy — replaces middleware.ts.
 *
 * Runs on every request matched by `config.matcher`.
 * Performs a fast, O(1) cookie-existence check only — no DB calls.
 *
 * Real session validation (token expiry, DB lookup) happens in:
 *   - Dashboard layout  → requireSession() from @pmg/auth/rbac
 *   - Server actions    → requireSession() / requireRole()
 *
 * Route logic:
 *   Protected (/dashboard, /onboarding)
 *     → no cookie  → redirect /login?returnTo=<path>
 *     → has cookie → pass through (layout validates)
 *
 *   Auth-only (/login, /sign-up, /forgot-password, /reset-password)
 *     → has cookie → redirect /dashboard (already logged in)
 *     → no cookie  → pass through
 *
 *   Invite routes (/invite/*)
 *     → always pass through (page handles both authed and unauthed states)
 *
 *   Everything else → pass through
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  PROTECTED_PREFIXES,
  AUTH_ONLY_PREFIXES,
} from '@pmg/auth/proxy';

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const hasSession = !!request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // --- Protected routes: require session ---
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtected && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  // --- Auth-only routes: redirect away if already logged in ---
  const isAuthOnly = AUTH_ONLY_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isAuthOnly && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - image/font file extensions
     * - /api/auth/*   (Better Auth handler — must never be blocked)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ttf|otf)$).*)',
  ],
};
