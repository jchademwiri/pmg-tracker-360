import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

// Paths allowed without a session cookie (exact match)
const EXACT_PUBLIC = new Set(['/login', '/setup', '/favicon.ico']);

// Paths allowed without a session cookie (prefix match)
const PREFIX_PUBLIC = ['/api/auth', '/_next/static', '/_next/image'];

/**
 * Pure helper: returns true iff the pathname is a public (unauthenticated) path.
 * Exported for property-based testing (Property 1).
 */
export function isPublicPath(pathname: string): boolean {
  if (EXACT_PUBLIC.has(pathname)) return true;
  if (PREFIX_PUBLIC.some((p) => pathname.startsWith(p))) return true;
  return false;
}

/**
 * Pure helper: returns true iff the request should be redirected to /login.
 * A redirect is required when the path is not public AND no valid cookie is present.
 * Exported for property-based testing (Property 2).
 */
export function shouldRedirect(
  pathname: string,
  cookieValue: string | undefined,
): boolean {
  if (isPublicPath(pathname)) return false;
  return !cookieValue;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: 'tender-track-360',
  });

  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
