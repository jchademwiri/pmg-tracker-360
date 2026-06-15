'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileUploader } from '@/components/ui/file-uploader';
import { recordPODelivery } from '@/server/purchase-orders';
import { uploadDocument } from '@/server/documents';
import { formatCurrency, formatDate } from '@/lib/format';

interface LineItem {
  id: string;
  description: string;
  unit?: string;
  quantity: string;
  unitPrice: string;
}

interface DeliveryItem {
  lineItemId: string;
  quantityDelivered: string;
}

interface DeliveryNote {
  items: DeliveryItem[];
}

interface DeliveryNoteFormProps {
  organizationId: string;
  po: {
    id: string;
    poNumber: string;
    supplierName: string | null;
    expectedDeliveryDate: Date | null;
    deliveryAddress: string | null;
    project: {
      id: string;
      projectNumber: string;
      description: string | null;
    } | null;
    lineItems: LineItem[];
    deliveryNotes: DeliveryNote[];
  };
}

export function DeliveryNoteForm({ organizationId, po }: DeliveryNoteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deliveryNoteNumber, setDeliveryNoteNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [receivedAt, setReceivedAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [deliveredQuantities, setDeliveredQuantities] = useState<Record<string, string>>({});

  const itemRows = useMemo(
    () =>
      po.lineItems.map((item) => {
        const orderedQuantity = parseFloat(item.quantity) || 0;
        const previouslyDelivered = po.deliveryNotes.reduce((sum, note) => {
          const deliveredItem = note.items?.find((di) => di.lineItemId === item.id);
          return sum + (deliveredItem ? parseFloat(deliveredItem.quantityDelivered) || 0 : 0);
        }, 0);
        const outstandingQuantity = Math.max(0, orderedQuantity - previouslyDelivered);
        const deliveredQuantity = parseFloat(deliveredQuantities[item.id] || '0') || 0;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        const deliveryValue = deliveredQuantity * unitPrice;

        return {
          ...item,
          orderedQuantity,
          previouslyDelivered,
          outstandingQuantity,
          deliveredQuantity,
          deliveryValue,
        };
      }),
    [po.deliveryNotes, po.lineItems, deliveredQuantities]
  );

  const quantityErrors = useMemo(() => {
    const errors: Record<string, string> = {};

    for (const item of itemRows) {
      const raw = deliveredQuantities[item.id];
      if (!raw) continue;
      const deliveredQuantity = parseFloat(raw);

      if (Number.isNaN(deliveredQuantity)) {
        errors[item.id] = 'Enter a valid quantity';
      } else if (deliveredQuantity < 0) {
        errors[item.id] = 'Quantity cannot be negative';
      } else if (deliveredQuantity > item.outstandingQuantity) {
        errors[item.id] = `Cannot exceed ${item.outstandingQuantity}`;
      }
    }

    return errors;
  }, [deliveredQuantities, itemRows]);

  const totalDeliveredQuantity = itemRows.reduce((sum, item) => sum + item.deliveredQuantity, 0);
  const totalDeliveryValue = itemRows.reduce((sum, item) => sum + item.deliveryValue, 0);

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        let podFileUrl = '';

        if (uploadFiles.length > 0) {
          const formData = new FormData();
          formData.append('file', uploadFiles[0]);
          const uploadResult = await uploadDocument(organizationId, formData, {
            purchaseOrderId: po.id,
          });

          if (!uploadResult.success || !uploadResult.document) {
            alert(uploadResult.error || 'Failed to upload Proof of Delivery file');
            return;
          }

          podFileUrl = uploadResult.document.url;
        }

        const result = await recordPODelivery(organizationId, po.id, {
          deliveryNoteNumber,
          recipientName,
          receivedAt: new Date(receivedAt),
          notes: notes || undefined,
          podFileUrl: podFileUrl || undefined,
          items: itemRows
            .filter((item) => item.deliveredQuantity > 0)
            .map((item) => ({
              lineItemId: item.id,
              quantityDelivered: item.deliveredQuantity.toString(),
            })),
        });

        if (result.success) {
          router.push(`/projects/purchase-orders/${po.id}`);
          router.refresh();
        } else {
          alert(result.error || 'Failed to record delivery note');
        }
      } catch (error) {
        console.error('Error recording delivery note:', error);
        alert('An unexpected error occurred while saving the delivery note');
      }
    });
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="text-left sm:text-right">
          <h1 className="text-2xl font-bold">Record Delivery Note</h1>
          <p className="text-sm text-muted-foreground">PO {po.poNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <div className="space-y-6 xl:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Truck className="mr-2 h-5 w-5 text-indigo-600" />
                Delivery Note Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="delivery-note-number">Delivery Note Number *</Label>
                  <Input
                    id="delivery-note-number"
                    value={deliveryNoteNumber}
                    onChange={(event) => setDeliveryNoteNumber(event.target.value)}
                    placeholder="DN-10023"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipient-name">Recipient Name *</Label>
                  <Input
                    id="recipient-name"
                    value={recipientName}
                    onChange={(event) => setRecipientName(event.target.value)}
                    placeholder="Received by"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="received-at">Date Received *</Label>
                  <Input
                    id="received-at"
                    type="date"
                    value={receivedAt}
                    onChange={(event) => setReceivedAt(event.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Proof of Delivery Photo/PDF</Label>
                  <FileUploader value={uploadFiles} onValueChange={setUploadFiles} maxFiles={1} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-notes">Notes</Label>
                  <Textarea
                    id="delivery-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    placeholder="Delivery notes or remarks"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Delivered Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Item</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead className="text-right">Ordered Quantity</TableHead>
                      <TableHead className="text-right">Delivered</TableHead>
                      <TableHead className="text-right">Outstanding</TableHead>
                      <TableHead className="text-right">Delivered Quantity</TableHead>
                      <TableHead className="text-right">Delivery Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itemRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                          No PO line items are available for delivery.
                        </TableCell>
                      </TableRow>
                    ) : (
                      itemRows.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="pl-6 font-medium">{item.description}</TableCell>
                          <TableCell>{item.unit || 'unit'}</TableCell>
                          <TableCell className="text-right">{item.orderedQuantity}</TableCell>
                          <TableCell className="text-right text-emerald-600">{item.previouslyDelivered}</TableCell>
                          <TableCell className="text-right">{item.outstandingQuantity}</TableCell>
                          <TableCell className="min-w-36 text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={deliveredQuantities[item.id] || ''}
                              disabled={item.outstandingQuantity === 0}
                              onChange={(event) =>
                                setDeliveredQuantities((prev) => ({
                                  ...prev,
                                  [item.id]: event.target.value,
                                }))
                              }
                              className={quantityErrors[item.id] ? 'border-red-500 text-right' : 'text-right'}
                              placeholder="0.00"
                            />
                            {quantityErrors[item.id] && (
                              <p className="mt-1 text-xs text-red-500">{quantityErrors[item.id]}</p>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(item.deliveryValue)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Related Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Project</p>
                <p className="font-semibold">{po.project?.projectNumber.toUpperCase() || 'Unknown Project'}</p>
                {po.project?.description && <p className="mt-1 text-muted-foreground">{po.project.description}</p>}
              </div>
              <div>
                <p className="text-muted-foreground">Purchase Order</p>
                <p className="font-semibold">{po.poNumber}</p>
                {po.supplierName && <p className="mt-1 text-muted-foreground">{po.supplierName}</p>}
              </div>
              {po.expectedDeliveryDate && (
                <div>
                  <p className="text-muted-foreground">Expected Delivery</p>
                  <p className="font-semibold">{formatDate(po.expectedDeliveryDate)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Delivery Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivered quantity</span>
                <span className="font-semibold">{totalDeliveredQuantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery value</span>
                <span className="font-semibold">{formatCurrency(totalDeliveryValue)}</span>
              </div>
              <Button
                className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={handleSubmit}
                disabled={
                  isPending ||
                  deliveryNoteNumber.trim() === '' ||
                  recipientName.trim() === '' ||
                  totalDeliveredQuantity <= 0 ||
                  Object.keys(quantityErrors).length > 0
                }
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Save Delivery Note
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
