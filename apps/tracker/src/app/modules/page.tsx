import {
  Database,
  Users,
  Bell,
  Shield,
  FileText,
  Briefcase,
  FolderOpen,
  Key,
  MessageSquare,
  File,
} from 'lucide-react';

import { getAccent } from '../../lib/module-accents';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Architecture & Modules',
  description:
    'Explore the modular architecture of Tender Track 360. Understanding our system modules and data relationships.',
};

export default function ModuleDiagram() {
  // Toggle between 'system' and 'premium' palettes here.
  // For production, you may want to wire this to an env var or user/organization setting.
  const THEME_VARIANT: 'system' | 'premium' = 'premium';

  const modules = [
    {
      name: 'Authentication & Accounts',
      icon: Key,
      accent: 'auth',
      features: ['Secure Sign-In', 'Session Lifecycles', 'OAuth Integrations', 'Email Verification'],
      description: 'Auth, sessions, OAuth',
    },
    {
      name: 'Organization & Membership',
      icon: Users,
      accent: 'organization',
      features: ['Tenant Scoping', 'Role Permissions', 'Team Invitations'],
      description: 'Teams, roles, invitations',
    },
    {
      name: 'Notifications & Preferences',
      icon: Bell,
      accent: 'notifications',
      features: ['User Alerts', 'Reminder Rules', 'Preferences Dashboard'],
      description: 'User notifications',
    },
    {
      name: 'Ownership Transfer',
      icon: Users,
      accent: 'ownership',
      features: ['Secure Delegation', 'Transfer Keys', 'Approval Logs'],
      description: 'Organization ownership',
    },
    {
      name: 'Security & Audit',
      icon: Shield,
      accent: 'security',
      features: ['Activity Monitoring', 'IP & Device Logs', 'Compliance Auditing'],
      description: 'Audit logs, tracking',
    },
    {
      name: 'Client Management',
      icon: Briefcase,
      accent: 'client',
      features: ['Client Profiles', 'Contact Details', 'Engagement Tracking'],
      description: 'Client records',
    },
    {
      name: 'Tender Management',
      icon: FileText,
      accent: 'tender',
      features: ['Bid Trackers', 'Timeline Extensions', 'Automatic Closing Date Statuses'],
      description: 'Dynamic statuses (open, closed, evaluation, awarded, lost) & auto-project creation',
    },
    {
      name: 'Project Management',
      icon: FolderOpen,
      accent: 'project',
      features: ['Auto-created Projects', 'Timeline Editors', 'Purchase Orders'],
      description: 'Auto-created projects, details editor, purchase orders',
    },
    {
      name: 'Support & Feedback',
      icon: MessageSquare,
      accent: 'support',
      features: ['Support Ticketing', 'User Feedback Channels', 'Administrative Tools'],
      description: 'User support & feedback',
    },
    {
      name: 'Document Management',
      icon: File,
      accent: 'document',
      features: ['Presigned Secure Access', 'Cloudflare R2 Isolation', 'Centralized Spec Storage'],
      description: 'Centralized file storage',
    },
  ];

  const connections = [
    { from: 0, to: 1, label: 'User → Org' },
    { from: 1, to: 2, label: 'User prefs' },
    { from: 1, to: 3, label: 'Ownership' },
    { from: 1, to: 4, label: 'Audit logs' },
    { from: 1, to: 5, label: 'Org → Client' },
    { from: 1, to: 6, label: 'Org → Tender' },
    { from: 1, to: 7, label: 'Org → Project' },
    { from: 5, to: 6, label: 'Client → Tender' },
    { from: 6, to: 7, label: 'Tender → Project' },
    { from: 7, to: 7, label: 'Project → PO' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Database className="w-10 h-10 text-muted-foreground" />
            <h1 className="text-4xl font-bold text-foreground">
              System Module Architecture
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            10 Core Modules with Business Entity Mapping
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {modules.map((module, idx) => {
            const Icon = module.icon;
            const accent = getAccent(module.accent, THEME_VARIANT);
            return (
              <div
                key={idx}
                className={`${accent.bg} rounded-lg p-6 shadow-sm hover:shadow transition-shadow duration-300 border ${accent.bg.includes('border-') ? '' : 'border-border'}`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <Icon className="w-6 h-6 shrink-0 mt-1 text-muted-foreground" />
                  <div>
                    <h3 className={`${accent.title} font-bold text-lg mb-1`}>
                      {module.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {module.description}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Core Capabilities:
                  </p>
                  {module.features.map((feature, fidx) => (
                    <div
                      key={fidx}
                      className="bg-muted/50 px-3 py-1.5 rounded text-sm font-medium text-foreground"
                    >
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-card rounded-lg shadow-sm p-8 border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
            <Database className="w-6 h-6 text-muted-foreground" />
            Module Relationships
          </h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground mb-3">
                  Core Relationships:
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <div
                      className={`w-2 h-2 ${getAccent('auth', THEME_VARIANT).dot} rounded-full`}
                    ></div>
                    <span>
                      <strong>Auth</strong> → <strong>Organization</strong>{' '}
                      (Users belong to orgs)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <div
                      className={`w-2 h-2 ${getAccent('organization', THEME_VARIANT).dot} rounded-full`}
                    ></div>
                    <span>
                      <strong>Organization</strong> →{' '}
                      <strong>All Business Modules</strong> (Org-scoped data)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <div
                      className={`w-2 h-2 ${getAccent('client', THEME_VARIANT).dot} rounded-full`}
                    ></div>
                    <span>
                      <strong>Client</strong> → <strong>Tender</strong> (Clients
                      have tenders)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <div
                      className={`w-2 h-2 ${getAccent('tender', THEME_VARIANT).dot} rounded-full`}
                    ></div>
                    <span>
                      <strong>Tender</strong> → <strong>Project</strong>{' '}
                      (Tenders become projects)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <div
                      className={`w-2 h-2 ${getAccent('project', THEME_VARIANT).dot} rounded-full`}
                    ></div>
                    <span>
                      <strong>Project</strong> →{' '}
                      <strong>Purchase Orders</strong> (Projects have POs)
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-foreground mb-3">
                  Cross-cutting Concerns:
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <div
                      className={`w-2 h-2 ${getAccent('notifications', THEME_VARIANT).dot} rounded-full`}
                    ></div>
                    <span>
                      <strong>Notifications</strong> monitors all modules
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <div
                      className={`w-2 h-2 ${getAccent('security', THEME_VARIANT).dot} rounded-full`}
                    ></div>
                    <span>
                      <strong>Security & Audit</strong> logs all actions
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <div
                      className={`w-2 h-2 ${getAccent('ownership', THEME_VARIANT).dot} rounded-full`}
                    ></div>
                    <span>
                      <strong>Ownership Transfer</strong> manages org
                      transitions
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                    <div
                      className={`w-2 h-2 ${getAccent('document', THEME_VARIANT).dot} rounded-full`}
                    ></div>
                    <span>
                      <strong>Documents</strong> linked to Tender, Project, PO,
                      & Extensions
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-slate-800 text-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Implementation Notes</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-400 font-bold">✓</span>
              <span>
                <strong>Soft Deletion:</strong> Client, Tender, Project,
                Purchase Order, Follow-up support soft deletion
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 font-bold">✓</span>
              <span>
                <strong>Multi-tenancy:</strong> All business data is
                organization-scoped
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 font-bold">✓</span>
              <span>
                <strong>Role-based Access:</strong> Owner, Admin, Manager,
                Member roles supported
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 font-bold">✓</span>
              <span>
                <strong>Audit Trail:</strong> Security audit log tracks all
                sensitive operations
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 font-bold">✓</span>
              <span>
                <strong>Session Management:</strong> Comprehensive session
                tracking with suspicious activity detection
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 font-bold">✓</span>
              <span>
                <strong>Tendering Pipeline:</strong> Automated closing-date checks, evaluation lockdowns, and instant project auto-generation upon bid award
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
