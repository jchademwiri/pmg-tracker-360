'use client';

import { Check, CreditCard, Crown, Star } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/format';

interface PricingTier {
  id: string;
  name: string;
  price: string | number;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  ctaText: string;
  href: string;
}

export function PricingSection() {
  const pricingTiers: PricingTier[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: '/month',
      description: 'Perfect for getting started',
      features: [
        '1 organization',
        'Basic tender management',
        '5 tenders per month',
        '0 Active Projects',
        '100MB storage',
        'Community support',
      ],
      ctaText: 'Get Started Free',
      href: '/dashboard',
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 249,
      period: '/month',
      description: 'For freelancers & consultants',
      features: [
        '1 organization',
        'Unlimited tenders',
        '2 Active Projects',
        '1GB storage',
        'Email support',
        'Tender Export',
      ],
      ctaText: 'Start Free Trial',
      popular: true,
      href: '/dashboard',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 499,
      period: '/month',
      description: 'For growing teams',
      features: [
        '2 organizations',
        'Unlimited tenders',
        '5 Active Projects',
        '10GB storage',
        'Priority support',
        'Advanced analytics',
      ],
      ctaText: 'Start Pro Trial',
      href: '/dashboard',
    },
  ];

  return (
    <section className="py-24 bg-linear-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-amber-100 via-orange-100 to-yellow-100 dark:from-amber-900/30 dark:via-orange-900/30 dark:to-yellow-900/30 mb-6">
            <Crown className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Choose the perfect plan for your needs. No hidden fees. Cancel
            anytime.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-2xl border-2 p-8 transition-all duration-300 hover:shadow-xl ${
                tier.popular
                  ? 'border-blue-500 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 scale-105 z-10'
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              {tier.popular && (
                <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-1 text-white border-0">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Most Popular
                </Badge>
              )}

              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {tier.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {tier.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        {typeof tier.price === 'number'
                          ? formatCurrency(tier.price)
                          : tier.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {tier.period}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  {tier.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="shrink-0 mt-1">
                        <Check className="h-4 w-4 text-green-500" />
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Button
                    asChild
                    className={`w-full h-12 text-base font-medium ${
                      tier.popular
                        ? 'bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg shadow-blue-500/20'
                        : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
                    }`}
                  >
                    <Link href={tier.href}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      {tier.ctaText}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
