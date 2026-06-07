// Feature: admin-console, Property 5: Ticket status transitions are forward-only

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

// Stub out server-only modules so the pure helper can be imported without a DB connection.
vi.mock('@pmg/db', () => ({ db: {} }));
vi.mock('@pmg/db/schema', () => ({ supportTickets: {}, securityAuditLog: {} }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: vi.fn() } } }));
vi.mock('@/lib/constants', () => ({ PLATFORM_ORG_ID: 'org_platform_admin' }));

import { validateStatusTransition } from './actions';

const VALID_STATUSES = ['open', 'in_progress', 'closed'] as const;

describe('validateStatusTransition (Property 5)', () => {
  it('returns true only for open→in_progress', () => {
    expect(validateStatusTransition('open', 'in_progress')).toBe(true);
  });

  it('returns true only for in_progress→closed', () => {
    expect(validateStatusTransition('in_progress', 'closed')).toBe(true);
  });

  it('returns false for same-status transitions', () => {
    for (const s of VALID_STATUSES) {
      expect(validateStatusTransition(s, s)).toBe(false);
    }
  });

  it('returns false for backward transitions', () => {
    expect(validateStatusTransition('in_progress', 'open')).toBe(false);
    expect(validateStatusTransition('closed', 'in_progress')).toBe(false);
    expect(validateStatusTransition('closed', 'open')).toBe(false);
  });

  it('returns false for all invalid combinations (property-based)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_STATUSES),
        fc.constantFrom(...VALID_STATUSES),
        (current, requested) => {
          const expected =
            (current === 'open' && requested === 'in_progress') ||
            (current === 'in_progress' && requested === 'closed');
          expect(validateStatusTransition(current, requested)).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns false for arbitrary unknown status strings', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (current, requested) => {
        const expected =
          (current === 'open' && requested === 'in_progress') ||
          (current === 'in_progress' && requested === 'closed');
        expect(validateStatusTransition(current, requested)).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });
});
