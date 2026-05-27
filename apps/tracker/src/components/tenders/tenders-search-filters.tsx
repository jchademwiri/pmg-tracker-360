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
import { X, Search, Filter } from 'lucide-react';

export interface TenderFilters {
  search: string;
  status: string;
  clientId: string;
  sortBy: 'tenderNumber' | 'createdAt' | 'submissionDate' | 'status';
  sortOrder: 'asc' | 'desc';
}

export interface TendersSearchFiltersProps {
  onFiltersChange: (filters: TenderFilters) => void;
  clients?: Array<{ id: string; name: string }>;
  className?: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'pending', label: 'Pending' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'tenderNumber', label: 'Tender Number' },
  { value: 'submissionDate', label: 'Submission Date' },
  { value: 'status', label: 'Status' },
];

const SORT_ORDER_OPTIONS = [
  { value: 'desc', label: 'Newest First' },
  { value: 'asc', label: 'Oldest First' },
];

export function TendersSearchFilters({
  onFiltersChange,
  clients = [],
  className = '',
}: TendersSearchFiltersProps) {
  const [filters, setFilters] = useState<TenderFilters>({
    search: '',
    status: 'all',
    clientId: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const handleFilterChange = useCallback(
    (newFilters: Partial<TenderFilters>) => {
      const updatedFilters = { ...filters, ...newFilters };
      setFilters(updatedFilters);
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
    setFilters(clearedFilters);
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
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

        {/* Status Filter */}
        <Select value={filters.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full lg:w-[140px]">
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
          <SelectTrigger className="w-full lg:w-[140px]">
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
          <SelectTrigger className="w-full lg:w-[160px]">
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
          <SelectTrigger className="w-full lg:w-[140px]">
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
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
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
  );
}