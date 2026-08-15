import { Sparkles } from 'lucide-react';

export function BetaLabel() {
  return (
    <aside
      aria-label="Beta platform notice"
      className="fixed top-3.5 right-16 z-[60] pointer-events-none hidden md:block"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-card/90 backdrop-blur-md border border-border/80 text-foreground shadow-sm pointer-events-auto transition-opacity hover:opacity-100 opacity-90">
        <span
          className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0"
          aria-hidden="true"
        />
        <span className="font-semibold text-amber-600 dark:text-amber-300">
          Public Beta
        </span>
        <span className="text-muted-foreground/50">•</span>
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          Free Full Access
        </span>
      </div>
    </aside>
  );
}

