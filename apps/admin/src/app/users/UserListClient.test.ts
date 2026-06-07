// Feature: admin-console, Property 10: Client-side filters apply AND logic

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock Next.js navigation hooks to allow importing the client component module
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/'),
}));

import { applyUserFilters, type UserFilters } from './UserListClient';
import type { UserWithMemberships } from '@/lib/admin-queries';

function makeUser(overrides: Partial<UserWithMemberships> = {}): UserWithMemberships {
  return {
    id: 'u1',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: true,
    plan: 'free',
    role: 'user',
    createdAt: new Date(),
    lastActiveOrganizationId: null,
    lastActiveOrgName: null,
    providerId: null,
    memberships: [],
    isGhost: true,
    ...overrides,
  };
}

const userArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1 }),
  email: fc.emailAddress(),
  emailVerified: fc.boolean(),
  plan: fc.constantFrom('free', 'pro'),
  role: fc.constantFrom('user', 'admin'),
  createdAt: fc.date(),
  lastActiveOrganizationId: fc.option(fc.string(), { nil: null }),
  lastActiveOrgName: fc.option(fc.string(), { nil: null }),
  providerId: fc.option(fc.string(), { nil: null }),
  memberships: fc.array(fc.record({ orgId: fc.string(), orgName: fc.string(), role: fc.string() })),
  isGhost: fc.boolean(),
});

const ALL_FILTERS: UserFilters = { planFilter: 'all', roleFilter: 'all', verifiedFilter: 'all', search: '' };

describe('applyUserFilters (Property 10)', () => {
  it('(10c) all-pass filters return the full input', () => {
    fc.assert(
      fc.property(fc.array(userArb), (users) => {
        expect(applyUserFilters(users, ALL_FILTERS)).toEqual(users);
      }),
      { numRuns: 100 }
    );
  });

  it('(10a) every user in output satisfies all active criteria', () => {
    fc.assert(
      fc.property(
        fc.array(userArb),
        fc.constantFrom<UserFilters['planFilter']>('all', 'free', 'pro'),
        fc.constantFrom<UserFilters['roleFilter']>('all', 'user', 'admin'),
        fc.constantFrom<UserFilters['verifiedFilter']>('all', 'verified', 'unverified'),
        (users, planFilter, roleFilter, verifiedFilter) => {
          const filters: UserFilters = { planFilter, roleFilter, verifiedFilter, search: '' };
          const result = applyUserFilters(users, filters);
          for (const u of result) {
            if (planFilter !== 'all') expect(u.plan).toBe(planFilter);
            if (roleFilter !== 'all') expect(u.role).toBe(roleFilter);
            if (verifiedFilter === 'verified') expect(u.emailVerified).toBe(true);
            if (verifiedFilter === 'unverified') expect(u.emailVerified).toBe(false);
          }
        }
      ),
      { numRuns: 200 }
    );
  });

  it('(10b) no matching user is absent from the output', () => {
    fc.assert(
      fc.property(
        fc.array(userArb),
        fc.constantFrom<UserFilters['planFilter']>('all', 'free', 'pro'),
        fc.constantFrom<UserFilters['roleFilter']>('all', 'user', 'admin'),
        fc.constantFrom<UserFilters['verifiedFilter']>('all', 'verified', 'unverified'),
        (users, planFilter, roleFilter, verifiedFilter) => {
          const filters: UserFilters = { planFilter, roleFilter, verifiedFilter, search: '' };
          const result = applyUserFilters(users, filters);
          const resultIds = new Set(result.map((u) => u.id));
          for (const u of users) {
            const planMatch = planFilter === 'all' || u.plan === planFilter;
            const roleMatch = roleFilter === 'all' || u.role === roleFilter;
            const verifiedMatch =
              verifiedFilter === 'all' ? true :
              verifiedFilter === 'verified' ? u.emailVerified : !u.emailVerified;
            if (planMatch && roleMatch && verifiedMatch) {
              expect(resultIds.has(u.id)).toBe(true);
            }
          }
        }
      ),
      { numRuns: 200 }
    );
  });
});
