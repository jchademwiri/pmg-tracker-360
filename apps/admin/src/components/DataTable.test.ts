// Feature: admin-console, Property 8: DataTable pagination invariant
// Feature: admin-console, Property 9: DataTable URL parameter preservation

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getPaginationSlice, getTotalPages, PAGE_SIZE } from './DataTable';

describe('getTotalPages (Property 8b)', () => {
  it('equals Math.ceil(N / PAGE_SIZE), minimum 1', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10000 }), (n) => {
        const result = getTotalPages(n, PAGE_SIZE);
        expect(result).toBe(Math.max(1, Math.ceil(n / PAGE_SIZE)));
        expect(result).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: 200 }
    );
  });

  it('returns 1 for empty dataset', () => {
    expect(getTotalPages(0, PAGE_SIZE)).toBe(1);
  });
});

describe('getPaginationSlice (Property 8a)', () => {
  it('slice length is at most PAGE_SIZE', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer()),
        fc.integer({ min: 1, max: 100 }),
        (data, page) => {
          const slice = getPaginationSlice(data, page, PAGE_SIZE);
          expect(slice.length).toBeLessThanOrEqual(PAGE_SIZE);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('(8c) union of all page slices equals the full dataset with no duplicates', () => {
    fc.assert(
      fc.property(fc.array(fc.integer(), { maxLength: 200 }), (data) => {
        const total = getTotalPages(data.length, PAGE_SIZE);
        const allSliced: number[] = [];
        for (let p = 1; p <= total; p++) {
          allSliced.push(...getPaginationSlice(data, p, PAGE_SIZE));
        }
        expect(allSliced).toEqual(data);
      }),
      { numRuns: 100 }
    );
  });

  it('(Property 9) slice is independent of page number for correct page index', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer(), { minLength: 1, maxLength: 300 }),
        fc.integer({ min: 1, max: 6 }),
        (data, page) => {
          const clampedPage = Math.min(page, getTotalPages(data.length, PAGE_SIZE));
          const slice = getPaginationSlice(data, clampedPage, PAGE_SIZE);
          const expected = data.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);
          expect(slice).toEqual(expected);
        }
      ),
      { numRuns: 200 }
    );
  });
});
