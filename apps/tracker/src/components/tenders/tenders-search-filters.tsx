'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MobileFilterDrawer,
  MobileFilterField,
} from '@/components/ui/mobile-filter-drawer';
import { X, Search, Building2, ArrowUpDown, RotateCcw, AlertTriangle } from 'lucide-react';
import { formatClientName } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface TenderFilters {
  search: string;
  status: string;
  clientId: string;
  sortBy: 'tenderNumber' | 'createdAt' | 'submissionDate' | 'status';
  sortOrder: 'asc' | 'desc';
}

export interface TendersSearchFiltersProps {
  filters?: TenderFilters;
  onFiltersChange: (filters: TenderFilters) => void;
  clients?: Array<{ id: string; name: string }>;
  className?: string;
}

const QUICK_VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'closing_soon', label: 'Closing Soon' },
  { value: 'under_preparation', label: 'Under Preparation' },
  { value: 'awaiting_results', label: 'Awaiting Results' },
  {
    value: 'validity_expired_uncontacted',
    label: 'Needs Follow-up',
    icon: AlertTriangle,
    isAlert: true,
  },
  { value: 'awarded', label: 'Awarded to Convert' },
  { value: 'lost', label: 'Lost / Rejected' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'closing_soon', label: 'Closing Soon' },
  { value: 'under_preparation', label: 'Under Preparation' },
  { value: 'awaiting_results', label: 'Awaiting Results' },
  { value: 'validity_expired_uncontacted', label: 'Needs Follow-up (Expired Validity)' },
  { value: 'open', label: 'Open' },
  { value: 'evaluation', label: 'Evaluation' },
  { value: 'closed', label: 'Closed' },
  { value: 'awarded', label: 'Awarded to Convert' },
  { value: 'lost', label: 'Lost / Rejected' },
];

const SORT_PRESETS = [
  { value: 'submissionDate:asc', label: 'Closing Date (Soonest first)', sortBy: 'submissionDate', sortOrder: 'asc' },
  { value: 'submissionDate:desc', label: 'Closing Date (Latest first)', sortBy: 'submissionDate', sortOrder: 'desc' },
  { value: 'createdAt:desc', label: 'Date Created (Newest first)', sortBy: 'createdAt', sortOrder: 'desc' },
  { value: 'createdAt:asc', label: 'Date Created (Oldest first)', sortBy: 'createdAt', sortOrder: 'asc' },
  { value: 'tenderNumber:asc', label: 'Tender Number (A-Z)', sortBy: 'tenderNumber', sortOrder: 'asc' },
  { value: 'tenderNumber:desc', label: 'Tender Number (Z-A)', sortBy: 'tenderNumber', sortOrder: 'desc' },
  { value: 'status:asc', label: 'Status (A-Z)', sortBy: 'status', sortOrder: 'asc' },
] as const;

