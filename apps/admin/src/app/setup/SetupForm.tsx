'use client';

import React, { useState } from 'react';
import { createSystemAdmin } from '../actions';
import { ShieldAlert, Loader, Lock, Mail, User, ShieldCheck } from 'lucide-react';

export default function SetupForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await createSystemAdmin(name, email, password);
      if (response.success) {
        setSuccess(response.message ?? 'Super Admin successfully registered!');
        // After 2.5 seconds, redirect to the login screen
        setTimeout(() => {
          window.location.replace('/login');
        }, 2500);
      } else {
        setError(response.error ?? 'Setup failed');
      }
    } catch {
      setError('An unexpected error occurred during setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md p-8 space-y-6 bg-zinc-900 border border-emerald-900/60 rounded-2xl shadow-2xl backdrop-blur-md text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-md">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            System Initialized!
          </h1>
          <p className="text-sm text-zinc-400">
            {success}
          </p>
        </div>
        <div className="text-xs text-zinc-500 animate-pulse">
          Redirecting to authentication console...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-md">
      {/* 1. BRAND MARK & HEADER */}
      <div className="text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-md">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Initial System Setup
          </h1>
          <p className="text-sm text-zinc-400">
            Configure the platform super administrator account
          </p>
        </div>
      </div>

      {/* 2. SECURITY NOTE */}
      <div className="p-4 bg-amber-950/20 border border-amber-900/40 rounded-xl text-xs leading-relaxed text-amber-200">
        <strong>⚠️ Security Lockout Rule:</strong> This setup page is only accessible when zero administrators exist in the database. Once you create this initial account, this route will be permanently deactivated.
      </div>

      {/* 3. ERROR DISPLAY CONTAINER */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-xl flex gap-3 text-sm text-red-200">
          <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 4. SETUP FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Full Name input field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">
              Administrator Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="text"
                required
                disabled={loading}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Chief Administrator"
                className="w-full pl-11 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Email input field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">
              Super Admin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tendertrack360.co.za"
                className="w-full pl-11 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password input field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">
              Master Passphrase
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-zinc-100 hover:bg-white text-black font-semibold rounded-xl text-sm tracking-wider cursor-pointer shadow-lg hover:shadow-white/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <Loader className="h-4 w-4 animate-spin text-black" />
          ) : (
            'INITIALIZE SYSTEM ADMIN'
          )}
        </button>
      </form>
    </div>
  );
}
