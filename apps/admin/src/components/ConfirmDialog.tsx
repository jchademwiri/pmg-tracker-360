'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, Trash2, AlertTriangle, Info, X, Loader } from 'lucide-react';

export type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  requireConfirmationValue?: string; // If set, user must type this exact string to enable confirm
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  requireConfirmationValue,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTypedValue('');
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const isConfirmationValid =
    !requireConfirmationValue ||
    typedValue.trim().toLowerCase() === requireConfirmationValue.trim().toLowerCase();

  const icon =
    variant === 'danger' ? (
      <div className="h-10 w-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20 shrink-0">
        <Trash2 className="h-5 w-5" />
      </div>
    ) : variant === 'warning' ? (
      <div className="h-10 w-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
        <AlertTriangle className="h-5 w-5" />
      </div>
    ) : (
      <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 shrink-0">
        <Info className="h-5 w-5" />
      </div>
    );

  const confirmBtnClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-500 text-white'
      : variant === 'warning'
      ? 'bg-amber-600 hover:bg-amber-500 text-white'
      : 'bg-white hover:bg-zinc-200 text-black';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={() => !loading && onClose()}
        aria-hidden="true"
      />

      {/* Dialog box */}
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl z-10 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          {icon}
          <div className="space-y-1 pr-6">
            <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
          </div>
        </div>

        {requireConfirmationValue && (
          <div className="space-y-2 pt-1">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Type <span className="text-white font-mono">{requireConfirmationValue}</span> to confirm
            </label>
            <input
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={requireConfirmationValue}
              disabled={loading}
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm font-mono text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || !isConfirmationValid}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${confirmBtnClass}`}
          >
            {loading && <Loader className="h-3.5 w-3.5 animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
