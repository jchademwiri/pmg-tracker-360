import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getOrigin,
  getAdminOrigin,
  getAdminBaseURL,
  ADMIN_PRODUCTION_URL,
} from '../urls';

/* ------------------------------------------------------------------ */
/*  getOrigin                                                          */
/* ------------------------------------------------------------------ */

describe('getOrigin', () => {
  it('returns null for undefined', () => {
    expect(getOrigin()).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getOrigin('')).toBeNull();
  });

  it('returns null for a string that is not a valid URL', () => {
    expect(getOrigin('not a url at all')).toBeNull();
  });

  it('returns origin for a full HTTPS URL', () => {
    expect(getOrigin('https://admin.tendertrack360.co.za')).toBe(
      'https://admin.tendertrack360.co.za',
    );
  });

  it('returns origin for a full HTTP URL', () => {
    expect(getOrigin('http://localhost:3001')).toBe('http://localhost:3001');
  });

  it('returns origin for a full HTTPS URL with trailing slash', () => {
    expect(getOrigin('https://admin.tendertrack360.co.za/')).toBe(
      'https://admin.tendertrack360.co.za',
    );
  });

  it('returns origin for a full HTTPS URL with path', () => {
    expect(getOrigin('https://admin.tendertrack360.co.za/some/path')).toBe(
      'https://admin.tendertrack360.co.za',
    );
  });

  it('auto-prepends https:// when no protocol is given', () => {
    expect(getOrigin('admin.tendertrack360.co.za')).toBe(
      'https://admin.tendertrack360.co.za',
    );
  });

  it('auto-prepends https:// for a bare Vercel-style hostname', () => {
    expect(getOrigin('admin-tendertrack360.vercel.app')).toBe(
      'https://admin-tendertrack360.vercel.app',
    );
  });
});

/* ------------------------------------------------------------------ */
/*  getAdminOrigin                                                     */
/* ------------------------------------------------------------------ */

describe('getAdminOrigin', () => {
  it('returns null for undefined', () => {
    expect(getAdminOrigin()).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getAdminOrigin('')).toBeNull();
  });

  it('returns null for a hostname that does not start with admin.', () => {
    expect(getAdminOrigin('https://tendertrack360.co.za')).toBeNull();
  });

  it('returns null for a hostname starting with admin- (not admin.)', () => {
    expect(
      getAdminOrigin('https://admin-tendertrack360.vercel.app'),
    ).toBeNull();
  });

  it('returns origin for a hostname starting with admin.', () => {
    expect(getAdminOrigin('https://admin.tendertrack360.co.za')).toBe(
      'https://admin.tendertrack360.co.za',
    );
  });

  it('auto-prepends https:// for bare admin hostname', () => {
    expect(getAdminOrigin('admin.tendertrack360.co.za')).toBe(
      'https://admin.tendertrack360.co.za',
    );
  });

  it('returns null for a subdomain like xadmin.example.com', () => {
    expect(getAdminOrigin('https://xadmin.example.com')).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/*  getAdminBaseURL                                                    */
/* ------------------------------------------------------------------ */

describe('getAdminBaseURL', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    // Reset env vars before each test
    delete process.env.NEXT_PUBLIC_ADMIN_URL;
    delete process.env.ADMIN_PUBLIC_URL;
    delete process.env.NODE_ENV;
    delete process.env.NEXT_PUBLIC_URL;
    delete process.env.BETTER_AUTH_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;
  });

  afterEach(() => {
    // Restore original env vars
    process.env = { ...ORIGINAL_ENV };
  });

  // ── User-configured env vars (priority 1) ─────────────────────────

  it('uses NEXT_PUBLIC_ADMIN_URL when set', () => {
    process.env.NEXT_PUBLIC_ADMIN_URL = 'https://admin.example.com';
    expect(getAdminBaseURL()).toBe('https://admin.example.com');
  });

  it('uses ADMIN_PUBLIC_URL when NEXT_PUBLIC_ADMIN_URL is not set', () => {
    process.env.ADMIN_PUBLIC_URL = 'https://admin.backup.com';
    expect(getAdminBaseURL()).toBe('https://admin.backup.com');
  });

  it('prefers NEXT_PUBLIC_ADMIN_URL over ADMIN_PUBLIC_URL', () => {
    process.env.NEXT_PUBLIC_ADMIN_URL = 'https://admin.primary.com';
    process.env.ADMIN_PUBLIC_URL = 'https://admin.secondary.com';
    expect(getAdminBaseURL()).toBe('https://admin.primary.com');
  });

  // ── Production fallback (priority 2) ──────────────────────────────

  it('falls back to ADMIN_PRODUCTION_URL in production', () => {
    process.env.NODE_ENV = 'production';
    expect(getAdminBaseURL()).toBe(ADMIN_PRODUCTION_URL);
  });

  it('uses NEXT_PUBLIC_ADMIN_URL even when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production';
    process.env.NEXT_PUBLIC_ADMIN_URL = 'https://admin.custom.com';
    expect(getAdminBaseURL()).toBe('https://admin.custom.com');
  });

  it('ignores Vercel auto-vars in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.VERCEL_URL = 'admin-tendertrack360.vercel.app';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'admin.vercel.app';
    expect(getAdminBaseURL()).toBe(ADMIN_PRODUCTION_URL);
  });

  // ── Non-production fallback (priority 3) ──────────────────────────

  it('falls back to localhost in non-production when nothing is set', () => {
    process.env.NODE_ENV = 'development';
    expect(getAdminBaseURL()).toBe('http://localhost:3001');
  });

  it('uses NEXT_PUBLIC_URL in non-production when hostname starts with admin.', () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_URL = 'https://admin.preview.vercel.app';
    expect(getAdminBaseURL()).toBe('https://admin.preview.vercel.app');
  });

  it('skips NEXT_PUBLIC_URL in non-production when hostname does not start with admin.', () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_URL = 'https://tendertrack360.co.za';
    expect(getAdminBaseURL()).toBe('http://localhost:3001');
  });

  it('uses BETTER_AUTH_URL in non-production when hostname starts with admin.', () => {
    process.env.NODE_ENV = 'development';
    process.env.BETTER_AUTH_URL = 'https://admin.betterauth.dev';
    expect(getAdminBaseURL()).toBe('https://admin.betterauth.dev');
  });

  it('uses VERCEL_PROJECT_PRODUCTION_URL in non-production when hostname starts with admin.', () => {
    process.env.NODE_ENV = 'development';
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'https://admin.prod.vercel.app';
    expect(getAdminBaseURL()).toBe('https://admin.prod.vercel.app');
  });

  it('uses VERCEL_URL in non-production when hostname starts with admin.', () => {
    process.env.NODE_ENV = 'development';
    process.env.VERCEL_URL = 'https://admin.deploy.vercel.app';
    expect(getAdminBaseURL()).toBe('https://admin.deploy.vercel.app');
  });

  it('chains fallbacks correctly in non-production', () => {
    process.env.NODE_ENV = 'development';
    process.env.NEXT_PUBLIC_URL = 'https://admin.staging.com';
    process.env.BETTER_AUTH_URL = 'https://admin.should-not-be-used.com';
    // NEXT_PUBLIC_URL wins because it's checked first
    expect(getAdminBaseURL()).toBe('https://admin.staging.com');
  });
});
