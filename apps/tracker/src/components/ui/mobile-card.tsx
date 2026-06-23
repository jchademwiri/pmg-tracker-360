'use client';

import { ReactNode } from 'react';
import { MoreHorizontalIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/ui/status-badge';

/* ──────────────────────────────────────────────
   MobileCard — root container
   ────────────────────────────────────────────── */

interface MobileCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function MobileCard({ children, onClick, className = '' }: MobileCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-border/40 bg-card/45 backdrop-blur-md hover:bg-card/60 transition-all shadow-sm relative overflow-hidden ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────
   MobileCardHeader — top bar: identifier + badge + optional actions
   ────────────────────────────────────────────── */

interface MobileCardHeaderProps {
  /** Primary identifier (e.g. tender number, PO number) */
  identifier: ReactNode;
  /** Optional status string — renders a StatusBadge */
  status?: string;
  /** Optional status override — renders arbitrary content in the badge slot */
  badge?: ReactNode;
  /** Whether to stop click propagation from the actions area */
  onClickStopPropagation?: boolean;
  /** Dropdown menu items for the actions menu */
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }>;
  className?: string;
}

export function MobileCardHeader({
  identifier,
  status,
  badge,
  actions,
  className = '',
}: MobileCardHeaderProps) {
  return (
    <div className={`flex items-center justify-between gap-2 px-4 pt-4 pb-2 ${className}`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="font-mono text-sm font-bold text-blue-400 truncate">
          {identifier}
        </span>
        {badge ?? (status ? <StatusBadge status={status} /> : null)}
      </div>

      {actions && actions.length > 0 && (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 cursor-pointer shrink-0">
                <MoreHorizontalIcon className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action, i) => (
                <div key={action.label}>
                  {i === actions.length - 1 && action.variant === 'destructive' && (
                    <DropdownMenuSeparator />
                  )}
                  <DropdownMenuItem
                    onClick={action.onClick}
                    variant={action.variant === 'destructive' ? 'destructive' : undefined}
                  >
                    {action.label}
                  </DropdownMenuItem>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   MobileCardBody — scrollable content area
   ────────────────────────────────────────────── */

interface MobileCardBodyProps {
  children: ReactNode;
  className?: string;
}

export function MobileCardBody({ children, className = '' }: MobileCardBodyProps) {
  return <div className={`px-4 pb-4 space-y-3 ${className}`}>{children}</div>;
}

/* ──────────────────────────────────────────────
   MobileCardField — a label/value pair
   ────────────────────────────────────────────── */

interface MobileCardFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function MobileCardField({ label, children, className = '' }: MobileCardFieldProps) {
  return (
    <div className={className}>
      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-0.5">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{children}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────
   MobileCardGrid — 2-column details grid
   ────────────────────────────────────────────── */

interface MobileCardGridProps {
  children: ReactNode;
  className?: string;
}

export function MobileCardGrid({ children, className = '' }: MobileCardGridProps) {
  return (
    <div className={`grid grid-cols-2 gap-y-2.5 gap-x-4 border-t border-border/20 pt-3 ${className}`}>
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────
   MobileCardActions — bottom action bar
   ────────────────────────────────────────────── */

interface MobileCardAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
}

interface MobileCardActionsProps {
  actions: MobileCardAction[];
  className?: string;
}

export function MobileCardActions({ actions, className = '' }: MobileCardActionsProps) {
  return (
    <div className={`flex items-center gap-2 px-4 pb-4 pt-1 border-t border-border/20 ${className}`}>
      {actions.map((action) => (
        action.href ? (
          <Link
            key={action.label}
            href={action.href}
            className="flex-1"
          >
            <Button
              variant={action.variant ?? 'ghost'}
              size="sm"
              className="w-full text-xs h-8 cursor-pointer"
            >
              {action.icon}
              {action.label}
            </Button>
          </Link>
        ) : (
          <Button
            key={action.label}
            variant={action.variant ?? 'ghost'}
            size="sm"
            className="flex-1 text-xs h-8 cursor-pointer"
            onClick={action.onClick}
          >
            {action.icon}
            {action.label}
          </Button>
        )
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   MobileCardList — wrapper that shows cards on mobile, nothing on desktop
   Use alongside a desktop table: the table gets `hidden md:block`, 
   this gets `md:hidden`.
   ────────────────────────────────────────────── */

interface MobileCardListProps {
  children: ReactNode;
  emptyMessage?: string;
  className?: string;
}

export function MobileCardList({ children, emptyMessage, className = '' }: MobileCardListProps) {
  return (
    <div className={`md:hidden space-y-3 ${className}`}>
      {children}
      {emptyMessage && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
