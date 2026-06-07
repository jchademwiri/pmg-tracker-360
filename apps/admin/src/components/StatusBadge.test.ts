// Feature: admin-console, Property 7: StatusBadge colour mapping is consistent and exhaustive

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getStatusClasses } from './StatusBadge';

const KNOWN_STATUSES = [
  'open', 'in_progress', 'closed', 'active', 'deleted',
  'suspicious', 'bug', 'feature', 'other',
];

const NEUTRAL_ZINC = { bg: 'bg-zinc-800/60', text: 'text-zinc-400', border: 'border-zinc-700/40' };

describe('getStatusClasses (Property 7)', () => {
  it('(7a) returns deterministic non-empty classes for all known statuses', () => {
    for (const status of KNOWN_STATUSES) {
      const result = getStatusClasses(status);
      expect(result.bg).toBeTruthy();
      expect(result.text).toBeTruthy();
      expect(result.border).toBeTruthy();
      // Deterministic — calling twice returns same value
      expect(getStatusClasses(status)).toEqual(result);
    }
  });

  it('(7b) returns neutral zinc for any unknown status without throwing', () => {
    fc.assert(
      fc.property(fc.string(), (status) => {
        if (!KNOWN_STATUSES.includes(status)) {
          expect(() => getStatusClasses(status)).not.toThrow();
          expect(getStatusClasses(status)).toEqual(NEUTRAL_ZINC);
        }
      }),
      { numRuns: 200 }
    );
  });

  it('(7b) returns neutral zinc for empty string', () => {
    expect(getStatusClasses('')).toEqual(NEUTRAL_ZINC);
  });
});
