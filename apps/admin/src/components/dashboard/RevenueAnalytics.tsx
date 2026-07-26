'use client';

import { TrendingUp, Crown, Zap, Shield, Award } from 'lucide-react';

type Props = {
  totalUsers: number;
  proUsers: number;
  freeUsers: number;
  newUsersThisWeek: number;
};

export default function RevenueAnalytics({
  totalUsers,
  proUsers,
  freeUsers,
  newUsersThisWeek,
}: Props) {
  // Pricing in South African Rand (ZAR)
  const pricePerProZar = 499;
  const estimatedMrrZar = proUsers * pricePerProZar;
  const conversionRate = totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : '0';

  const plans = [
    {
      id: 'free',
      name: 'Free Tier',
      price: 'R0',
      period: '/month',
      color: 'border-zinc-700 bg-zinc-950/60',
      badge: 'Default',
      badgeColor: 'bg-zinc-800 text-zinc-300 border-zinc-700',
      description: 'Basic access for new users',
      features: ['1 Organization', 'Basic tender tracking', '10 tenders / month', '100MB Storage'],
      subscribers: freeUsers,
    },
    {
      id: 'starter',
      name: 'Starter Tier',
      price: 'R249',
      period: '/month',
      color: 'border-blue-900/60 bg-blue-950/20',
      badge: 'Popular',
      badgeColor: 'bg-blue-950 text-blue-300 border-blue-800',
      description: 'For consultants & small teams',
      features: ['1 Organization', '20 tenders / month', '2 Active Projects', '1GB Storage'],
      subscribers: 0,
    },
    {
      id: 'pro',
      name: 'Pro Tier',
      price: 'R499',
      period: '/month',
      color: 'border-purple-900/60 bg-purple-950/20',
      badge: 'Pro Tier',
      badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
      description: 'Full enterprise power & priority support',
      features: ['2 Organizations', 'Unlimited tenders', '5 Active Projects', '10GB Storage'],
      subscribers: proUsers,
    },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-amber-400" />
          <h2 className="text-base font-semibold text-white">Subscription Plans & ZAR Revenue Analytics</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg bg-emerald-950/90 border border-emerald-800 text-emerald-300">
          <TrendingUp className="h-3.5 w-3.5" />
          Est. MRR: R {estimatedMrrZar.toLocaleString('en-ZA')} / mo
        </span>
      </div>

      {/* KPI Cards in ZAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Estimated Monthly Revenue (ZAR)</div>
          <div className="text-2xl font-extrabold text-emerald-400">
            R {estimatedMrrZar.toLocaleString('en-ZA')}
          </div>
          <div className="text-[11px] text-zinc-500">Calculated at R {pricePerProZar}/mo per Pro subscriber</div>
        </div>

        <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Paid Conversion Rate</div>
          <div className="text-2xl font-extrabold text-purple-400">
            {conversionRate}%
          </div>
          <div className="text-[11px] text-zinc-500">{proUsers} of {totalUsers} users on Pro plan</div>
        </div>

        <div className="p-4 bg-zinc-950/60 border border-zinc-800/80 rounded-xl space-y-1">
          <div className="text-xs text-zinc-400 font-medium">Weekly Acquisition</div>
          <div className="text-2xl font-extrabold text-indigo-400">
            +{newUsersThisWeek}
          </div>
          <div className="text-[11px] text-zinc-500">New signups in the last 7 days</div>
        </div>
      </div>

      {/* Plan Distribution Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-zinc-400 font-medium">
          <span>Subscription Tier Distribution</span>
          <span>
            {freeUsers} Free ({((freeUsers / Math.max(totalUsers, 1)) * 100).toFixed(0)}%) • {proUsers} Pro ({conversionRate}%)
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-zinc-800 overflow-hidden flex">
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${((freeUsers / Math.max(totalUsers, 1)) * 100)}%` }}
            title={`Free: ${freeUsers}`}
          />
          <div
            className="h-full bg-purple-500 transition-all duration-500"
            style={{ width: `${((proUsers / Math.max(totalUsers, 1)) * 100)}%` }}
            title={`Pro: ${proUsers}`}
          />
        </div>
        <div className="flex items-center gap-4 text-[11px] text-zinc-400 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Free Plan ({freeUsers})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            Pro Plan ({proUsers})
          </span>
        </div>
      </div>

      {/* Platform Subscription Plans Matrix (ZAR) */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Platform Subscription Pricing Matrix (ZAR)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`p-4 rounded-xl border ${p.color} flex flex-col justify-between space-y-3`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{p.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-white">{p.price}</span>
                  <span className="text-xs text-zinc-400">{p.period}</span>
                </div>
                <p className="text-xs text-zinc-400">{p.description}</p>
                <ul className="space-y-1 pt-1 text-xs text-zinc-300">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-emerald-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-medium">Active Accounts:</span>
                <span className="font-bold text-white">{p.subscribers} user(s)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
