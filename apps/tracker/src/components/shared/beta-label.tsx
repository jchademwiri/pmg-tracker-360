import { Sparkles } from 'lucide-react';

export function BetaLabel() {
  return (
    <aside
      aria-label="Beta platform notice"
      className="fixed bottom-4 left-4 z-40 pointer-events-none hidden md:block"
    >
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-card/85 backdrop-blur-md border border-border/80 text-foreground shadow-lg shadow-black/20 pointer-events-auto transition-opacity hover:opacity-100 opacity-80">
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" aria-hidden="true" />
        <span className="font-bold text-amber-300">Public Beta</span>
        <span className="text-muted-foreground/60">&bull;</span>
        <span className="text-emerald-400 font-semibold">Free Full Access</span>
      </div>
    </aside>
  );
}
