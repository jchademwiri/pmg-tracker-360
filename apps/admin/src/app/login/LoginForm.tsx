'use client';

import React, { useState } from 'react';
import { adminSignIn } from '../actions';
import { ShieldAlert, Loader, Lock, Mail } from 'lucide-react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await adminSignIn(email, password);
      if (response.success) {
        // Redirect to dashboard overview on successful login
        window.location.replace('/');
      } else {
        setError(response.error ?? 'Authentication failed');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-md">
      {/* 1. BRAND MARK & HEADER */}
      <div className="text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-[var(--primary)] text-[var(--accent)] flex items-center justify-center border border-zinc-800 shadow-md">
          <Lock className="h-5 w-5 text-amber-500" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Console Sign In
          </h1>
          <p className="text-sm text-zinc-400">
            Tender Track 360 Platform Administration
          </p>
        </div>
      </div>

      {/* 2. ERROR DISPLAY CONTAINER */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-xl flex gap-3 text-sm text-red-200">
          <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. LOGIN FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Email input field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">
              Security Email
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
              Passphrase
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
            'AUTHENTICATE'
          )}
        </button>
      </form>
    </div>
  );
}
