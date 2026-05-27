'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  Building,
  Calendar,
  Truck,
  Package,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  deletePurchaseOrder,
  updatePurchaseOrderStatus,
} from '@/server/purchase-orders';

interface PurchaseOrderWithProject {
  id: string;
  poNumber: string;
  supplierName: string | null;
  description: string;
  totalAmount: string;
  status: string;
  poDate: Date | null;
  expectedDeliveryDate: Date | null;
  deliveredAt: Date | null;
  deliveryAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
  project: {
    id: string;
    projectNumber: string;
    description: string | null;
  } | null;
}

interface PODetailsProps {
  po: PurchaseOrderWithProject;
  organizationId: string;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
};

const statusLabels = {
  draft: 'Draft',
  sent: 'Sent',
  delivered: 'Delivered',
};

export function PODetails({ po, organizationId }: PODetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleEdit = () => {
    router.push(`/dashboard/projects/purchase-orders/${po.id}/edit`);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        'Are you sure you want to delete this purchase order? This action cannot be undone.'
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deletePurchaseOrder(organizationId, po.id);
      if (result.success) {
        router.push('/dashboard/projects/purchase-orders');
        router.refresh();
      } else {
        alert(result.error || 'Failed to delete purchase order');
      }
    });
  };

  const handleStatusUpdate = async (
    newStatus: 'draft' | 'sent' | 'delivered'
  ) => {
    startTransition(async () => {
      const result = await updatePurchaseOrderStatus(organizationId, po.id, {
        status: newStatus,
      });
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || 'Failed to update purchase order status');
      }
    });
  };

  const handleBack = () => {
    router.push('/dashboard/projects/purchase-orders');
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Not set';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatValue = (value: string | null) => {
    if (!value) return 'Not set';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(numValue);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Purchase Orders
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <h1 className="text-xl text-foreground/80 font-bold">
            {po.poNumber}
          </h1>

          <Button
            variant="outline"
            onClick={handleEdit}
            className="cursor-pointer"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit PO
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="cursor-pointer">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <Edit className="h-4 w-4 mr-2" />
                Edit Purchase Order
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600 cursor-pointer"
                disabled={isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Purchase Order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Main Information */}
        <div className="xl:col-span-3 space-y-6">
          {/* Basic Information */}
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                Purchase Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    PO Number
                  </label>
                  <p className="text-lg font-medium text-blue-600">
                    {po.poNumber}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Status
                  </label>
                  <div className="mt-1">
                    <Badge
                      className={
                        statusColors[po.status as keyof typeof statusColors]
                      }
                    >
                      {statusLabels[po.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Supplier Name
                  </label>
                  <p className="text-lg font-medium">
                    {po.supplierName || 'Not specified'}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Total Amount
                  </label>
                  <p className="text-lg font-medium">
                    {formatValue(po.totalAmount)}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="text-foreground whitespace-pre-wrap">
                  {po.description}
                </p>
              </div>

              {po.deliveryAddress && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Delivery Address
                  </label>
                  <p className="text-foreground whitespace-pre-wrap">
                    {po.deliveryAddress}
                  </p>
                </div>
              )}

              {!po.deliveryAddress && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Delivery Address
                  </label>
                  <p className="text-muted-foreground italic">
                    No delivery address added
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Information */}
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Building className="h-5 w-5 mr-2 text-green-600" />
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Project Number
                  </label>
                  <p className="text-lg font-medium text-blue-600">
                    {po.project?.projectNumber.toUpperCase() ||
                      'Unknown Project'}
                  </p>
                </div>

                {po.project?.description && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Project Description
                    </label>
                    <p className="text-foreground">{po.project.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start cursor-pointer"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Purchase Order
              </Button>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card className="rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground mb-3">
                Current Status:{' '}
                <span className="font-medium">
                  {statusLabels[po.status as keyof typeof statusLabels]}
                </span>
              </div>

              {po.status !== 'sent' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start cursor-pointer"
                  onClick={() => handleStatusUpdate('sent')}
                  disabled={isPending}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Mark as Sent
                </Button>
              )}

              {po.status !== 'delivered' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start cursor-pointer"
                  onClick={() => handleStatusUpdate('delivered')}
                  disabled={isPending}
                >
                  <Package className="h-4 w-4 mr-2" />
                  Mark as Delivered
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Created
                </label>
                <p className="text-sm">{formatDate(po.createdAt)}</p>
              </div>
              {po.poDate && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    PO Date
                  </label>
                  <p className="text-sm">{formatDate(po.poDate)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </label>
                <p className="text-sm">{formatDate(po.updatedAt)}</p>
              </div>
              {po.expectedDeliveryDate && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Expected Delivery
                  </label>
                  <p className="text-sm">
                    {formatDate(po.expectedDeliveryDate)}
                  </p>
                </div>
              )}
              {po.deliveredAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Delivered At
                  </label>
                  <p className="text-sm">{formatDate(po.deliveredAt)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
