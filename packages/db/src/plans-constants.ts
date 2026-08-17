import { type SubscriptionPlan, type NewSubscriptionPlan } from './schema';

export type { SubscriptionPlan, NewSubscriptionPlan };

export interface PlanLimits {
  maxStorageMb: number;
  maxStorageBytes: number;
  maxTendersPerMonth: number;
  maxActiveProjects: number;
  maxOwnedOrgs: number;
}

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Starter',
    description: 'Essential tender tracking & compliance checklist for solo contractors evaluating bids.',
    priceZar: 0,
    period: 'forever free',
    maxStorageMb: 100,
    maxTendersPerMonth: 10,
    maxActiveProjects: 0,
    maxOwnedOrgs: 1,
    features: [
      '1 Organization Ownership',
      'Up to 10 Tenders / Month',
      '0 Active Awarded Projects',
      '100 MB Secure Document Storage',
      'Standard Returnable Checklist',
      'Community Support',
    ],
    popular: false,
    sortOrder: 1,
    isActive: true,
    ctaText: 'Start For Free',
    badgeText: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 'starter',
    name: 'Starter Tier',
    description: 'Expanded capacity for growing teams managing multiple bids and tracking purchase orders.',
    priceZar: 199,
    period: 'per month',
    maxStorageMb: 1000,
    maxTendersPerMonth: 20,
    maxActiveProjects: 2,
    maxOwnedOrgs: 1,
    features: [
      '1 Organization Ownership',
      'Up to 20 Tenders / Month',
      '2 Active Awarded Projects',
      '1 GB Secure Storage (10x capacity)',
      'Itemized Purchase Order Ledger',
      'Automated Email Deadline Alerts',
      'Standard Email & Ticket Support',
    ],
    popular: false,
    sortOrder: 2,
    isActive: true,
    ctaText: 'Upgrade to Starter',
    badgeText: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    id: 'pro',
    name: 'Pro Professional',
    description: 'High-velocity procurement workspace for established contractors with unlimited bidding.',
    priceZar: 499,
    period: 'per month',
    maxStorageMb: 10000,
    maxTendersPerMonth: -1, // -1 represents unlimited
    maxActiveProjects: 5,
    maxOwnedOrgs: 2,
    features: [
      '2 Organization Ownerships',
      'Unlimited Tenders Tracked',
      '5 Active Awarded Projects',
      '10 GB Secure Storage (100x capacity)',
      'Automated 11:00 AM Closing Sirens',
      '30, 60 & 90-Day Cashflow Forecasting',
      'Boardroom PDF & Excel (.xlsx) Reports',
      'Multi-Tenant Roles (Admin, Manager, Member)',
      'Priority 24/7 Concierge Support',
    ],
    popular: true,
    sortOrder: 3,
    isActive: true,
    ctaText: 'Claim Pro Access',
    badgeText: 'Most Popular',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  },
];
