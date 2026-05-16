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
import type { Role } from '@/db/schema';

export interface FilterState {
  search: string;
  role: Role | 'all';
  status: 'all' | 'active' | 'pending' | 'expired' | 'inactive';
}

export interface SearchAndFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  placeholder?: string;
  showRoleFilter?: boolean;
  showStatusFilter?: boolean;
  className?: string;
}

const ROLE_OPTIONS: Array<{ value: Role | 'all'; label: string }> = [
  { value: 'all', label: 'All Roles' },
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
];

const STATUS_OPTIONS: Array<{ value: FilterState['status']; label: string }> = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
  { value: 'inactive', label: 'Inactive' },
];

export function SearchAndFilters({
  onFiltersChange,
  placeholder = 'Search members and invitations...',
  showRoleFilter = true,
  showStatusFilter = true,
  className = '',
}: SearchAndFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    role: 'all',
    status: 'all',
  });

  const handleFilterChange = useCallback(
    (newFilters: Partial<FilterState>) => {
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

  const handleRoleChange = useCallback(
    (value: string) => {
      handleFilterChange({ role: value as Role | 'all' });
    },
    [handleFilterChange]
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      handleFilterChange({ status: value as FilterState['status'] });
    },
    [handleFilterChange]
  );

  const clearFilters = useCallback(() => {
    const clearedFilters: FilterState = {
      search: '',
      role: 'all',
      status: 'all',
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

    if (filters.role !== 'all') {
      const roleOption = ROLE_OPTIONS.find((opt) => opt.value === filters.role);
      active.push({
        key: 'role',
        label: 'Role',
        value: roleOption?.label || filters.role,
      });
    }

    if (filters.status !== 'all') {
      const statusOption = STATUS_OPTIONS.find(
        (opt) => opt.value === filters.status
      );
      active.push({
        key: 'status',
        label: 'Status',
        value: statusOption?.label || filters.status,
      });
    }

    return active;
  }, [filters]);

  const hasActiveFilters = activeFilters.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={placeholder}
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Role Filter */}
        {showRoleFilter && (
          <Select value={filters.role} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Status Filter */}
        {showStatusFilter && (
          <Select value={filters.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="whitespace-nowrap"
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
                className="h-auto p-0 ml-1 hover:bg-transparent"
                onClick={() => {
                  if (filter.key === 'search') {
                    handleFilterChange({ search: '' });
                  } else if (filter.key === 'role') {
                    handleFilterChange({ role: 'all' });
                  } else if (filter.key === 'status') {
                    handleFilterChange({ status: 'all' });
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
