'use client';

import React, { useState } from 'react';
import { adminSignIn, adminSendMagicLink, verifyAdminOTP } from '../actions';
import { ShieldAlert, Loader, Lock, Mail, Key, ShieldCheck } from 'lucide-react';

export default function LoginForm() {
  const [activeTab, setActiveTab] = useState<'password' | 'passwordless'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      const response = await adminSignIn(email, password);
      if (response.success) {
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

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      const response = await adminSendMagicLink(email);
      if (response.success) {
        setIsOtpSent(true);
        setStatusMessage(response.message ?? 'Link and code sent successfully!');
      } else {
        setError(response.error ?? 'Failed to send login code');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      const response = await verifyAdminOTP(email, otp);
      if (response.success && response.token) {
        // Redirect to standard magic-link verify endpoint to log in programmatically
        window.location.replace(`/api/auth/magic-link?token=${response.token}&callbackURL=/`);
      } else {
        setError(response.error ?? 'Invalid or expired passcode.');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
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

      {/* 2. AUTHENTICATION TAB SELECTOR */}
      <div className="grid grid-cols-2 p-1 bg-zinc-950 border border-zinc-800/80 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setActiveTab('password');
            setError(null);
            setStatusMessage(null);
          }}
          className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'password'
              ? 'bg-zinc-800 text-white shadow-xs'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          PASSPHRASE
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('passwordless');
            setError(null);
            setStatusMessage(null);
          }}
          className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'passwordless'
              ? 'bg-zinc-800 text-white shadow-xs'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          CODE & LINK
        </button>
      </div>

      {/* 3. ALERTS DISPLAY */}
      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-xl flex gap-3 text-sm text-red-200">
          <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {statusMessage && (
        <div className="p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-xl flex gap-3 text-sm text-emerald-200">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 4. ACTIVE FORM */}
      {activeTab === 'password' ? (
        /* PASSWORD SIGN IN FORM */
        <form onSubmit={handlePasswordSubmit} className="space-y-6">
          <div className="space-y-4">
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
      ) : (
        /* PASSWORDLESS SIGN IN FORM (OTP & MAGIC LINK) */
        <div className="space-y-6">
          {!isOtpSent ? (
            /* PHASE 1: Enter email to send magic link & code */
            <form onSubmit={handleSendLink} className="space-y-6">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-zinc-100 hover:bg-white text-black font-semibold rounded-xl text-sm tracking-wider cursor-pointer shadow-lg hover:shadow-white/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader className="h-4 w-4 animate-spin text-black" />
                ) : (
                  'SEND SIGN-IN LINK & CODE'
                )}
              </button>
            </form>
          ) : (
            /* PHASE 2: Code is sent, enter 6-digit OTP code */
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">
                    6-Digit Passcode
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      disabled={loading}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="123456"
                      className="w-full pl-11 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-center text-white tracking-[0.25em] font-mono placeholder-zinc-700 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-zinc-100 hover:bg-white text-black font-semibold rounded-xl text-sm tracking-wider cursor-pointer shadow-lg hover:shadow-white/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader className="h-4 w-4 animate-spin text-black" />
                  ) : (
                    'VERIFY PASSCODE'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsOtpSent(false)}
                  disabled={loading}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer text-center py-1 underline underline-offset-4"
                >
                  Change Email or Resend
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
