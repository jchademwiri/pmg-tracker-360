import { useState, useMemo, useCallback } from 'react';

import {
  filterMembers,
  filterInvitations,
  hasActiveFilters,
  getNoResultsMessage,
} from '@/lib/filter-utils';
import type { MemberWithUser } from '@/lib/filter-utils';
import type { PendingInvitation } from '@/server/organizations';
import { FilterState } from '@/components/shared/search';

export interface UseSearchAndFilterProps {
  members?: MemberWithUser[];
  invitations?: PendingInvitation[];
}

export interface UseSearchAndFilterReturn {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  filteredMembers: MemberWithUser[];
  filteredInvitations: PendingInvitation[];
  hasActiveFilters: boolean;
  totalResults: number;
  noResultsMessage: string;
  clearFilters: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  role: 'all',
  status: 'all',
};

export function useSearchAndFilter({
  members = [],
  invitations = [],
}: UseSearchAndFilterProps): UseSearchAndFilterReturn {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const filteredMembers = useMemo(() => {
    return filterMembers(members, filters);
  }, [members, filters]);

  const filteredInvitations = useMemo(() => {
    return filterInvitations(invitations, filters);
  }, [invitations, filters]);

  const hasFilters = useMemo(() => {
    return hasActiveFilters(filters);
  }, [filters]);

  const totalResults = filteredMembers.length + filteredInvitations.length;

  const noResultsMessage = useMemo(() => {
    const hasMembers = members.length > 0;
    const hasInvitations = invitations.length > 0;

    let type: 'members' | 'invitations' | 'both';

    if (hasMembers && hasInvitations) {
      type = 'both';
    } else if (hasMembers) {
      type = 'members';
    } else {
      type = 'invitations';
    }

    return getNoResultsMessage(filters, type);
  }, [filters, members.length, invitations.length]);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    filters,
    setFilters,
    filteredMembers,
    filteredInvitations,
    hasActiveFilters: hasFilters,
    totalResults,
    noResultsMessage,
    clearFilters,
  };
}
