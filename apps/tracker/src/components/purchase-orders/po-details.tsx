'use client';

import { useTransition, useState } from 'react';
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
  Plus,
  FileUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  deletePurchaseOrder,
  updatePurchaseOrderStatus,
  verifyDeliveryNote,
  voidDeliveryNote,
} from '@/server/purchase-orders';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format';
import { MobileActionBar, MobileActionBarSpacer } from '@/components/ui/mobile-action-bar';
import { toast } from 'sonner';
import { DeleteConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { DocumentManager } from '@/components/documents/document-manager';

interface LineItem {
  id: string;
  purchaseOrderId: string;
  itemNumber: string;
  sapReference: string | null;
  description: string;
  quantity: string;
  unitPrice: string;
  subtotal: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DeliveryItem {
  id: string;
  deliveryNoteId: string;
  lineItemId: string;
  quantityDelivered: string;
  unitPrice: string;
  deliveryValue: string;
  lineItem?: LineItem;
}

interface DeliveryNote {
  id: string;
  purchaseOrderId: string;
  deliveryNoteNumber: string;
  recipientName: string;
  receivedAt: Date;
  status: string;
  podFileUrl: string | null;
  notes: string | null;
  createdAt: Date;
  items: DeliveryItem[];
}

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
  lineItems: LineItem[];
  deliveryNotes: DeliveryNote[];
}

interface PODetailsProps {
  po: PurchaseOrderWithProject;
  organizationId: string;
  initialDocuments?: any[];
}

export function PODetails({ po, organizationId, initialDocuments = [] }: PODetailsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleVerifyDelivery = async (noteId: string) => {
    startTransition(async () => {
      const result = await verifyDeliveryNote(organizationId, noteId);
      if (result.success) {
        toast.success('Delivery note verified successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to verify delivery note');
      }
    });
  };

  const handleVoidDelivery = async (noteId: string) => {
    startTransition(async () => {
      const result = await voidDeliveryNote(organizationId, noteId);
      if (result.success) {
        toast.success('Delivery note voided successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to void delivery note');
      }
    });
  };

  const handleEdit = () => {
    router.push(`/projects/purchase-orders/${po.id}/edit`);
  };

  const handleRecordDelivery = () => {
    router.push(`/projects/purchase-orders/${po.id}/deliveries/new`);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    startTransition(async () => {
      const result = await deletePurchaseOrder(organizationId, po.id);
      if (result.success) {
        toast.success('Purchase order deleted successfully');
        setIsDeleteDialogOpen(false);
        router.push('/projects/purchase-orders');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete purchase order');
      }
    });
  };

  const handleStatusUpdate = async (
    newStatus: 'open' | 'sent' | 'partially_delivered' | 'delivered' | 'completed' | 'cancelled' | 'disputed'
  ) => {
    startTransition(async () => {
      const result = await updatePurchaseOrderStatus(organizationId, po.id, {
        status: newStatus,
      });
      if (result.success) {
        toast.success(`Purchase order status updated to ${newStatus}`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update purchase order status');
      }
    });
  };

  const handleBack = () => {
    router.push('/projects/purchase-orders');
  };

  const steps = [
    { label: 'Open', statuses: ['open'] },
    { label: 'Sent', statuses: ['sent'] },
    { label: 'Partially Delivered', statuses: ['partially_delivered'] },
    { label: 'Completed', statuses: ['delivered', 'completed'] },
  ];
  const activeIndex = steps.findIndex((s) => s.statuses.includes(po.status));
  const isSpecialStatus = ['cancelled', 'disputed'].includes(po.status);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl text-foreground/80 font-bold mr-2 hidden md:block">
            {po.poNumber}
          </h1>

          <Button
            variant="default"
            onClick={handleRecordDelivery}
            className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Truck className="h-4 w-4 mr-2" />
            Record Delivery
          </Button>

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

      {/* PO Lifecycle Strip */}
      <Card className="p-6 bg-card rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-sm text-muted-foreground">Purchase Order Status</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold tracking-tight">{po.poNumber}</span>
                <StatusBadge status={po.status} domain="purchaseOrder" />
              </div>
            </div>
          </div>
          
          {!isSpecialStatus && (
            <div className="flex-1 max-w-2xl">
              <div className="relative flex items-center justify-between w-full">
                {/* Background Line */}
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-muted -translate-y-1/2 -z-10" />
                
                {/* Active Progress Line */}
                <div 
                  className="absolute left-0 top-1/2 h-0.5 bg-primary -translate-y-1/2 -z-10 transition-all duration-500" 
                  style={{ width: `${activeIndex >= 0 ? (activeIndex / (steps.length - 1)) * 100 : 0}%` }}
                />
                
                {steps.map((step, idx) => {
                  const isCompleted = idx <= activeIndex;
                  const isActive = idx === activeIndex;
                  
                  return (
                    <div key={step.label} className="flex flex-col items-center">
                      <div 
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                          isActive 
                            ? 'bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110' 
                            : isCompleted 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground border'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span 
                        className={`text-xs mt-2 font-medium hidden sm:inline ${
                          isActive 
                            ? 'text-foreground font-semibold' 
                            : 'text-muted-foreground'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="overview" className="px-4 py-2 text-sm font-medium">Overview</TabsTrigger>
          <TabsTrigger value="deliveries" className="px-4 py-2 text-sm font-medium flex items-center gap-1.5">
            <Truck className="h-4 w-4" />
            Deliveries
            {po.deliveryNotes?.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-indigo-500 text-white rounded-full font-bold">
                {po.deliveryNotes.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="documents" className="px-4 py-2 text-sm font-medium">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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
                        <StatusBadge status={po.status} />
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

                    <div className="space-y-2 p-4 bg-muted/40 rounded-lg border border-border/50">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">VAT Exclusive Total:</span>
                        <span className="font-semibold text-foreground">{formatCurrency(po.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">VAT (15%):</span>
                        <span className="font-semibold text-foreground">
                          {formatCurrency((parseFloat(po.totalAmount) || 0) * 0.15)}
                        </span>
                      </div>
                      <div className="flex justify-between text-base font-bold border-t pt-2 mt-1">
                        <span className="text-indigo-600">Total (VAT Inclusive):</span>
                        <span className="text-foreground text-lg">
                          {formatCurrency((parseFloat(po.totalAmount) || 0) * 1.15)}
                        </span>
                      </div>
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

              {/* Item Fulfillment Tracking Grid */}
              <Card className="rounded-lg shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Package className="h-5 w-5 mr-2 text-indigo-600" />
                    Item Fulfillment Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6 w-[10%]">Item #</TableHead>
                          <TableHead className="w-[25%]">Description</TableHead>
                          <TableHead className="w-[12%] text-right">Ordered</TableHead>
                          <TableHead className="w-[12%] text-right">Delivered</TableHead>
                          <TableHead className="w-[12%] text-right">Outstanding</TableHead>
                          <TableHead className="w-[14%] text-right">Unit Price</TableHead>
                          <TableHead className="pr-6 w-[15%]">Progress</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(!po.lineItems || po.lineItems.length === 0) ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground italic">
                              No line items associated with this purchase order.
                            </TableCell>
                          </TableRow>
                        ) : (
                          po.lineItems.map((item) => {
                            const ordered = parseFloat(item.quantity) || 0;
                            const delivered = po.deliveryNotes?.reduce((sum, note) => {
                              const dItem = note.items?.find((di) => di.lineItemId === item.id);
                              return sum + (dItem ? parseFloat(dItem.quantityDelivered) || 0 : 0);
                            }, 0) || 0;
                            const outstanding = Math.max(0, ordered - delivered);
                            const percentage = ordered > 0 ? Math.min(100, (delivered / ordered) * 100) : 0;
                            
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="pl-6 font-semibold text-blue-600">{item.itemNumber}</TableCell>
                                <TableCell className="font-medium">{item.description}</TableCell>
                                <TableCell className="text-right font-medium">{ordered}</TableCell>
                                <TableCell className="text-right text-emerald-600 font-semibold">{delivered}</TableCell>
                                <TableCell className={`text-right font-semibold ${outstanding > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>{outstanding}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                <TableCell className="pr-6">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-secondary h-2.5 rounded-full overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all duration-300 ${percentage >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-semibold text-muted-foreground w-8 text-right">
                                      {Math.round(percentage)}%
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
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
                    variant="default"
                    className="w-full justify-start cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleRecordDelivery}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Record Delivery Note
                  </Button>
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
                    <StatusBadge status={po.status} />
                  </div>

                  {po.status === 'open' && (
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

                  {po.status === 'sent' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start cursor-pointer"
                      onClick={() => handleStatusUpdate('partially_delivered')}
                      disabled={isPending}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Mark as Partially Delivered
                    </Button>
                  )}

                  {(po.status === 'sent' || po.status === 'partially_delivered') && (
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

                  {po.status === 'delivered' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start cursor-pointer"
                      onClick={() => handleStatusUpdate('completed')}
                      disabled={isPending}
                    >
                      Mark as Completed
                    </Button>
                  )}

                  {po.status !== 'cancelled' && po.status !== 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start cursor-pointer text-destructive hover:text-destructive"
                      onClick={() => handleStatusUpdate('cancelled')}
                      disabled={isPending}
                    >
                      Mark as Cancelled
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
                    <p className="text-sm">{formatDateWithTime(po.createdAt)}</p>
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
                    <p className="text-sm">{formatDateWithTime(po.updatedAt)}</p>
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
                      <p className="text-sm">{formatDateWithTime(po.deliveredAt)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Deliveries Stack */}
            <div className="xl:col-span-3 space-y-6">
              {(!po.deliveryNotes || po.deliveryNotes.length === 0) ? (
                <Card className="rounded-lg shadow-sm border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Truck className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="font-semibold text-lg mb-1">No deliveries recorded</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                      No delivery notes have been logged for this purchase order yet.
                    </p>
                    <Button
                      onClick={handleRecordDelivery}
                      className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Record First Delivery
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {po.deliveryNotes.map((note) => (
                    <Card key={note.id} className="rounded-lg shadow-sm border overflow-hidden">
                      <CardHeader className="bg-muted/30 pb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base text-foreground">DN Number: {note.deliveryNoteNumber}</span>
                              <StatusBadge status={note.status} domain="delivery" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Received by <strong className="text-foreground">{note.recipientName}</strong> on {formatDate(note.receivedAt)}
                            </p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 items-center">
                            {note.status === 'received' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVerifyDelivery(note.id)}
                                  disabled={isPending}
                                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200"
                                >
                                  Verify
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleVoidDelivery(note.id)}
                                  disabled={isPending}
                                  className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                                >
                                  Void
                                </Button>
                              </>
                            )}

                            {note.podFileUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="cursor-pointer bg-background"
                              >
                                <a href={note.podFileUrl} target="_blank" rel="noopener noreferrer">
                                  <FileUp className="h-4 w-4 mr-2 text-indigo-500" />
                                  View POD File
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        {note.notes && (
                          <div>
                            <span className="text-xs font-semibold text-muted-foreground block mb-1">Notes / Remarks</span>
                            <p className="text-sm italic text-foreground bg-accent/30 p-2.5 rounded border border-accent">
                              {note.notes}
                            </p>
                          </div>
                        )}

                        <div>
                          <span className="text-xs font-semibold text-muted-foreground block mb-2">Items Received</span>
                          <div className="border rounded-lg overflow-hidden max-w-xl">
                            <Table>
                              <TableHeader className="bg-muted/10">
                                <TableRow>
                                  <TableHead className="pl-4 py-2">Item #</TableHead>
                                  <TableHead className="py-2">Description</TableHead>
                                  <TableHead className="py-2 text-right">Quantity Received</TableHead>
                                  <TableHead className="pr-4 py-2 text-right">Delivery Value</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {note.items?.map((item) => (
                                  <TableRow key={item.id}>
                                    <TableCell className="pl-4 py-2 font-semibold text-blue-600">{item.lineItem?.itemNumber || '-'}</TableCell>
                                    <TableCell className="py-2 font-medium">{item.lineItem?.description || 'Unknown Item'}</TableCell>
                                    <TableCell className="py-2 text-right font-bold text-emerald-600">{item.quantityDelivered}</TableCell>
                                    <TableCell className="pr-4 py-2 text-right font-semibold">
                                      {formatCurrency(item.deliveryValue || 0)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar duplication for layout consistency across tabs */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="rounded-lg shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="default"
                    className="w-full justify-start cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={handleRecordDelivery}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Record Delivery Note
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <DocumentManager
            organizationId={organizationId}
            entityId={po.id}
            entityType="purchase_order"
            initialDocuments={initialDocuments}
          />
        </TabsContent>
      </Tabs>

      {/* Mobile Sticky Action Bar */}
      <MobileActionBar
        actions={[
          { label: 'Record Delivery', onClick: handleRecordDelivery, variant: 'default' },
          { label: 'Edit PO', onClick: handleEdit },
        ]}
      />
      <MobileActionBarSpacer />

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={po.poNumber}
        itemType="Purchase Order"
      />
    </div>
  );
}
