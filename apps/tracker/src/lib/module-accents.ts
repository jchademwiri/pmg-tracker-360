// Centralized accent classes for system modules.
// Each entry exposes a background/border class, a title color for strong contrast
// and a dot color used for small indicators.
export const moduleAccents: Record<
  string,
  { bg: string; title: string; dot: string }
> = {
  auth: {
    bg: 'bg-blue-50 border-blue-200',
    title: 'text-slate-900',
    dot: 'bg-blue-500',
  },
  organization: {
    bg: 'bg-purple-50 border-purple-200',
    title: 'text-slate-900',
    dot: 'bg-purple-500',
  },
  notifications: {
    bg: 'bg-yellow-50 border-yellow-200',
    title: 'text-slate-900',
    dot: 'bg-yellow-500',
  },
  ownership: {
    bg: 'bg-pink-50 border-pink-200',
    title: 'text-slate-900',
    dot: 'bg-pink-500',
  },
  security: {
    bg: 'bg-red-50 border-red-200',
    title: 'text-slate-900',
    dot: 'bg-red-500',
  },
  client: {
    bg: 'bg-green-50 border-green-200',
    title: 'text-slate-900',
    dot: 'bg-green-500',
  },
  tender: {
    bg: 'bg-orange-50 border-orange-200',
    title: 'text-slate-900',
    dot: 'bg-orange-500',
  },
  project: {
    bg: 'bg-indigo-50 border-indigo-200',
    title: 'text-slate-900',
    dot: 'bg-indigo-500',
  },
  support: {
    bg: 'bg-cyan-50 border-cyan-200',
    title: 'text-slate-900',
    dot: 'bg-cyan-500',
  },
  document: {
    bg: 'bg-slate-50 border-slate-200',
    title: 'text-slate-900',
    dot: 'bg-slate-500',
  },
};

export default moduleAccents;
// Premium palette: slightly stronger backgrounds and deeper dots for premium clients
export const moduleAccentsPremium: Record<
  string,
  { bg: string; title: string; dot: string }
> = {
  auth: {
    bg: 'bg-blue-100 border-blue-300',
    title: 'text-slate-900',
    dot: 'bg-blue-700',
  },
  organization: {
    bg: 'bg-purple-100 border-purple-300',
    title: 'text-slate-900',
    dot: 'bg-purple-700',
  },
  notifications: {
    bg: 'bg-amber-100 border-amber-300',
    title: 'text-slate-900',
    dot: 'bg-amber-700',
  },
  ownership: {
    bg: 'bg-rose-100 border-rose-300',
    title: 'text-slate-900',
    dot: 'bg-rose-700',
  },
  security: {
    bg: 'bg-red-100 border-red-300',
    title: 'text-slate-900',
    dot: 'bg-red-700',
  },
  client: {
    bg: 'bg-emerald-100 border-emerald-300',
    title: 'text-slate-900',
    dot: 'bg-emerald-700',
  },
  tender: {
    bg: 'bg-orange-100 border-orange-300',
    title: 'text-slate-900',
    dot: 'bg-orange-700',
  },
  project: {
    bg: 'bg-indigo-100 border-indigo-300',
    title: 'text-slate-900',
    dot: 'bg-indigo-700',
  },
  support: {
    bg: 'bg-cyan-100 border-cyan-300',
    title: 'text-slate-900',
    dot: 'bg-cyan-700',
  },
  document: {
    bg: 'bg-slate-100 border-slate-300',
    title: 'text-slate-900',
    dot: 'bg-slate-700',
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
