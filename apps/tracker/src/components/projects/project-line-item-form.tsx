'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, PackagePlus, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createProjectLineItem, updateProjectLineItem } from '@/server/purchase-orders';

interface ProjectLineItemFormProps {
  organizationId: string;
  project: {
    id: string;
    projectNumber: string;
    description: string | null;
  };
  mode: 'create' | 'edit';
  lineItem?: {
    id: string;
    itemNumber: string;
    sapReference: string | null;
    description: string;
    unit: string;
    unitPrice: string;
    usageCount?: number;
  };
}

export function ProjectLineItemForm({
  organizationId,
  project,
  mode,
  lineItem,
}: ProjectLineItemFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [itemNumber, setItemNumber] = useState(lineItem?.itemNumber || '');
  const [sapReference, setSapReference] = useState(lineItem?.sapReference || '');
  const [description, setDescription] = useState(lineItem?.description || '');
  const [unit, setUnit] = useState(lineItem?.unit || 'unit');
  const [unitPrice, setUnitPrice] = useState(lineItem?.unitPrice || '0.00');

  const handleSubmit = () => {
    startTransition(async () => {
      const payload = { projectId: project.id, itemNumber, sapReference, description, unit, unitPrice };
      const result =
        mode === 'edit' && lineItem
          ? await updateProjectLineItem(organizationId, project.id, lineItem.id, payload)
          : await createProjectLineItem(organizationId, payload);

      if (result.success) {
        toast.success(mode === 'edit' ? 'Project item updated' : 'Project item created');
        router.push(`/projects/${project.id}/items`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to save project item');
      }
    });
  };

  const unitPriceNumber = parseFloat(unitPrice) || 0;
  const canSubmit =
    itemNumber.trim().length > 0 &&
    description.trim().length > 0 &&
    unit.trim().length > 0 &&
    unitPrice.trim().length > 0 &&
    !Number.isNaN(unitPriceNumber) &&
    unitPriceNumber >= 0;

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="text-left sm:text-right">
          <h1 className="text-2xl font-bold">
            {mode === 'edit' ? 'Edit Project Item' : 'Add Project Item'}
          </h1>
          <p className="text-sm text-muted-foreground">{project.projectNumber.toUpperCase()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <PackagePlus className="mr-2 h-5 w-5 text-indigo-600" />
              Saved Item Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="item-number">Item Number *</Label>
                <Input
                  id="item-number"
                  value={itemNumber}
                  onChange={(event) => setItemNumber(event.target.value.toUpperCase())}
                  placeholder="ITEM-001"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sap-reference">SAP Reference</Label>
                <Input
                  id="sap-reference"
                  value={sapReference}
                  onChange={(event) => setSapReference(event.target.value)}
                  placeholder="Optional SAP code"
                  disabled={isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Cables, installation, hardware kit"
                rows={3}
                disabled={isPending}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit *</Label>
                <Input
                  id="unit"
                  value={unit}
                  onChange={(event) => setUnit(event.target.value)}
                  placeholder="unit, hour, meter, kit"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-price">Unit Price / Rate *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    R
                  </span>
                  <Input
                    id="unit-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={(event) => setUnitPrice(event.target.value)}
                    className="pl-8"
                    placeholder="0.00"
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Link</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Project</p>
              <p className="font-semibold">{project.projectNumber.toUpperCase()}</p>
              {project.description && <p className="mt-1 text-muted-foreground">{project.description}</p>}
            </div>
            {mode === 'edit' && (
              <div>
                <p className="text-muted-foreground">Used on PO lines</p>
                <p className="font-semibold">{lineItem?.usageCount || 0}</p>
              </div>
            )}
            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isPending || !canSubmit}
            >
              <Save className="mr-2 h-4 w-4" />
              {isPending ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Item'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
