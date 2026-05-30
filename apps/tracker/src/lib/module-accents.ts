// Centralized accent classes for system modules.
// Each entry exposes a background/border class, a title color for strong contrast
// and a dot color used for small indicators, adapted for dark and light modes.
export const moduleAccents: Record<
  string,
  { bg: string; title: string; dot: string }
> = {
  auth: {
    bg: 'bg-blue-50/50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/30',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-blue-500 dark:bg-blue-400',
  },
  organization: {
    bg: 'bg-purple-50/50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-900/30',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-purple-500 dark:bg-purple-400',
  },
  notifications: {
    bg: 'bg-yellow-50/50 border-yellow-200 dark:bg-yellow-950/10 dark:border-yellow-900/20',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-yellow-500 dark:bg-yellow-400',
  },
  ownership: {
    bg: 'bg-pink-50/50 border-pink-200 dark:bg-pink-950/20 dark:border-pink-900/30',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-pink-500 dark:bg-pink-400',
  },
  security: {
    bg: 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900/30',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-red-500 dark:bg-red-400',
  },
  client: {
    bg: 'bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900/30',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-green-500 dark:bg-green-400',
  },
  tender: {
    bg: 'bg-orange-50/50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/30',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-orange-500 dark:bg-orange-400',
  },
  project: {
    bg: 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/30',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-indigo-500 dark:bg-indigo-400',
  },
  support: {
    bg: 'bg-cyan-50/50 border-cyan-200 dark:bg-cyan-950/20 dark:border-cyan-900/30',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-cyan-500 dark:bg-cyan-400',
  },
  document: {
    bg: 'bg-slate-50/50 border-slate-200 dark:bg-slate-900/20 dark:border-slate-800/30',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-slate-500 dark:bg-slate-400',
  },
};

// Premium palette: slightly stronger backgrounds and deeper dots for premium clients
export const moduleAccentsPremium: Record<
  string,
  { bg: string; title: string; dot: string }
> = {
  auth: {
    bg: 'bg-blue-100/50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800/40',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-blue-700 dark:bg-blue-400',
  },
  organization: {
    bg: 'bg-purple-100/50 border-purple-300 dark:bg-purple-950/30 dark:border-purple-800/40',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-purple-700 dark:bg-purple-400',
  },
  notifications: {
    bg: 'bg-amber-100/50 border-amber-300 dark:bg-amber-950/20 dark:border-amber-800/30',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-amber-700 dark:bg-amber-400',
  },
  ownership: {
    bg: 'bg-rose-100/50 border-rose-300 dark:bg-rose-950/30 dark:border-rose-800/40',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-rose-700 dark:bg-rose-400',
  },
  security: {
    bg: 'bg-red-100/50 border-red-300 dark:bg-red-950/30 dark:border-red-800/40',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-red-700 dark:bg-red-400',
  },
  client: {
    bg: 'bg-emerald-100/50 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800/40',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-emerald-700 dark:bg-emerald-400',
  },
  tender: {
    bg: 'bg-orange-100/50 border-orange-300 dark:bg-orange-950/30 dark:border-orange-800/40',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-orange-700 dark:bg-orange-400',
  },
  project: {
    bg: 'bg-indigo-100/50 border-indigo-300 dark:bg-indigo-950/30 dark:border-indigo-800/40',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-indigo-700 dark:bg-indigo-400',
  },
  support: {
    bg: 'bg-cyan-100/50 border-cyan-300 dark:bg-cyan-950/30 dark:border-cyan-800/40',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-cyan-700 dark:bg-cyan-400',
  },
  document: {
    bg: 'bg-slate-100/50 border-slate-300 dark:bg-slate-900/30 dark:border-slate-800/40',
    title: 'text-slate-950 dark:text-slate-50',
    dot: 'bg-slate-700 dark:bg-slate-400',
  },
};

export function getAccent(
  key: string,
  variant: 'system' | 'premium' = 'system'
) {
  if (variant === 'premium')
    return moduleAccentsPremium[key] ?? moduleAccentsPremium.auth;
  return moduleAccents[key] ?? moduleAccents.auth;
}

export type Accent = { bg: string; title: string; dot: string };

export default moduleAccents;