export function TendersSearchFilters({
  filters: controlledFilters,
  onFiltersChange,
  clients = [],
  className = '',
}: TendersSearchFiltersProps) {
  const [internalFilters, setInternalFilters] = useState<TenderFilters>({
    search: '',
    status: 'all',
    clientId: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [draftMobileFilters, setDraftMobileFilters] =
    useState<TenderFilters | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filters = controlledFilters ?? internalFilters;
  const mobileFilters = draftMobileFilters ?? filters;

  // Keyboard shortcut (Cmd+K / Ctrl+K or /) to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFilterChange = useCallback(
    (newFilters: Partial<TenderFilters>) => {
      const updatedFilters = { ...filters, ...newFilters };
      setInternalFilters(updatedFilters);
      onFiltersChange(updatedFilters);
    },
    [filters, onFiltersChange]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      handleFilterChange({ search: value });
    },
    [handleFilterChange]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      handleFilterChange({ status: value });
    },
    [handleFilterChange]
  );

  const handleClientChange = useCallback(
    (value: string) => {
      handleFilterChange({ clientId: value });
    },
    [handleFilterChange]
  );

  const handleCombinedSortChange = useCallback(
    (sortKey: string) => {
      const matched = SORT_PRESETS.find((s) => s.value === sortKey);
      if (matched) {
        handleFilterChange({
          sortBy: matched.sortBy as TenderFilters['sortBy'],
          sortOrder: matched.sortOrder as TenderFilters['sortOrder'],
        });
      }
    },
    [handleFilterChange]
  );

  const currentSortValue = `${filters.sortBy}:${filters.sortOrder}`;

  const clearFilters = useCallback(() => {
    const clearedFilters: TenderFilters = {
      search: '',
      status: 'all',
      clientId: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    setInternalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  }, [onFiltersChange]);

  const activeFilters = useMemo(() => {
    const active: Array<{ key: string; label: string; value: string }> = [];

    if (filters.search) {
      active.push({
        key: 'search',
        label: 'Search',
        value: `"${filters.search}"`,
      });
    }

    if (filters.status !== 'all') {
      const statusOption = STATUS_OPTIONS.find((opt) => opt.value === filters.status);
      active.push({
        key: 'status',
        label: 'Status',
        value: statusOption?.label || filters.status,
      });
    }

    if (filters.clientId !== 'all') {
      const client = clients.find((c) => c.id === filters.clientId);
      active.push({
        key: 'client',
        label: 'Client',
        value: client ? formatClientName(client.name) : filters.clientId,
      });
    }

    return active;
  }, [filters, clients]);

  const hasActiveFilters = activeFilters.length > 0;
  const activeFilterCount = activeFilters.length;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Level 1: Compact Segmented Status Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        <nav
          className="inline-flex items-center gap-1 p-1 bg-muted/40 border border-border/50 rounded-lg text-xs shrink-0"
          aria-label="Tender Status Filter Tabs"
        >
          {QUICK_VIEWS.map((view) => {
            const isActive = filters.status === view.value;
            const ViewIcon = (view as any).icon;
            const isAlert = Boolean((view as any).isAlert);
            return (
              <button
                key={view.value}
                type="button"
                onClick={() => handleStatusChange(view.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md font-medium transition-all duration-150 text-xs whitespace-nowrap cursor-pointer flex items-center gap-1.5',
                  isActive
                    ? 'bg-background text-foreground shadow-xs font-semibold border border-border/70 dark:border-border/60'
                    : isAlert
                      ? 'text-amber-500 hover:text-amber-400 hover:bg-amber-500/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
              >
                {ViewIcon && <ViewIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                <span>{view.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Level 2: Compact Search & Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none" />
          <Input
            ref={searchInputRef}
            placeholder="Search tenders by number or description..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-9 pl-8 pr-14 text-xs bg-muted/20 border-border/60 hover:border-border focus:bg-background transition-colors"
          />
          {filters.search ? (
            <button
              type="button"
              onClick={() => handleSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-sm transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none h-4.5 select-none rounded border border-border/60 bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Desktop Dropdowns */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {/* Client Filter */}
          <Select value={filters.clientId} onValueChange={handleClientChange}>
            <SelectTrigger className="h-9 w-[180px] text-xs bg-muted/20 border-border/60 hover:border-border">
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value="all" className="text-xs font-medium">
                All Clients
              </SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id} className="text-xs">
                  {formatClientName(client.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Consolidated Sort */}
          <Select value={currentSortValue} onValueChange={handleCombinedSortChange}>
            <SelectTrigger className="h-9 w-[210px] text-xs bg-muted/20 border-border/60 hover:border-border">
              <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              {SORT_PRESETS.map((preset) => (
                <SelectItem key={preset.value} value={preset.value} className="text-xs">
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mobile Filter Drawer Trigger */}
        <div className="sm:hidden">
          <MobileFilterDrawer
            activeFilterCount={activeFilterCount}
            title="Filter Tenders"
            onApply={() => {
              if (draftMobileFilters) {
                handleFilterChange(draftMobileFilters);
              }
            }}
            onClear={() => {
              const clearedFilters: TenderFilters = {
                search: filters.search,
                status: 'all',
                clientId: 'all',
                sortBy: 'createdAt',
                sortOrder: 'desc',
              };
              setDraftMobileFilters(clearedFilters);
              handleFilterChange(clearedFilters);
            }}
          >
            <MobileFilterField label="Status">
              <Select
                value={mobileFilters.status}
                onValueChange={(status) =>
                  setDraftMobileFilters({ ...mobileFilters, status })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </MobileFilterField>

            <MobileFilterField label="Client">
              <Select
                value={mobileFilters.clientId}
                onValueChange={(clientId) =>
                  setDraftMobileFilters({ ...mobileFilters, clientId })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {formatClientName(client.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </MobileFilterField>

            <MobileFilterField label="Sort order">
              <Select
                value={`${mobileFilters.sortBy}:${mobileFilters.sortOrder}`}
                onValueChange={(val) => {
                  const matched = SORT_PRESETS.find((s) => s.value === val);
                  if (matched) {
                    setDraftMobileFilters({
                      ...mobileFilters,
                      sortBy: matched.sortBy as TenderFilters['sortBy'],
                      sortOrder: matched.sortOrder as TenderFilters['sortOrder'],
                    });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </MobileFilterField>
          </MobileFilterDrawer>
        </div>

        {/* Clear Filters (Desktop Micro-Button) */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="hidden sm:inline-flex h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            title="Reset all filters"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Level 3: Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">
            Filtered by:
          </span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="h-6 px-2 py-0 text-[11px] font-normal bg-muted/60 hover:bg-muted text-foreground border border-border/50 flex items-center gap-1.5 rounded-md"
            >
              <span className="font-semibold text-muted-foreground">
                {filter.label}:
              </span>
              <span className="truncate max-w-[140px]">{filter.value}</span>
              <button
                type="button"
                className="hover:text-destructive focus:outline-none cursor-pointer rounded-full p-0.5"
                onClick={() => {
                  if (filter.key === 'search') {
                    handleFilterChange({ search: '' });
                  } else if (filter.key === 'status') {
                    handleFilterChange({ status: 'all' });
                  } else if (filter.key === 'client') {
                    handleFilterChange({ clientId: 'all' });
                  }
                }}
                aria-label={`Remove ${filter.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button
            type="button"
            onClick={clearFilters}
            className="text-[11px] text-muted-foreground hover:text-foreground underline ml-1 cursor-pointer transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
