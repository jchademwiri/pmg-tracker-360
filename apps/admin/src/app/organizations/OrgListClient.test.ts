// Feature: admin-console, Property 15: Purge date highlight is time-relative

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock Next.js navigation so the client component module can be imported
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/'),
}));
// Mock DataTable and OrgDrawer to avoid complex component tree in unit tests
vi.mock('@/components/DataTable', () => ({ default: vi.fn(), PAGE_SIZE: 50, getPaginationSlice: (d: unknown[], p: number, s: number) => d.slice((p-1)*s, p*s), getTotalPages: (n: number, s: number) => Math.max(1, Math.ceil(n/s)) }));
vi.mock('@/components/OrgDrawer', () => ({ default: vi.fn(() => null) }));
vi.mock('@/components/StatusBadge', () => ({ default: vi.fn(() => null) }));

import { isPurgeImminent } from './OrgListClient';

// Constrain dates to a safe range to prevent JS Date arithmetic overflow.
// fc.date() can produce extreme dates (year ±275760) where getTime() ± offset
// overflows Number.MAX_SAFE_INTEGER and produces Infinity / wrong results.
const SAFE_MIN_MS = new Date('2000-01-01T00:00:00.000Z').getTime();
const SAFE_MAX_MS = new Date('2100-01-01T00:00:00.000Z').getTime();
const safeDate = fc.date({ min: new Date(SAFE_MIN_MS), max: new Date(SAFE_MAX_MS) });

describe('isPurgeImminent (Property 15)', () => {
  it('returns false for null purge date', () => {
    fc.assert(
      fc.property(safeDate, (now) => {
        expect(isPurgeImminent(null, now)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('returns true when purge date is within 7 days (inclusive)', () => {
    fc.assert(
      fc.property(
        safeDate,
        fc.integer({ min: 0, max: 7 * 24 * 60 * 60 * 1000 }),
        (now, offsetMs) => {
          const purgeDate = new Date(now.getTime() + offsetMs);
          expect(isPurgeImminent(purgeDate, now)).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('returns false when purge date is more than 7 days in the future', () => {
    fc.assert(
      fc.property(
        safeDate,
        fc.integer({ min: 7 * 24 * 60 * 60 * 1001, max: 365 * 24 * 60 * 60 * 1000 }),
        (now, offsetMs) => {
          const purgeDate = new Date(now.getTime() + offsetMs);
          expect(isPurgeImminent(purgeDate, now)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('returns true when purge date is in the past', () => {
    fc.assert(
      fc.property(
        safeDate,
        // Cap offset to avoid underflowing below SAFE_MIN_MS
        fc.integer({ min: 0, max: 365 * 24 * 60 * 60 * 1000 }),
        (now, pastOffsetMs) => {
          const purgeDate = new Date(now.getTime() - pastOffsetMs);
          expect(isPurgeImminent(purgeDate, now)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
