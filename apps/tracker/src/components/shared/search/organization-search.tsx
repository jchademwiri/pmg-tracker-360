'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import type { OrganizationWithStats } from '@/server/organizations';

interface OrganizationSearchProps {
  organizations: OrganizationWithStats[];
  onFilter: (filtered: OrganizationWithStats[]) => void;
  onSearchChange?: (searchTerm: string) => void;
  className?: string;
}

export function OrganizationSearch({
  organizations,
  onFilter,
  onSearchChange,
  className,
}: OrganizationSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // Filter organizations based on debounced search term
  const filteredOrganizations = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return organizations;
    }

    return organizations.filter((org) =>
      org.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [organizations, debouncedSearchTerm]);

  // Call onFilter when filtered results change
  useEffect(() => {
    onFilter(filteredOrganizations);
  }, [filteredOrganizations, onFilter]);

  // Call onSearchChange when search term changes
  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(searchTerm);
    }
  }, [searchTerm, onSearchChange]);

  const handleClear = () => {
    setSearchTerm('');
  };

  // Only render if there are more than 3 organizations
  if (organizations.length <= 3) {
    return null;
  }

  return (
    <div className={cn('relative max-w-md mx-auto', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search organizations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
          aria-label="Search organizations"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 size-8 p-0 hover:bg-muted"
            aria-label="Clear search"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {debouncedSearchTerm && filteredOrganizations.length > 0 && (
        <div className="mt-2 text-sm text-muted-foreground text-center">
          <span>
            {filteredOrganizations.length} organization
            {filteredOrganizations.length !== 1 ? 's' : ''} found
          </span>
        </div>
      )}
    </div>
  );
}
