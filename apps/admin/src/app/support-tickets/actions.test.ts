// Feature: admin-console, Property 5: Ticket status transitions are forward-only

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { validateStatusTransition } from './ticket-utils';

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
