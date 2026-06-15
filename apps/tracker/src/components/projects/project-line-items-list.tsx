'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { Archive, Edit, Package, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { archiveProjectLineItem } from '@/server/purchase-orders';
import { formatCurrency } from '@/lib/format';

interface ProjectLineItem {
  id: string;
  itemNumber: string;
  sapReference: string | null;
  description: string;
  unit: string;
  unitPrice: string;
  usageCount: number;
  updatedAt: Date;
}

interface ProjectLineItemsListProps {
  organizationId: string;
  project: {
    id: string;
    projectNumber: string;
    description: string | null;
  };
  lineItems: ProjectLineItem[];
}

export function ProjectLineItemsList({
  organizationId,
  project,
  lineItems,
}: ProjectLineItemsListProps) {
  const [search, setSearch] = useState('');
  const [archiveItem, setArchiveItem] = useState<ProjectLineItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return lineItems;

    return lineItems.filter((item) => {
      return (
        item.description.toLowerCase().includes(term) ||
        item.itemNumber.toLowerCase().includes(term) ||
        (item.sapReference?.toLowerCase().includes(term) ?? false) ||
        item.unit.toLowerCase().includes(term)
      );
    });
  }, [lineItems, search]);

  const handleArchive = () => {
    if (!archiveItem) return;

    startTransition(async () => {
      const result = await archiveProjectLineItem(
        organizationId,
        project.id,
        archiveItem.id
      );

      if (result.success) {
        toast.success('Project item archived');
        setArchiveItem(null);
      } else {
        toast.error(result.error || 'Failed to archive project item');
      }
    });
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Project Items</p>
          <h1 className="text-3xl font-bold tracking-tight">
            {project.projectNumber.toUpperCase()}
          </h1>
          {project.description && (
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        <Button asChild>
          <Link href={`/projects/${project.id}/items/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center text-lg">
            <Package className="mr-2 h-5 w-5 text-indigo-600" />
            Saved Line Items
          </CardTitle>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search item number, SAP, description, or unit"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Item Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>SAP</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Used On PO Lines</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      {lineItems.length === 0
                        ? 'No saved project items yet.'
                        : 'No project items match your search.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-6 font-semibold text-blue-600">{item.itemNumber}</TableCell>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-muted-foreground">{item.sapReference || '-'}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={item.usageCount > 0 ? 'default' : 'outline'}>
                          {item.usageCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/projects/${project.id}/items/${item.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-amber-600 hover:text-amber-700"
                            onClick={() => setArchiveItem(item)}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!archiveItem} onOpenChange={(open) => !open && setArchiveItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Project Item</AlertDialogTitle>
            <AlertDialogDescription>
              Archive "{archiveItem?.description}" so it can no longer be selected on new purchase
              orders. Existing PO lines keep their snapshotted details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive} disabled={isPending}>
              {isPending ? 'Archiving...' : 'Archive Item'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
