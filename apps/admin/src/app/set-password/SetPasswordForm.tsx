"use client";

import React, { useState } from "react";
import { setOwnPassword } from "../actions";
import { AdminSetPasswordSchema } from "@/lib/validations";
import { ShieldAlert, Loader, Lock, ShieldCheck } from "lucide-react";

export default function SetPasswordForm({ email }: { email: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const result = AdminSetPasswordSchema.safeParse({
      password,
      confirmPassword,
    });
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        errors[err.path[0] as string] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const response = await setOwnPassword(password);
      if (response.success) {
        setSuccess(response.message);
        setTimeout(() => {
          window.location.replace("/");
        }, 1500);
      } else {
        setError(response.error);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
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
            Password Set
          </h1>
          <p className="text-sm text-zinc-400">{success}</p>
        </div>
        <div className="text-xs text-zinc-500 animate-pulse">
          Taking you to the console...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 space-y-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-md">
      <div className="text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shadow-md">
          <Lock className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Set Your Password
          </h1>
          <p className="text-sm text-zinc-400">
            Choose a password for <span className="text-zinc-300">{email}</span>{" "}
            before continuing.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-xl flex gap-3 text-sm text-red-200">
          <ShieldAlert className="h-5 w-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    const { password: _, ...rest } = fieldErrors;
                    setFieldErrors(rest);
                  }
                }}
                placeholder="••••••••••••"
                className={`w-full pl-11 pr-4 py-3.5 bg-zinc-950 border rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50 ${fieldErrors.password ? "border-red-500" : "border-zinc-800"}`}
              />
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-red-400">{fieldErrors.password}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-zinc-500" />
              <input
                type="password"
                required
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    const { confirmPassword: _, ...rest } = fieldErrors;
                    setFieldErrors(rest);
                  }
                }}
                placeholder="••••••••••••"
                className={`w-full pl-11 pr-4 py-3.5 bg-zinc-950 border rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 transition-colors disabled:opacity-50 ${fieldErrors.confirmPassword ? "border-red-500" : "border-zinc-800"}`}
              />
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-red-400">
                {fieldErrors.confirmPassword}
              </p>
            )}
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
            "SET PASSWORD"
          )}
        </button>
      </form>
    </div>
  );
}
