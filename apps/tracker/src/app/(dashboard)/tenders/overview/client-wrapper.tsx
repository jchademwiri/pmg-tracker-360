'use client';

import { useRouter } from 'next/navigation';

import { useState, useCallback } from 'react';
import {
  TendersSearchFilters,
  type TenderFilters,
} from '@/components/tenders/tenders-search-filters';
import { TendersTable } from '@/components/tenders/tenders-table';
import { getTendersOverview, deleteTender } from '@/server/tenders';
import { toast } from 'sonner';

interface Tender {
  id: string;
  tenderNumber: string;
  description: string | null;
  submissionDate: Date | null;
  value: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    name: string;
  } | null;
}

interface TendersOverviewClientProps {
  initialTenders: Tender[];
  initialTotalCount: number;
  initialCurrentPage: number;
  initialTotalPages: number;
  initialFilters: TenderFilters;
  clients: Array<{ id: string; name: string }>;
  organizationId: string;
  basePath?: string;
}

export function TendersOverviewClient({
  initialTenders,
  initialTotalCount,
  initialCurrentPage,
  initialTotalPages,
  initialFilters,
  clients,
  organizationId,
  basePath = '/tenders/overview',
}: TendersOverviewClientProps) {
  const router = useRouter();
  const [tenders, setTenders] = useState(initialTenders);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [currentPage, setCurrentPage] = useState(initialCurrentPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TenderFilters>(initialFilters);

  const syncUrl = useCallback(
    (nextFilters: TenderFilters, nextPage: number) => {
      const params = new URLSearchParams();

      if (nextFilters.search) params.set('search', nextFilters.search);
      if (nextFilters.status !== 'all') params.set('status', nextFilters.status);
      if (nextFilters.clientId !== 'all') params.set('clientId', nextFilters.clientId);
      if (nextFilters.sortBy !== 'createdAt') params.set('sortBy', nextFilters.sortBy);
      if (nextFilters.sortOrder !== 'desc') params.set('sortOrder', nextFilters.sortOrder);
      if (nextPage > 1) params.set('page', String(nextPage));

      const query = params.toString();
      router.replace(query ? `${basePath}?${query}` : basePath, {
        scroll: false,
      });
    },
    [router]
  );

  const handleFiltersChange = useCallback(
    async (newFilters: TenderFilters) => {
      setFilters(newFilters);
      setLoading(true);
      syncUrl(newFilters, 1);

      try {
        const result = await getTendersOverview(
          organizationId,
          newFilters,
          1,
          20
        );
        if (result.success) {
          setTenders(result.tenders);
          setTotalCount(result.totalCount);
          setCurrentPage(result.currentPage);
          setTotalPages(result.totalPages);
        }
      } catch (error) {
        console.error('Error fetching filtered tenders:', error);
      } finally {
        setLoading(false);
      }
    },
    [organizationId, syncUrl]
  );

  const handlePageChange = useCallback(
    async (page: number) => {
      setLoading(true);
      syncUrl(filters, page);

      try {
        const result = await getTendersOverview(
          organizationId,
          filters,
          page,
          20
        );
        if (result.success) {
          setTenders(result.tenders);
          setTotalCount(result.totalCount);
          setCurrentPage(result.currentPage);
          setTotalPages(result.totalPages);
        }
      } catch (error) {
        console.error('Error fetching tenders page:', error);
      } finally {
        setLoading(false);
      }
    },
    [organizationId, filters]
  );

  const handleViewTender = useCallback(
    (tenderId: string) => {
      // Navigate to tender detail page
      router.push(`/tenders/${tenderId}`);
    },
    [router]
  );

  const handleEditTender = useCallback(
    (tenderId: string) => {
      // Navigate to tender edit page
      router.push(`/tenders/${tenderId}/edit`);
    },
    [router]
  );

  const handleDeleteTender = useCallback(
    async (tenderId: string) => {
      if (!confirm('Are you sure you want to delete this tender?')) {
        return;
      }
      try {
        setLoading(true);
        const result = await deleteTender(organizationId, tenderId);
        if (result.success) {
          toast.success('Tender deleted successfully');
          // Refresh list by re-fetching overview
          const refreshResult = await getTendersOverview(
            organizationId,
            filters,
            currentPage,
            20
          );
          if (refreshResult.success) {
            setTenders(refreshResult.tenders);
            setTotalCount(refreshResult.totalCount);
            setTotalPages(refreshResult.totalPages);
          }
        } else {
          toast.error(result.error || 'Failed to delete tender');
        }
      } catch (error) {
        console.error('Error deleting tender:', error);
        toast.error('An error occurred while deleting the tender');
      } finally {
        setLoading(false);
      }
    },
    [organizationId, filters, currentPage]
  );

  const handleRowClick = useCallback(
    (tenderId: string) => {
      // Navigate to tender detail page on row click
      router.push(`/tenders/${tenderId}`);
    },
    [router]
  );

  return (
    <div className="space-y-4 ">
      <TendersSearchFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        clients={clients}
      />

      <TendersTable
        tenders={tenders}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onViewTender={handleViewTender}
        onEditTender={handleEditTender}
        onDeleteTender={handleDeleteTender}
      />

      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
