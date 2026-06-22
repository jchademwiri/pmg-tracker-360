'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Plus, FileText, User, Package, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ListPagination } from '@/components/shared/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/* ──────────────────────────────────────────────
   DataTableShell — shared wrapper for list pages
   
   Standardizes: Card shell, search, loading skeleton,
   empty states, pagination, result count.
   ────────────────────────────────────────────── */

export type EmptyStateConfig = {
  /** 'empty' = no records at all, 'no-results' = search returned nothing */
  type: 'empty' | 'no-results';
  /** Icon variant */
  icon?: 'file' | 'user' | 'package' | 'alert';
  /** Heading text */
  title: string;
  /** Subtitle / description */
  description: string;
  /** Label for the CTA button (null = no CTA) */
  actionLabel?: string;
  /** Where the CTA navigates to */
  actionHref?: string;
};

const EMPTY_ICONS = {
  file: FileText,
  user: User,
  package: Package,
  alert: AlertTriangle,
};

interface DataTableShellProps {
  /* ── Header ── */
  title: string;
  /** Optional action button in header */
  actionLabel?: string;
  actionHref?: string;
  /** Optional action button onClick (alternative to href) */
  onAction?: () => void;

  /* ── Search ── */
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;

  /* ── Active filter chips ── */
  activeFilters?: Array<{
    key: string;
    label: string;
    value: string;
  }>;
  onRemoveFilter?: (key: string) => void;
  onClearFilters?: () => void;

  /* ── Loading ── */
  isLoading?: boolean;

  /* ── Empty state (rendered when dataLength === 0 and !isLoading) ── */
  emptyState?: EmptyStateConfig;

  /* ── Pagination ── */
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Label for the entity type (e.g. "tenders") */
  entityLabel: string;

  /* ── Content ── */
  dataLength: number;
  /** Desktop table content (rendered inside overflow-x-auto wrapper) */
  children: ReactNode;
  /** Mobile card content (rendered inside space-y-4 wrapper) */
  mobileContent?: ReactNode;
  /** Optional extra content above the table (e.g. additional filter controls for desktop) */
  desktopFilterBar?: ReactNode;
  /** Optional extra content above mobile cards (e.g. mobile filter drawer) */
  mobileFilterBar?: ReactNode;

  className?: string;
}

export function DataTableShell({
  title,
  actionLabel,
  actionHref,
  onAction,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  activeFilters,
  onRemoveFilter,
  onClearFilters,
  isLoading = false,
  emptyState,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
  entityLabel,
  dataLength,
  children,
  mobileContent,
  desktopFilterBar,
  mobileFilterBar,
  className,
}: DataTableShellProps) {
  const showContent = !isLoading && dataLength > 0;
  const showEmpty = !isLoading && dataLength === 0 && emptyState;
  const showLoading = isLoading;

  const itemsPerPage = totalCount > 0 && currentPage > 0
    ? Math.ceil(totalCount / totalPages)
    : 20;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);
  const hasActiveFilters = activeFilters && activeFilters.length > 0;

  return (
    <Card className={cn('rounded-lg shadow-sm', className)}>
      <CardHeader className="space-y-4">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {(actionLabel) && (actionHref || onAction) && (
            actionHref ? (
              <Button asChild size="sm">
                <Link href={actionHref}>
                  <Plus className="h-4 w-4 mr-2" />
                  {actionLabel}
                </Link>
              </Button>
            ) : (
              <Button size="sm" onClick={onAction}>
                <Plus className="h-4 w-4 mr-2" />
                {actionLabel}
              </Button>
            )
          )}
        </div>

        {/* Search */}
        {onSearchChange && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              Active filters:
            </span>
            {activeFilters.map((filter) => (
              <span
                key={filter.key}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
              >
                <span className="font-semibold">{filter.label}:</span>{' '}
                {filter.value}
                {onRemoveFilter && (
                  <button
                    type="button"
                    onClick={() => onRemoveFilter(filter.key)}
                    className="ml-0.5 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-full"
                    aria-label={`Remove ${filter.label} filter`}
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
            {onClearFilters && (
              <button
                type="button"
                onClick={onClearFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Desktop filter bar (additional controls) */}
        {desktopFilterBar && (
          <div className="hidden md:block">{desktopFilterBar}</div>
        )}

        {/* Mobile filter bar */}
        {mobileFilterBar && (
          <div className="md:hidden">{mobileFilterBar}</div>
        )}

        {/* Result count */}
        {showContent && totalCount > 0 && (
          <div className="text-sm text-muted-foreground">
            {startItem}–{endItem} of {totalCount} {entityLabel}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Loading state */}
        {showLoading && (
          <div className="space-y-3 py-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {showEmpty && emptyState && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {(() => {
              const Icon = EMPTY_ICONS[emptyState.icon || 'file'];
              return <Icon className="h-12 w-12 text-muted-foreground mb-4" />;
            })()}
            <h3 className="text-lg font-medium text-foreground mb-2">
              {emptyState.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {emptyState.description}
            </p>
            {emptyState.actionLabel && emptyState.actionHref && (
              <Button asChild size="sm">
                <Link href={emptyState.actionHref}>
                  <Plus className="h-4 w-4 mr-2" />
                  {emptyState.actionLabel}
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* Content area */}
        {showContent && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              {children}
            </div>

            {/* Mobile cards */}
            {mobileContent && (
              <div className="md:hidden space-y-4">
                {mobileContent}
              </div>
            )}

            {/* Pagination */}
            <ListPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              isLoading={isLoading}
              className="mt-6"
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
