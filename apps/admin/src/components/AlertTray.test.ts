// Feature: admin-console, Property 6: Alert rendering threshold invariant

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { filterAndSortAlerts, type Alert } from './AlertTray';

const SEVERITIES = ['critical', 'high', 'medium', 'low'] as const;
const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

const alertArb = fc.record({
  id: fc.string(),
  label: fc.string(),
  count: fc.integer({ min: 0, max: 1000 }),
  severity: fc.constantFrom(...SEVERITIES),
  href: fc.string(),
});

describe('filterAndSortAlerts (Property 6)', () => {
  it('(6a) output contains exactly the alerts where count > 0', () => {
    fc.assert(
      fc.property(fc.array(alertArb), (alerts) => {
        const result = filterAndSortAlerts(alerts);
        const expectedIds = new Set(alerts.filter((a) => a.count > 0).map((a) => a.id));
        const resultIds = new Set(result.map((a) => a.id));
        expect(resultIds).toEqual(expectedIds);
      }),
      { numRuns: 200 }
    );
  });

  it('(6b) output is sorted critical → high → medium → low', () => {
    fc.assert(
      fc.property(fc.array(alertArb), (alerts) => {
        const result = filterAndSortAlerts(alerts);
        for (let i = 1; i < result.length; i++) {
          expect(SEVERITY_ORDER[result[i - 1]!.severity]).toBeLessThanOrEqual(
            SEVERITY_ORDER[result[i]!.severity]
          );
        }
      }),
      { numRuns: 200 }
    );
  });

  it('returns empty array when all counts are zero', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            label: fc.string(),
            count: fc.constant(0),
            severity: fc.constantFrom(...SEVERITIES),
            href: fc.string(),
          })
        ),
        (alerts) => {
          expect(filterAndSortAlerts(alerts)).toHaveLength(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
