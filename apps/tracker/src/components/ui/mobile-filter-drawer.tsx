'use client';

import { useState, ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';

/* ──────────────────────────────────────────────
   MobileFilterDrawer — bottom sheet for mobile filters
   
   Shows a filter icon on mobile (hidden on desktop).
   Opens a bottom sheet with slot-based content.
   ────────────────────────────────────────────── */

interface MobileFilterDrawerProps {
  /** Current active filter count (shows badge) */
  activeFilterCount?: number;
  /** Filter content rendered inside the sheet */
  children: ReactNode;
  /** Callback when Apply is tapped */
  onApply?: () => void;
  /** Callback when Clear All is tapped */
  onClear?: () => void;
  /** Label for the sheet title */
  title?: string;
  /** Number of active filters for the badge */
  className?: string;
}

export function MobileFilterDrawer({
  activeFilterCount = 0,
  children,
  onApply,
  onClear,
  title = 'Filters',
  className = '',
}: MobileFilterDrawerProps) {
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    onApply?.();
    setOpen(false);
  };

  const handleClear = () => {
    onClear?.();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`md:hidden relative cursor-pointer ${className}`}
        >
          <SlidersHorizontal className="h-4 w-4 mr-1.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl border-t">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            {title}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
          {children}
        </div>
        <SheetFooter className="flex-row gap-2 border-t pt-4">
          {onClear && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="flex-1 cursor-pointer"
            >
              Clear All
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleApply}
            className="flex-1 cursor-pointer"
          >
            Apply Filters
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/* ──────────────────────────────────────────────
   MobileFilterField — label + content wrapper inside the drawer
   ────────────────────────────────────────────── */

interface MobileFilterFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function MobileFilterField({ label, children, className = '' }: MobileFilterFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}


