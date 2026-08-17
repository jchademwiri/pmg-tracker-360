'use client';

import { useState, useTransition } from 'react';
import {
  CreditCard,
  Crown,
  Sparkles,
  Sliders,
  Check,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  Eye,
  EyeOff,
  Layers,
  HardDrive,
  FileText,
  Building2,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  X,
  Loader2,
} from 'lucide-react';
import { type SubscriptionPlan } from '@pmg/db/schema';
import { updateSubscriptionPlanAction, resetSubscriptionPlansAction, type PlanUpdatePayload } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PricingManagementClientProps {
  initialPlans: SubscriptionPlan[];
}

function formatStorage(mb: number) {
  if (mb >= 1000) {
    const gb = mb / 1000;
    return `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
  }
  return `${mb} MB`;
}

export function PricingManagementClient({ initialPlans }: PricingManagementClientProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(initialPlans);
  const [activeTab, setActiveTab] = useState<'matrix' | 'preview'>('matrix');
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form State for Editing Modal
  const [formData, setFormData] = useState<PlanUpdatePayload>({
    name: '',
    description: '',
    priceZar: 0,
    period: 'per month',
    maxStorageMb: 100,
    maxTendersPerMonth: 10,
    maxActiveProjects: 0,
    maxOwnedOrgs: 1,
    features: [],
    popular: false,
    sortOrder: 1,
    isActive: true,
    ctaText: 'Select Plan',
    badgeText: null,
  });

  const [newFeatureText, setNewFeatureText] = useState('');
  const [isUnlimitedTenders, setIsUnlimitedTenders] = useState(false);

  function openEditModal(plan: SubscriptionPlan) {
    setEditingPlan(plan);
    setIsUnlimitedTenders(plan.maxTendersPerMonth === -1);
    setFormData({
      name: plan.name,
      description: plan.description,
      priceZar: plan.priceZar,
      period: plan.period,
      maxStorageMb: plan.maxStorageMb,
      maxTendersPerMonth: plan.maxTendersPerMonth,
      maxActiveProjects: plan.maxActiveProjects,
      maxOwnedOrgs: plan.maxOwnedOrgs,
      features: Array.isArray(plan.features) ? [...plan.features] : [],
      popular: plan.popular,
      sortOrder: plan.sortOrder,
      isActive: plan.isActive,
      ctaText: plan.ctaText,
      badgeText: plan.badgeText,
    });
    setNewFeatureText('');
    setStatusMessage(null);
  }

  function handleAddFeature() {
    if (!newFeatureText.trim()) return;
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, newFeatureText.trim()],
    }));
    setNewFeatureText('');
  }

  function handleRemoveFeature(index: number) {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  }

  function handleSavePlan() {
    if (!editingPlan) return;

    const payload: PlanUpdatePayload = {
      ...formData,
      maxTendersPerMonth: isUnlimitedTenders ? -1 : Math.max(1, formData.maxTendersPerMonth),
    };

    startTransition(async () => {
      const res = await updateSubscriptionPlanAction(editingPlan.id, payload);
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message || 'Plan updated successfully' });
        setPlans((prev) =>
          prev.map((p) =>
            p.id === editingPlan.id
              ? {
                  ...p,
                  ...payload,
                  updatedAt: new Date(),
                }
              : p
          )
        );
        setTimeout(() => {
          setEditingPlan(null);
        }, 1200);
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to update plan' });
      }
    });
  }

  function handleResetDefaults() {
    if (!confirm('Are you sure you want to restore all tier pricing and quotas to factory defaults?')) {
      return;
    }

    startTransition(async () => {
      const res = await resetSubscriptionPlansAction();
      if (res.success) {
        setStatusMessage({ type: 'success', text: res.message || 'Default plans restored' });
        window.location.reload();
      } else {
        setStatusMessage({ type: 'error', text: res.error || 'Failed to reset plans' });
      }
    });
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* ── Page Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Subscription & Dynamic Tier Configuration
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Centralized database control for pricing, storage limits, monthly tender quotas, and storefront features.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex rounded-lg bg-zinc-900 border border-zinc-800 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Config Matrix</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Storefront Preview</span>
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            disabled={isPending}
            className="text-xs border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset Factory Defaults
          </Button>
        </div>
      </div>

      {/* ── Status Banner ───────────────────────────────────────── */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
              : 'bg-rose-950/70 border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Key Metrics Overview ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-sm backdrop-blur">
          <div className="text-xs text-zinc-400 font-medium flex items-center justify-between">
            <span>Configured Tiers</span>
            <Layers className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">
            {plans.filter((p) => p.isActive).length} <span className="text-xs text-zinc-500 font-normal">Active / {plans.length} total</span>
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Live in client database</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-sm backdrop-blur">
          <div className="text-xs text-zinc-400 font-medium flex items-center justify-between">
            <span>Storage Allocation</span>
            <HardDrive className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-1.5">
            100 MB – 10 GB
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Free to Pro capacity scale</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-sm backdrop-blur">
          <div className="text-xs text-zinc-400 font-medium flex items-center justify-between">
            <span>Bidding Velocity</span>
            <FileText className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1.5">
            10 / mo – Unlimited
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Quota gates automatically enforce</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 shadow-sm backdrop-blur">
          <div className="text-xs text-zinc-400 font-medium flex items-center justify-between">
            <span>Revenue Range</span>
            <TrendingUp className="h-4 w-4 text-[#d4af37]" />
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">
            R 0 – R 499 <span className="text-xs text-zinc-500 font-normal">/ mo</span>
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">ZAR monthly subscription price</p>
        </div>
      </div>

      {/* ── Mode 1: Config Matrix Mode ──────────────────────────── */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col justify-between rounded-xl border p-6 transition-all duration-200 ${
                plan.popular
                  ? 'border-amber-500/50 bg-amber-500/5 shadow-md shadow-amber-500/5 relative'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                      ID: {plan.id}
                    </span>
                    {plan.popular && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-black">
                        <Crown className="h-3 w-3" />
                        {plan.badgeText || 'Popular'}
                      </span>
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      plan.isActive
                        ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                        : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                    }`}
                  >
                    {plan.isActive ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <EyeOff className="h-3 w-3" />}
                    {plan.isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight">{plan.name}</h3>
                <p className="text-xs text-zinc-400 mt-1 min-h-[32px]">{plan.description}</p>

                {/* Price Display */}
                <div className="my-5 p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-extrabold text-white">R {plan.priceZar}</span>
                    <span className="text-xs text-zinc-400 ml-1.5">{plan.period}</span>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">Button: "{plan.ctaText}"</span>
                </div>

                {/* Quota Highlights */}
                <div className="space-y-2.5 py-2 border-y border-zinc-800/80 my-4 text-xs">
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <HardDrive className="h-3.5 w-3.5 text-amber-400" />
                      Storage Quota
                    </span>
                    <span className="font-semibold text-white">{formatStorage(plan.maxStorageMb)}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <FileText className="h-3.5 w-3.5 text-emerald-400" />
                      Monthly Tenders
                    </span>
                    <span className="font-semibold text-white">
                      {plan.maxTendersPerMonth === -1 ? 'Unlimited' : `${plan.maxTendersPerMonth} / month`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <FolderKanban className="h-3.5 w-3.5 text-blue-400" />
                      Active Projects
                    </span>
                    <span className="font-semibold text-white">{plan.maxActiveProjects} projects</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                      Workspaces Owned
                    </span>
                    <span className="font-semibold text-white">{plan.maxOwnedOrgs} org(s)</span>
                  </div>
                </div>

                {/* Feature Checklist */}
                <div className="space-y-1.5 mb-6">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Feature Bullets ({Array.isArray(plan.features) ? plan.features.length : 0})
                  </span>
                  <ul className="space-y-1">
                    {Array.isArray(plan.features) &&
                      plan.features.slice(0, 4).map((feat, idx) => (
                        <li key={idx} className="text-xs text-zinc-300 flex items-start gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    {Array.isArray(plan.features) && plan.features.length > 4 && (
                      <li className="text-[11px] text-zinc-500 pl-5">
                        +{plan.features.length - 4} more features configured...
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <Button
                type="button"
                onClick={() => openEditModal(plan)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-medium border border-zinc-700 shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Edit3 className="h-4 w-4 text-amber-400" />
                <span>Configure Tier Quotas & Pricing</span>
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* ── Mode 2: Live Storefront Preview Mode ─────────────────── */}
      {activeTab === 'preview' && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 md:p-8 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Customer Storefront Preview</span>
            </span>
            <h2 className="text-2xl font-extrabold text-white">Transparent, Contractor-First Pricing</h2>
            <p className="text-xs text-zinc-400">
              This preview accurately reflects how plans and quotas render to users on the home landing page and inside the billing dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans
              .filter((p) => p.isActive)
              .map((plan) => (
                <div
                  key={plan.id}
                  className={`flex flex-col justify-between rounded-xl p-6 border transition-all ${
                    plan.popular
                      ? 'border-amber-500/60 bg-amber-500/5 shadow-lg shadow-amber-500/10 relative'
                      : 'border-zinc-800 bg-zinc-900/60'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 right-6 px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500 text-black shadow-xs">
                      {plan.badgeText || 'Most Popular'}
                    </span>
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                    <p className="text-xs text-zinc-400 mt-1 min-h-[36px]">{plan.description}</p>

                    <div className="my-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-white">R {plan.priceZar}</span>
                        <span className="text-xs text-zinc-400">/ {plan.period}</span>
                      </div>
                    </div>

                    <ul className="space-y-2.5 mb-8">
                      {Array.isArray(plan.features) &&
                        plan.features.map((feat, idx) => (
                          <li key={idx} className="text-xs text-zinc-300 flex items-start gap-2">
                            <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <Button
                    type="button"
                    className={`w-full font-bold h-10 ${
                      plan.popular
                        ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                    }`}
                  >
                    {plan.ctaText}
                  </Button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Edit Tier Modal Dialog ──────────────────────────────── */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full text-white p-6 max-h-[90vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-amber-400" />
                  Configure Tier: {editingPlan.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Adjusting these limits updates live database pricing and backend quota gates.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* General Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Tier Display Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Starter Tier"
                    className="bg-zinc-950 border-zinc-800 text-white text-xs h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Monthly Price (ZAR)</label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.priceZar}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, priceZar: Number(e.target.value) })
                    }
                    className="bg-zinc-950 border-zinc-800 text-white text-xs h-9 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">Plan Description / Tagline</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-2 text-white text-xs resize-none focus:outline-none focus:border-zinc-700"
                />
              </div>

              {/* Quota & Capacity Constraints */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-4">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HardDrive className="h-4 w-4" />
                  Storage & Volume Gate Quotas
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-300">
                      Storage Allocation (MB) –{' '}
                      <strong className="text-emerald-400">{formatStorage(formData.maxStorageMb)}</strong>
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.maxStorageMb}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, maxStorageMb: Number(e.target.value) })
                      }
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9 font-mono"
                    />
                    <p className="text-[10px] text-zinc-500">100 MB = Free, 1000 MB = 1GB, 10000 MB = 10GB</p>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-zinc-300">Monthly Tenders Limit</label>
                      <label className="flex items-center gap-1.5 text-[11px] text-amber-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isUnlimitedTenders}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setIsUnlimitedTenders(e.target.checked)
                          }
                          className="rounded border-zinc-700"
                        />
                        <span>Unlimited</span>
                      </label>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      disabled={isUnlimitedTenders}
                      value={isUnlimitedTenders ? '' : formData.maxTendersPerMonth}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, maxTendersPerMonth: Number(e.target.value) })
                      }
                      placeholder={isUnlimitedTenders ? 'Unlimited Bidding (-1)' : 'e.g. 20'}
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9 font-mono disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-300">Max Active Awarded Projects</label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.maxActiveProjects}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, maxActiveProjects: Number(e.target.value) })
                      }
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-300">Max Organization Ownerships</label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.maxOwnedOrgs}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({ ...formData, maxOwnedOrgs: Number(e.target.value) })
                      }
                      className="bg-zinc-900 border-zinc-700 text-white text-xs h-9 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Checklist Manager */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-300">Feature Bullet Points</label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {formData.features.map((feat, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={feat}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const updated = [...formData.features];
                          updated[index] = e.target.value;
                          setFormData({ ...formData, features: updated });
                        }}
                        className="bg-zinc-950 border-zinc-800 text-white text-xs h-8"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(index)}
                        className="h-8 w-8 flex items-center justify-center text-zinc-500 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <Input
                    value={newFeatureText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                      e.key === 'Enter' && (e.preventDefault(), handleAddFeature())
                    }
                    placeholder="Type new feature bullet point..."
                    className="bg-zinc-950 border-zinc-800 text-white text-xs h-8"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddFeature}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs h-8 shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Visual Flags & CTA text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Button CTA Text</label>
                  <Input
                    value={formData.ctaText}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, ctaText: e.target.value })
                    }
                    placeholder="e.g. Claim Pro Access"
                    className="bg-zinc-950 border-zinc-800 text-white text-xs h-8"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Badge Label (optional)</label>
                  <Input
                    value={formData.badgeText || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, badgeText: e.target.value || null })
                    }
                    placeholder="e.g. Popular or Best Value"
                    className="bg-zinc-950 border-zinc-800 text-white text-xs h-8"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="text-xs font-medium text-zinc-300">Highlight as "Popular"</span>
                  <input
                    type="checkbox"
                    checked={formData.popular}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, popular: e.target.checked })
                    }
                    className="rounded border-zinc-700 h-4 w-4 text-amber-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <span className="text-xs font-medium text-zinc-300">Active / Visible</span>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="rounded border-zinc-700 h-4 w-4 text-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-800 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingPlan(null)}
                className="border-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={handleSavePlan}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Tier Adjustments'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
