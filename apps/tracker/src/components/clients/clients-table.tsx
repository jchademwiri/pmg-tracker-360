'use client';

import Link from 'next/link';
import { Button } from '@pmg/ui/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@pmg/ui/components/ui/table';

interface Client {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: Date;
}

interface ClientsTableProps {
  clients: Client[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export function ClientsTable({ clients, totalCount, currentPage, totalPages }: ClientsTableProps) {
  if (clients.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center">
        <p className="text-muted-foreground">No clients found.</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/clients/create">Add your first client</Link>
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
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.contactName ?? '—'}</TableCell>
                <TableCell>{client.contactEmail ?? '—'}</TableCell>
                <TableCell>{client.contactPhone ?? '—'}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/clients/${client.id}`}>View</Link>
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
