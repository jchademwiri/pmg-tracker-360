'use client';

import Link from 'next/link';
import { Badge } from '@pmg/ui/components/ui/badge';
import { Button } from '@pmg/ui/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@pmg/ui/components/ui/table';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  submitted: 'default',
  won: 'default',
  lost: 'destructive',
  pending: 'outline',
};

interface Tender {
  id: string;
  tenderNumber: string;
  description: string | null;
  status: string;
  submissionDate: Date | null;
  value: string | null;
  client: { id: string; name: string } | null;
}

interface TendersTableProps {
  tenders: Tender[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  onViewTender?: (id: string) => void;
  onEditTender?: (id: string) => void;
  onDeleteTender?: (id: string) => void;
  onRowClick?: (id: string) => void;
}

export function TendersTable({ tenders, totalCount, currentPage, totalPages, onPageChange, onViewTender, onRowClick }: TendersTableProps) {
  if (tenders.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <p className="text-muted-foreground">No tenders found.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/tenders/create">Create your first tender</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tender #</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Submission Date</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenders.map((tender) => (
              <TableRow key={tender.id}>
                <TableCell className="font-medium">{tender.tenderNumber}</TableCell>
                <TableCell className="max-w-[200px] truncate text-muted-foreground">{tender.description ?? '—'}</TableCell>
                <TableCell>{tender.client?.name ?? '—'}</TableCell>
                <TableCell>{tender.submissionDate ? new Date(tender.submissionDate).toLocaleDateString('en-ZA') : '—'}</TableCell>
                <TableCell>{tender.value ? `R ${parseFloat(tender.value).toLocaleString('en-ZA')}` : '—'}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[tender.status] ?? 'secondary'} className="capitalize">
                    {tender.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/tenders/${tender.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{totalCount} total</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      )}
    </div>
  );
}
