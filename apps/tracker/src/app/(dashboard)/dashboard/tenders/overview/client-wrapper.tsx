'use client';

import { useRouter } from 'next/navigation';

import { useState, useCallback } from 'react';
import {
  TendersSearchFilters,
  type TenderFilters,
} from '@/components/tenders/tenders-search-filters';
import { TendersTable } from '@/components/tenders/tenders-table';
import { getTendersOverview } from '@/server/tenders';

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
  clients: Array<{ id: string; name: string }>;
  organizationId: string;
}

export function TendersOverviewClient({
  initialTenders,
  initialTotalCount,
  initialCurrentPage,
  initialTotalPages,
  clients,
  organizationId,
}: TendersOverviewClientProps) {
  const [tenders, setTenders] = useState(initialTenders);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [currentPage, setCurrentPage] = useState(initialCurrentPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<TenderFilters>({
    search: '',
    status: 'all',
    clientId: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const handleFiltersChange = useCallback(
    async (newFilters: TenderFilters) => {
      setFilters(newFilters);
      setLoading(true);

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
    [organizationId]
  );

  const handlePageChange = useCallback(
    async (page: number) => {
      setLoading(true);

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

  const router = useRouter();

  const handleViewTender = useCallback(
    (tenderId: string) => {
      // Navigate to tender detail page
      router.push(`/dashboard/tenders/${tenderId}`);
    },
    [router]
  );

  const handleEditTender = useCallback(
    (tenderId: string) => {
      // Navigate to tender edit page
      router.push(`/dashboard/tenders/${tenderId}/edit`);
    },
    [router]
  );

  const handleDeleteTender = useCallback((tenderId: string) => {
    // TODO: Implement delete functionality
  }, []);

  const handleRowClick = useCallback(
    (tenderId: string) => {
      // Navigate to tender detail page on row click
      router.push(`/dashboard/tenders/${tenderId}`);
    },
    [router]
  );

  return (
    <div className="space-y-4 ">
      <TendersSearchFilters
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
        onRowClick={handleRowClick}
      />

      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
