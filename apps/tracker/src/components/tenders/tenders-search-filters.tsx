'use client';

import { useState, useCallback, useMemo } from 'react';
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
import { X, Search, Filter } from 'lucide-react';

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

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'closing_soon', label: 'Closing Soon' },
  { value: 'under_preparation', label: 'Under Preparation' },
  { value: 'awaiting_results', label: 'Awaiting Results' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
  { value: 'evaluation', label: 'Evaluation' },
  { value: 'awarded', label: 'Awarded to Convert' },
  { value: 'lost', label: 'Lost / Rejected' },
];

const QUICK_VIEWS = [
  { value: 'all', label: 'All' },
  { value: 'closing_soon', label: 'Closing Soon' },
  { value: 'under_preparation', label: 'Under Preparation' },
  { value: 'awaiting_results', label: 'Awaiting Results' },
  { value: 'awarded', label: 'Awarded to Convert' },
  { value: 'lost', label: 'Lost / Rejected' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'tenderNumber', label: 'Tender Number' },
  { value: 'submissionDate', label: 'Closing Date' },
  { value: 'status', label: 'Status' },
];

const SORT_ORDER_OPTIONS = [
  { value: 'desc', label: 'Newest First' },
  { value: 'asc', label: 'Oldest First' },
];

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
  const filters = controlledFilters ?? internalFilters;
  const mobileFilters = draftMobileFilters ?? filters;

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

  const handleSortByChange = useCallback(
    (value: string) => {
      handleFilterChange({ sortBy: value as TenderFilters['sortBy'] });
    },
    [handleFilterChange]
  );

  const handleSortOrderChange = useCallback(
    (value: string) => {
      handleFilterChange({ sortOrder: value as TenderFilters['sortOrder'] });
    },
    [handleFilterChange]
  );

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
        value: filters.search,
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
        value: client?.name || filters.clientId,
      });
    }

    return active;
  }, [filters, clients]);

  const hasActiveFilters = activeFilters.length > 0;
  const activeFilterCount = activeFilters.length;

  const selectQuickView = useCallback(
    (status: string) => {
      handleFilterChange({ status, clientId: 'all' });
    },
    [handleFilterChange]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {QUICK_VIEWS.map((view) => (
          <Button
            key={view.value}
            type="button"
            variant={filters.status === view.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => selectQuickView(view.value)}
            className="h-8"
          >
            {view.label}
          </Button>
        ))}
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:flex-wrap gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tenders by number or description..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="hidden gap-4 lg:flex">
          {/* Status Filter */}
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[170px]">
              <Filter className="h-4 w-4 mr-2" />
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

          {/* Client Filter */}
          <Select value={filters.clientId} onValueChange={handleClientChange}>
            <SelectTrigger className="w-[170px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select value={filters.sortBy} onValueChange={handleSortByChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Select value={filters.sortOrder} onValueChange={handleSortOrderChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Order" />
            </SelectTrigger>
            <SelectContent>
              {SORT_ORDER_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </MobileFilterField>

          <MobileFilterField label="Sort by">
            <Select
              value={mobileFilters.sortBy}
              onValueChange={(sortBy) =>
                setDraftMobileFilters({
                  ...mobileFilters,
                  sortBy: sortBy as TenderFilters['sortBy'],
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </MobileFilterField>

          <MobileFilterField label="Order">
            <Select
              value={mobileFilters.sortOrder}
              onValueChange={(sortOrder) =>
                setDraftMobileFilters({
                  ...mobileFilters,
                  sortOrder: sortOrder as TenderFilters['sortOrder'],
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Order" />
              </SelectTrigger>
              <SelectContent>
                {SORT_ORDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </MobileFilterField>
        </MobileFilterDrawer>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="whitespace-nowrap cursor-pointer"
          >
            Clear Filters
          </Button>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex min-w-0 flex-wrap items-center gap-2 lg:flex-1">
            <span className="text-sm text-muted-foreground">
              Active filters:
            </span>
            {activeFilters.map((filter) => (
              <Badge
                key={filter.key}
                variant="secondary"
                className="flex items-center gap-1"
              >
                <span className="font-medium">{filter.label}:</span>
                <span>{filter.value}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1 hover:bg-transparent cursor-pointer"
                  onClick={() => {
                    if (filter.key === 'search') {
                      handleFilterChange({ search: '' });
                    } else if (filter.key === 'status') {
                      handleFilterChange({ status: 'all' });
                    } else if (filter.key === 'client') {
                      handleFilterChange({ clientId: 'all' });
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
