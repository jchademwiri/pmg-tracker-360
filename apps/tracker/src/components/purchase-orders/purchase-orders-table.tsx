'use client';

import Link from 'next/link';
import { Badge } from '@pmg/ui/components/ui/badge';
import { Button } from '@pmg/ui/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@pmg/ui/components/ui/table';

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  sent: 'default',
  delivered: 'outline',
};

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string | null;
  description: string;
  totalAmount: string;
  status: string;
  poDate: Date | null;
  expectedDeliveryDate: Date | null;
  project: { id: string; projectNumber: string; description: string | null } | null;
}

interface PurchaseOrdersTableProps {
  purchaseOrders: PurchaseOrder[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export function PurchaseOrdersTable({ purchaseOrders, totalCount, currentPage, totalPages }: PurchaseOrdersTableProps) {
  if (purchaseOrders.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <p className="text-muted-foreground">No purchase orders found.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/purchase-orders/create">Create your first PO</Link>
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
              <TableHead>PO #</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>PO Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchaseOrders.map((po) => (
              <TableRow key={po.id}>
                <TableCell className="font-medium">{po.poNumber}</TableCell>
                <TableCell>{po.supplierName ?? '—'}</TableCell>
                <TableCell>{po.project?.projectNumber ?? '—'}</TableCell>
                <TableCell>R {parseFloat(po.totalAmount).toLocaleString('en-ZA')}</TableCell>
                <TableCell>{po.poDate ? new Date(po.poDate).toLocaleDateString('en-ZA') : '—'}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[po.status] ?? 'secondary'} className="capitalize">
                    {po.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/purchase-orders/${po.id}`}>View</Link>
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
