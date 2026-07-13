'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  runBackupAction,
  listBackupsAction,
  restoreFullAction,
  restoreOrgAction,
  getOrganizationsAction,
} from './actions';
import {
  Database,
  HardDriveUpload,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Building2,
  Construction,
  FileArchive,
} from 'lucide-react';
import type { BackupMeta } from '@/lib/backup';

type OrgOption = {
  id: string;
  name: string;
  slug: string | null;
};

export default function BackupsClient() {
  const [backups, setBackups] = useState<BackupMeta[]>([]);
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [restoreOrg, setRestoreOrg] = useState<{ key: string; orgId: string } | null>(null);
  const [restoring, setRestoring] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [backupList, orgList] = await Promise.all([
        listBackupsAction(),
        getOrganizationsAction(),
      ]);
      setBackups(backupList);
      setOrgs(orgList as OrgOption[]);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load backups.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunBackup = async () => {
    setRunning(true);
    setMessage(null);
    try {
      const result = await runBackupAction();
      setMessage({ type: result.success ? 'success' : 'error', text: result.message });
      if (result.success) {
        await loadData();
      }
    } catch {
      setMessage({ type: 'error', text: 'Backup failed unexpectedly.' });
    } finally {
      setRunning(false);
    }
  };

  const handleFullRestore = async (key: string) => {
    setRestoring(true);
    setMessage(null);
    try {
      const result = await restoreFullAction(key);
      setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    } catch {
      setMessage({ type: 'error', text: 'Restore failed unexpectedly.' });
    } finally {
      setRestoring(false);
      setConfirmRestore(null);
    }
  };

  const handleOrgRestore = async () => {
    if (!restoreOrg) return;
    setRestoring(true);
    setMessage(null);
    try {
      const result = await restoreOrgAction(restoreOrg.key, restoreOrg.orgId);
      setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    } catch {
      setMessage({ type: 'error', text: 'Org restore failed unexpectedly.' });
    } finally {
      setRestoring(false);
      setRestoreOrg(null);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-ZA', {
        timeZone: 'Africa/Johannesburg',
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Database className="h-8 w-8 text-amber-400" />
            Database Backups
          </h1>
          <p className="text-sm text-zinc-400">
            Create, manage, and restore database backups. Backups are stored in Cloudflare R2 with 30-day retention.
          </p>
        </div>
        <button
          onClick={handleRunBackup}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-600/20"
        >
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <HardDriveUpload className="h-4 w-4" />
          )}
          {running ? 'Creating Backup...' : 'Run Backup Now'}
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-xl flex gap-3 text-sm items-start ${
          message.type === 'success'
            ? 'bg-emerald-950/30 border border-emerald-900/50 text-emerald-200'
            : message.type === 'error'
            ? 'bg-red-950/40 border border-red-900/60 text-red-200'
            : 'bg-blue-950/30 border border-blue-900/50 text-blue-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : message.type === 'error' ? (
            <XCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Confirm Full Restore Modal */}
      {confirmRestore && (
        <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-red-300">Danger: Full Restore</h3>
              <p className="text-xs text-red-200/70 mt-1">
                This will overwrite ALL existing data in the database with the data from the selected backup.
                This action cannot be undone. Are you sure?
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setConfirmRestore(null)}
              disabled={restoring}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleFullRestore(confirmRestore)}
              disabled={restoring}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {restoring ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              {restoring ? 'Restoring...' : 'Confirm Full Restore'}
            </button>
          </div>
        </div>
      )}

      {/* Org Restore Dialog */}
      {restoreOrg && (
        <div className="p-4 bg-amber-950/40 border border-amber-900/60 rounded-xl space-y-3">
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-300">Restore Organization Data</h3>
              <p className="text-xs text-amber-200/70 mt-1">
                Select an organization to restore its data from the backup. Only data belonging to the selected
                organization will be restored. Existing data will be updated.
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest block mb-2">
                Select Organization
              </label>
              <select
                value={restoreOrg.orgId}
                onChange={(e) => setRestoreOrg({ ...restoreOrg, orgId: e.target.value })}
                className="w-full px-3 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="">-- Choose an organization --</option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.slug || 'no slug'})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setRestoreOrg(null)}
              disabled={restoring}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleOrgRestore}
              disabled={restoring || !restoreOrg.orgId}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {restoring ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Upload className="h-3 w-3" />
              )}
              {restoring ? 'Restoring...' : 'Restore Org'}
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      )}

      {/* Backup List */}
      {!loading && (
        <div className="space-y-4">
          {backups.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
              <FileArchive className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-zinc-400">No backups yet</h3>
              <p className="text-sm text-zinc-600 mt-1">
                Click "Run Backup Now" to create your first database backup.
              </p>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-zinc-400 uppercase tracking-widest">Backup</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-zinc-400 uppercase tracking-widest">Created (SAST)</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-zinc-400 uppercase tracking-widest">Size</th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-zinc-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((backup, idx) => (
                      <tr
                        key={backup.key}
                        className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${
                          idx === 0 ? 'bg-amber-950/10' : ''
                        }`}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                              <FileArchive className={`h-4 w-4 ${idx === 0 ? 'text-amber-400' : 'text-zinc-500'}`} />
                            </div>
                            <div>
                              <span className="text-white font-medium text-xs font-mono">
                                {backup.filename}
                              </span>
                              {idx === 0 && (
                                <span className="ml-2 px-1.5 py-0.5 bg-amber-600/20 text-amber-400 rounded text-[10px] font-bold uppercase tracking-wider">
                                  Latest
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-zinc-400 text-xs">
                          {formatDate(backup.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-right text-zinc-400 text-xs font-mono">
                          {formatBytes(backup.sizeBytes)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setConfirmRestore(backup.key)}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[11px] font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                              title="Full restore"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Full Restore
                            </button>
                            <button
                              onClick={() => setRestoreOrg({ key: backup.key, orgId: '' })}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[11px] font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                              title="Restore specific organization"
                            >
                              <Building2 className="h-3 w-3" />
                              Org Restore
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
          <HardDriveUpload className="h-5 w-5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Automatic Backups</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Backups run automatically via cron job. Each backup is a complete snapshot of all database tables,
            compressed and stored securely in Cloudflare R2.
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
          <Construction className="h-5 w-5 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">30-Day Retention</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Backups older than 30 days are automatically purged. The system keeps a rolling window of backups
            so you can always restore to a recent state.
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
          <Building2 className="h-5 w-5 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Org-Level Restore</h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Need to recover data for a specific organization? Use the "Org Restore" option to selectively
            restore data scoped to a single organization without affecting others.
          </p>
        </div>
      </div>
    </div>
  );
}
