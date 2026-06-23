'use client';

import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

/* ──────────────────────────────────────────────
   MobileActionBar — sticky bottom bar for detail pages on mobile
   
   Hidden on desktop (md+), fixed to bottom on mobile.
   Renders 2-4 action buttons in a row.
   ────────────────────────────────────────────── */

interface MobileActionBarAction {
  label: string;
  onClick?: () => void;
  icon?: ReactNode;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  disabled?: boolean;
}

interface MobileActionBarProps {
  actions: MobileActionBarAction[];
  className?: string;
}

export function MobileActionBar({ actions, className = '' }: MobileActionBarProps) {
  if (actions.length === 0) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50 px-3 py-2 ${className}`}
    >
      <div className="flex items-center gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            variant={action.variant ?? 'outline'}
            size="sm"
            className="flex-1 text-xs h-9 cursor-pointer gap-1.5 min-w-0"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.icon}
            <span className="truncate">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   MobileActionBarSpacer — adds bottom padding so content isn't hidden behind the fixed bar
   ────────────────────────────────────────────── */

export function MobileActionBarSpacer() {
  return <div className="h-16 md:hidden" />;
}
