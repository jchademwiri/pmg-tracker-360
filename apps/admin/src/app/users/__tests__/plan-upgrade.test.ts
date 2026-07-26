import { describe, it, expect } from 'vitest';

export interface PlanTierConfig {
  id: 'free' | 'starter' | 'pro';
  name: string;
  priceZar: number;
  maxOwnedOrgs: number;
  tendersPerMonth: number | 'unlimited';
  activeProjects: number;
  storageMb: number;
}

export const PLAN_CONFIGS: Record<'free' | 'starter' | 'pro', PlanTierConfig> = {
  free: {
    id: 'free',
    name: 'Free Tier',
    priceZar: 0,
    maxOwnedOrgs: 1,
    tendersPerMonth: 10,
    activeProjects: 0,
    storageMb: 100,
  },
  starter: {
    id: 'starter',
    name: 'Starter Tier',
    priceZar: 249,
    maxOwnedOrgs: 1,
    tendersPerMonth: 20,
    activeProjects: 2,
    storageMb: 1000,
  },
  pro: {
    id: 'pro',
    name: 'Pro Tier',
    priceZar: 499,
    maxOwnedOrgs: 2,
    tendersPerMonth: 'unlimited',
    activeProjects: 5,
    storageMb: 10000,
  },
};

export function canUserSwitchPlan(
  currentOwnedOrgs: number,
  targetPlan: 'free' | 'starter' | 'pro'
): { allowed: boolean; reason?: string } {
  const targetConfig = PLAN_CONFIGS[targetPlan];
  if (currentOwnedOrgs > targetConfig.maxOwnedOrgs) {
    return {
      allowed: false,
      reason: `Cannot switch to ${targetConfig.name}: You own ${currentOwnedOrgs} organizations, but the ${targetConfig.name} limit is ${targetConfig.maxOwnedOrgs}. Delete or archive an organization first.`,
    };
  }
  return { allowed: true };
}

describe('Subscription Upgrade & Downgrade Capacity Logic', () => {
  it('allows upgrade from Free (1 org) to Pro (capacity: 2 orgs)', () => {
    const result = canUserSwitchPlan(1, 'pro');
    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it('allows upgrade from Free (1 org) to Starter (capacity: 1 org)', () => {
    const result = canUserSwitchPlan(1, 'starter');
    expect(result.allowed).toBe(true);
  });

  it('allows downgrade from Pro (1 org owned) to Free (capacity: 1 org)', () => {
    const result = canUserSwitchPlan(1, 'free');
    expect(result.allowed).toBe(true);
  });

  it('blocks downgrade from Pro (2 orgs owned) to Free (capacity: 1 org)', () => {
    const result = canUserSwitchPlan(2, 'free');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Cannot switch to Free Tier: You own 2 organizations');
  });

  it('blocks downgrade from Pro (2 orgs owned) to Starter (capacity: 1 org)', () => {
    const result = canUserSwitchPlan(2, 'starter');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('Cannot switch to Starter Tier: You own 2 organizations');
  });

  it('correctly configures ZAR pricing across tiers', () => {
    expect(PLAN_CONFIGS.free.priceZar).toBe(0);
    expect(PLAN_CONFIGS.starter.priceZar).toBe(249);
    expect(PLAN_CONFIGS.pro.priceZar).toBe(499);
  });

  it('correctly sets tier tender limits (10 Free, 20 Starter, unlimited Pro)', () => {
    expect(PLAN_CONFIGS.free.tendersPerMonth).toBe(10);
    expect(PLAN_CONFIGS.starter.tendersPerMonth).toBe(20);
    expect(PLAN_CONFIGS.pro.tendersPerMonth).toBe('unlimited');
    expect(PLAN_CONFIGS.free.activeProjects).toBe(0);
    expect(PLAN_CONFIGS.free.storageMb).toBe(100);
  });
});
