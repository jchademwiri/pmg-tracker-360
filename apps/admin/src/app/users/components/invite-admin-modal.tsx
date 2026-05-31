'use client';

import React, { useState } from 'react';
import { createSystemAdmin } from '../../actions';
import { Shield, Plus, X, Loader, ShieldCheck, Mail, Lock, User } from 'lucide-react';

export function InviteAdminModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOpen = () => {
    setName('');
    setEmail('');
    setPassword('');
    setError(null);
    setSuccess(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await createSystemAdmin(name, email, password);
      if (res.success) {
        setSuccess(res.message ?? 'System admin created successfully!');
        // Close modal after delay to let user see success
        setTimeout(() => {
          setIsOpen(false);
        }, 2000);
      } else {
        setError(res.error ?? 'Failed to create system administrator');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Invite Admin Trigger Button */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 px-4.5 py-2.5 bg-zinc-100 hover:bg-white text-black font-semibold rounded-xl text-sm transition-all cursor-pointer shadow-lg hover:shadow-white/5"
      >
        <Plus className="h-4.5 w-4.5 stroke-[2.5]" />
        Invite System Admin
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl space-y-6 relative animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={handleClose}
              disabled={loading}
              className="absolute right-4.5 top-4.5 text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">
                  Add System Administrator
                </h3>
                <p className="text-xs text-zinc-400">
                  Register a new system-wide platform operator.
                </p>
              </div>
            </div>

            {/* Inline message displays */}
            {error && (
              <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-200 flex gap-2">
                <Shield className="h-4 w-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-xs text-emerald-200 flex gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Administrator Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    disabled={loading || !!success}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sipho Dube"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Security Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    disabled={loading || !!success}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. sipho@tendertrack360.co.za"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Initial Passphrase
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    disabled={loading || !!success}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-semibold rounded-xl text-xs tracking-wider cursor-pointer transition-colors disabled:opacity-50"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={loading || !!success}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-white text-black font-semibold rounded-xl text-xs tracking-wider cursor-pointer shadow-lg hover:shadow-white/5 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader className="h-4 w-4 animate-spin text-black" />
                  ) : (
                    'INVITE'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
