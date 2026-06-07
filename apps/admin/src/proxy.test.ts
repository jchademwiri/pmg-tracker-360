// Feature: admin-console, Property 1: Public path classification is exhaustive and correct
// Feature: admin-console, Property 2: Unauthenticated requests to protected routes always redirect

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isPublicPath, shouldRedirect } from './proxy';

const EXACT_PUBLIC = ['/login', '/setup', '/favicon.ico'];
const PREFIX_PUBLIC = ['/api/auth', '/_next/static', '/_next/image'];

describe('isPublicPath (Property 1)', () => {
  it('returns true for exact-match public paths', () => {
    for (const p of EXACT_PUBLIC) {
      expect(isPublicPath(p)).toBe(true);
    }
  });

  it('returns true for paths starting with a public prefix', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PREFIX_PUBLIC),
        fc.string({ minLength: 0, maxLength: 30 }),
        (prefix, suffix) => {
          expect(isPublicPath(prefix + suffix)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false for arbitrary non-public paths', () => {
    fc.assert(
      fc.property(fc.string(), (pathname) => {
        const isExact = EXACT_PUBLIC.includes(pathname);
        const hasPrefix = PREFIX_PUBLIC.some((p) => pathname.startsWith(p));
        expect(isPublicPath(pathname)).toBe(isExact || hasPrefix);
      }),
      { numRuns: 200 }
    );
  });

  it('returns false for paths that contain but do not start with a public prefix', () => {
    const embeddedPaths = ['/foo/api/auth', '/hidden/_next/static', '/x/login'];
    for (const p of embeddedPaths) {
      // Only test the ones that are genuinely not public
      if (!EXACT_PUBLIC.includes(p) && !PREFIX_PUBLIC.some((pf) => p.startsWith(pf))) {
        expect(isPublicPath(p)).toBe(false);
      }
    }
  });
});

describe('shouldRedirect (Property 2)', () => {
  it('returns true for non-public paths with absent/empty cookie', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.constantFrom(undefined, '', null as unknown as undefined),
        (pathname, cookieValue) => {
          if (!isPublicPath(pathname)) {
            expect(shouldRedirect(pathname, cookieValue ?? undefined)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false for non-public paths with a non-empty cookie', () => {
    fc.assert(
      fc.property(
        fc.string(),
        fc.string({ minLength: 1 }),
        (pathname, cookieValue) => {
          if (!isPublicPath(pathname)) {
            expect(shouldRedirect(pathname, cookieValue)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('always returns false for public paths regardless of cookie', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...EXACT_PUBLIC, ...PREFIX_PUBLIC),
        fc.option(fc.string()),
        (pathname, cookie) => {
          expect(shouldRedirect(pathname, cookie ?? undefined)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
