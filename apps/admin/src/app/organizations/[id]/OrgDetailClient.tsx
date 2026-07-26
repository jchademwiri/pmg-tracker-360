'use client';

import { useState } from 'react';
import type { OrgDetail } from '../actions';
import StatusBadge from '@/components/StatusBadge';
import ConfirmDialog from '@/components/ConfirmDialog';
import MonthlyAccordionGroup from '@/components/MonthlyAccordionGroup';
import {
  updateOrgDetails,
  suspendOrg,
  restoreOrg,
  purgeOrg,
  cancelPendingDeletion,
  removeOrgMember,
} from '../actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SetBreadcrumbLabel } from '@/lib/breadcrumb-context';
import {
  ArrowLeft,
  Building2,
  Users,
  ClipboardList,
  Rocket,
  Receipt,
  Crown,
  ShieldAlert,
  RotateCcw,
  Trash2,
  Edit2,
  UserMinus,
  Check,
  Calendar,
  AlertTriangle,
  ChevronDown,
  FileText,
} from 'lucide-react';

type Props = {
  data: OrgDetail;
};

export default function OrgDetailClient({ data }: Props) {
  const { org, owner, members, invitations, tenders, projects, poTotalZar } = data;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'members' | 'tenders_projects' | 'audit' | 'danger'
  >('overview');

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(org.name);
  const [slugInput, setSlugInput] = useState(org.slug ?? '');
  const [editLoading, setEditLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Metadata Collapsible
  const [showMetadata, setShowMetadata] = useState(false);

  // Dialog State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'info';
    requireValue?: string;
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    variant: 'danger',
    action: async () => {},
  });

  const isSuspended = Boolean(org.deletedAt);
  const isPurgeScheduled = Boolean(org.permanentDeletionScheduledAt);

  // Metadata JSON formatting
  let metadataDisplay = '';
  if (org.metadata) {
    try {
      metadataDisplay = typeof org.metadata === 'string'
        ? JSON.stringify(JSON.parse(org.metadata), null, 2)
        : JSON.stringify(org.metadata, null, 2);
    } catch {
      metadataDisplay = String(org.metadata);
    }
  }

  async function handleSaveEdit() {
    setEditLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    const res = await updateOrgDetails(org.id, nameInput, slugInput);
    setEditLoading(false);
    if (res.success) {
      setSuccessMsg('Organization details updated.');
      setIsEditing(false);
      router.refresh();
    } else {
      setErrorMsg(res.error ?? 'Failed to update organization.');
    }
  }

  async function handleSuspend() {
    const res = await suspendOrg(org.id);
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    if (res.success) router.refresh();
  }

  async function handleRestore() {
    const res = await restoreOrg(org.id);
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    if (res.success) router.refresh();
  }

  async function handlePurgeSchedule() {
    const res = await purgeOrg(org.id);
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    if (res.success) router.refresh();
  }

  async function handleCancelDeletion() {
    const res = await cancelPendingDeletion(org.id);
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    if (res.success) router.refresh();
  }

  async function handleRemoveMember(userId: string, userName: string) {
    const res = await removeOrgMember(org.id, userId);
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    if (res.success) router.refresh();
  }

  return (
    <div className="space-y-6">
      <SetBreadcrumbLabel segment={org.id} label={org.name} />
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/organizations"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Organizations
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge status={isPurgeScheduled ? 'deleted' : isSuspended ? 'suspicious' : 'active'} />
          {owner && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-purple-950/80 border border-purple-800 text-purple-300">
              <Crown className="h-3.5 w-3.5 text-amber-400" />
              Owner: {owner.plan.toUpperCase()} Tier
            </span>
          )}
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
              {org.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 px-3 py-1 text-sm font-bold text-white rounded-lg"
                  />
                  <input
                    type="text"
                    value={slugInput}
                    onChange={(e) => setSlugInput(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 px-3 py-1 text-xs font-mono text-zinc-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={editLoading}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">{org.name}</h1>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Edit Name & Slug"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="font-mono bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                      /orgs/{org.slug || org.id}
                    </span>
                    <span>Created {new Date(org.createdAt).toLocaleDateString('en-GB')}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isSuspended ? (
              <button
                type="button"
                onClick={() =>
                  setConfirmState({
                    isOpen: true,
                    title: 'Restore Organization',
                    description: `Reactivate workspace for ${org.name}? Members will regain access immediately.`,
                    confirmText: 'Restore Access',
                    variant: 'info',
                    action: handleRestore,
                  })
                }
                className="px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 inline mr-1" /> Restore Org
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setConfirmState({
                    isOpen: true,
                    title: 'Suspend Organization',
                    description: `Revoke member access for ${org.name}? The account will remain suspended without an automated deletion date.`,
                    confirmText: 'Suspend Org',
                    variant: 'warning',
                    action: handleSuspend,
                  })
                }
                className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <ShieldAlert className="h-3.5 w-3.5 inline mr-1" /> Suspend Org
              </button>
            )}

            {!isPurgeScheduled ? (
              <button
                type="button"
                onClick={() =>
                  setConfirmState({
                    isOpen: true,
                    title: 'Schedule 30-Day Permanent Deletion',
                    description: `Initiate a 30-day countdown to permanently delete ${org.name}? Warning email will be sent to the owner.`,
                    confirmText: 'Start 30-Day Purge Timer',
                    variant: 'danger',
                    action: handlePurgeSchedule,
                  })
                }
                className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 inline mr-1" /> Schedule 30-Day Purge
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setConfirmState({
                    isOpen: true,
                    title: 'Cancel Pending 30-Day Deletion',
                    description: `Cancel the pending permanent deletion countdown for ${org.name}? Note: The organization will remain in a suspended state.`,
                    confirmText: 'Cancel Deletion',
                    variant: 'info',
                    action: handleCancelDeletion,
                  })
                }
                className="px-3 py-1.5 bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Check className="h-3.5 w-3.5 inline mr-1" /> Cancel Pending Purge
              </button>
            )}
          </div>
        </div>

        {/* 30-Day Purge & Appeal Banners */}
        {isPurgeScheduled && (
          <div className="p-3 bg-red-950/60 border border-red-800 rounded-lg flex items-center justify-between text-xs text-red-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <span>
                <strong>30-Day Purge Scheduled:</strong> Permanent deletion scheduled for{' '}
                {new Date(org.permanentDeletionScheduledAt!).toLocaleDateString('en-GB')}.
              </span>
            </div>
            {org.appealStatus === 'pending' && (
              <span className="px-2 py-0.5 bg-amber-900 border border-amber-700 text-amber-200 font-bold rounded">
                Appeal Pending Admin Review
              </span>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Total Members</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{members.length}</div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Tracked Tenders</span>
            <ClipboardList className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{tenders.length}</div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Active Projects</span>
            <Rocket className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{projects.length}</div>
        </div>

        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Purchase Orders (ZAR)</span>
            <Receipt className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">
            R {poTotalZar.toLocaleString('en-ZA')}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-zinc-800 flex gap-4 text-sm font-semibold">
        {[
          { id: 'overview', label: 'Overview & Quotas' },
          { id: 'members', label: `Members (${members.length})` },
          { id: 'tenders_projects', label: 'Tenders & Projects (Monthly)' },
          { id: 'audit', label: 'Security & Audit Logs' },
          { id: 'danger', label: 'Danger Zone' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === t.id
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Organization Profile & Owner
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Organization Name</span>
                  <span className="text-white font-medium">{org.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Workspace Slug</span>
                  <span className="text-zinc-300 font-mono">/orgs/{org.slug}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Owner Name</span>
                  <span className="text-white font-medium">{owner?.name || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-zinc-800/60">
                  <span className="text-zinc-400">Owner Email</span>
                  <span className="text-zinc-300">{owner?.email || '—'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-zinc-400">Owner Subscription Tier</span>
                  <StatusBadge status={owner?.plan || 'free'} />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Plan Limits & Capacity
              </h3>
              {(() => {
                const now = new Date();
                const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const tendersThisMonth = tenders.filter(
                  (t) => new Date(t.createdAt) >= currentMonthStart
                ).length;

                const ownerPlan = (owner?.plan || 'free').toLowerCase();
                const maxTendersQuota = ownerPlan === 'pro' ? Infinity : ownerPlan === 'starter' ? 20 : 10;
                const isOverQuota = maxTendersQuota !== Infinity && tendersThisMonth >= maxTendersQuota;
                const quotaPercent = maxTendersQuota !== Infinity ? Math.min(100, Math.round((tendersThisMonth / maxTendersQuota) * 100)) : 100;

                return (
                  <div className="space-y-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>Monthly Tender Quota</span>
                        <span className="font-semibold text-white">
                          {tendersThisMonth} / {maxTendersQuota === Infinity ? 'Unlimited' : `${maxTendersQuota} tenders / month`}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isOverQuota ? 'bg-red-500' : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${quotaPercent}%`,
                          }}
                        />
                      </div>
                      <div className="text-[11px] text-zinc-500 flex justify-between pt-0.5">
                        <span>Resets 1st of every month</span>
                        <span>{tenders.length} total lifetime tenders</span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>Active Projects Capacity</span>
                        <span className="font-semibold text-white">
                          {projects.length} / {owner?.plan === 'pro' ? '5 active' : owner?.plan === 'starter' ? '2 active' : '0 (Free Tier)'}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all"
                          style={{
                            width: `${
                              owner?.plan === 'pro'
                                ? Math.min(100, Math.round((projects.length / 5) * 100))
                                : owner?.plan === 'starter'
                                ? Math.min(100, Math.round((projects.length / 2) * 100))
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Metadata Collapsible */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowMetadata(!showMetadata)}
              className="w-full p-4 flex items-center justify-between text-left font-semibold text-sm text-zinc-300 hover:bg-zinc-800/60 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                <span>Organization Metadata (JSON)</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${showMetadata ? 'rotate-180' : ''}`} />
            </button>
            {showMetadata && (
              <div className="p-4 border-t border-zinc-800 bg-zinc-950">
                {metadataDisplay ? (
                  <pre className="text-xs text-emerald-400 font-mono overflow-x-auto p-3 bg-zinc-900 rounded-lg">
                    {metadataDisplay}
                  </pre>
                ) : (
                  <div className="text-xs text-zinc-500 italic">No additional metadata recorded.</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Members & Invites */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 font-semibold text-sm text-white">
              Team Member Roster ({members.length})
            </div>
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-950 text-zinc-400 uppercase font-bold border-b border-zinc-800">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {members.map((m) => (
                  <tr key={m.userId} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="p-3 font-medium text-white">{m.userName}</td>
                    <td className="p-3 text-zinc-300">{m.userEmail}</td>
                    <td className="p-3">
                      <StatusBadge status={m.role} />
                    </td>
                    <td className="p-3 text-right">
                      {m.role !== 'owner' && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmState({
                              isOpen: true,
                              title: 'Remove Member',
                              description: `Remove ${m.userName} from ${org.name}?`,
                              confirmText: 'Remove Member',
                              variant: 'danger',
                              action: () => handleRemoveMember(m.userId, m.userName),
                            })
                          }
                          className="text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase">
                Pending Invitations ({invitations.length})
              </h3>
              <div className="divide-y divide-zinc-800/60 text-xs">
                {invitations.map((inv) => (
                  <div key={inv.id} className="py-2 flex justify-between items-center">
                    <span className="text-zinc-300">{inv.email}</span>
                    <span className="text-zinc-500">
                      Expires {new Date(inv.expiresAt).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Monthly Accordions */}
      {activeTab === 'tenders_projects' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Tracked Tenders (Grouped by Closing Month)
            </h3>
            <MonthlyAccordionGroup
              items={tenders.map((t) => ({
                id: t.id,
                title: t.title,
                status: t.status,
                valueZar: t.valueZar,
                date: t.closingDate || t.createdAt,
              }))}
              emptyMessage="No tenders tracked for this organization."
              itemTypeLabel="Tender"
            />
          </div>

          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Active Projects (Grouped by Created Month)
            </h3>
            <MonthlyAccordionGroup
              items={projects.map((p) => ({
                id: p.id,
                title: p.name,
                status: p.status,
                valueZar: p.budgetZar,
                date: p.createdAt,
              }))}
              emptyMessage="No active projects for this organization."
              itemTypeLabel="Project"
            />
          </div>
        </div>
      )}

      {/* Tab 4: Audit */}
      {activeTab === 'audit' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-xs text-zinc-400 space-y-3">
          <h3 className="font-semibold text-white uppercase text-xs">Security & Audit History</h3>
          <div className="p-4 bg-zinc-950 rounded-lg border border-zinc-800 font-mono text-[11px] text-zinc-300">
            <div>[INFO] Organization created on {new Date(org.createdAt).toLocaleString('en-ZA')}</div>
            {org.deletedAt && (
              <div className="text-amber-400 pt-1">
                [WARN] Suspended on {new Date(org.deletedAt).toLocaleString('en-ZA')} — Reason: {org.deletionReason || 'N/A'}
              </div>
            )}
            {org.permanentDeletionScheduledAt && (
              <div className="text-red-400 pt-1">
                [CRITICAL] 30-Day Purge Scheduled for {new Date(org.permanentDeletionScheduledAt).toLocaleString('en-ZA')}
              </div>
            )}
            {org.appealStatus && (
              <div className="text-indigo-400 pt-1">
                [APPEAL] Appeal Status: {org.appealStatus.toUpperCase()} — {org.appealReason || 'No details'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Danger Zone */}
      {activeTab === 'danger' && (
        <div className="bg-red-950/20 border border-red-900/60 rounded-xl p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-red-400">Administrative Danger Zone</h3>
            <p className="text-xs text-zinc-400">
              Manage organization suspension, 30-day purge schedules, and appeals.
            </p>
          </div>

          <div className="space-y-4">
            {org.appealStatus === 'pending' && (
              <div className="p-4 bg-amber-950/80 border border-amber-800 rounded-xl space-y-3">
                <div className="font-bold text-sm text-amber-200">
                  User Appeal Submitted: Pending Review
                </div>
                <p className="text-xs text-zinc-300">{org.appealReason}</p>
                <button
                  type="button"
                  onClick={() =>
                    setConfirmState({
                      isOpen: true,
                      title: 'Approve Appeal & Cancel Deletion',
                      description: 'Approve appeal and cancel the 30-day permanent deletion timer? Organization will remain suspended.',
                      confirmText: 'Approve Appeal & Cancel Deletion',
                      variant: 'info',
                      action: handleCancelDeletion,
                    })
                  }
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Approve Appeal & Cancel Deletion (Keep Suspended)
                </button>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <div>
                <div className="text-sm font-semibold text-white">Suspend Organization Access</div>
                <p className="text-xs text-zinc-500">Revokes member access without scheduling deletion.</p>
              </div>
              <button
                type="button"
                onClick={handleSuspend}
                className="px-3 py-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-800 text-amber-300 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Suspend
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
              <div>
                <div className="text-sm font-semibold text-white">Initiate 30-Day Purge Schedule</div>
                <p className="text-xs text-zinc-500">Starts a 30-day countdown to permanent database deletion.</p>
              </div>
              <button
                type="button"
                onClick={handlePurgeSchedule}
                className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Schedule 30-Day Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        description={confirmState.description}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
        requireConfirmationValue={confirmState.requireValue}
        onConfirm={confirmState.action}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
