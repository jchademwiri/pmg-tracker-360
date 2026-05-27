'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Download,
  Trash2,
  Clock,
  FileText,
  Database,
} from 'lucide-react';
import type { DeletionConfirmation } from '@/lib/organization-deletion';

interface OrganizationDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: {
    id: string;
    name: string;
    memberCount: number;
    tenderCount: number;
    contractCount: number;
  };
  onConfirm: (confirmation: DeletionConfirmation) => Promise<void>;
}

export function OrganizationDeletionModal({
  isOpen,
  onClose,
  organization,
  onConfirm,
}: OrganizationDeletionModalProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    organizationName: '',
    confirmationPhrase: '',
    deletionType: 'soft' as 'soft' | 'permanent',
    dataExportRequested: false,
    exportFormat: 'json' as 'json' | 'csv',
    reason: '',
  });

  const CONFIRMATION_PHRASE = 'DELETE ORGANIZATION';
  const totalSteps = 3;

  const handleClose = () => {
    if (!isLoading) {
      setStep(1);
      setFormData({
        organizationName: '',
        confirmationPhrase: '',
        deletionType: 'soft',
        dataExportRequested: false,
        exportFormat: 'json',
        reason: '',
      });
      onClose();
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm({
        organizationName: formData.organizationName,
        confirmationPhrase: formData.confirmationPhrase,
        deletionType: formData.deletionType,
        dataExportRequested: formData.dataExportRequested,
        exportFormat: formData.dataExportRequested
          ? formData.exportFormat
          : undefined,
        reason: formData.reason || undefined,
      });
      handleClose();
    } catch (error) {
      console.error('Error confirming deletion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isStep1Valid = formData.organizationName === organization.name;
  const isStep2Valid = formData.confirmationPhrase === CONFIRMATION_PHRASE;
  const canProceed =
    step === 1 ? isStep1Valid : step === 2 ? isStep2Valid : true;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <Trash2 className="h-5 w-5" />
            Delete Organization
          </DialogTitle>
          <DialogDescription>
            Step {step} of {totalSteps}:{' '}
            {step === 1
              ? 'Confirm Organization'
              : step === 2
                ? 'Final Confirmation'
                : 'Deletion Options'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded ${
                  i + 1 <= step ? 'bg-red-500' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Organization Confirmation */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">
                    This action will delete the organization and all associated
                    data
                  </p>
                  <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                    <li>
                      • {organization.memberCount} member
                      {organization.memberCount !== 1 ? 's' : ''} will lose
                      access
                    </li>
                    <li>
                      • {organization.tenderCount} tender
                      {organization.tenderCount !== 1 ? 's' : ''} will be
                      deleted
                    </li>
                    <li>
                      • {organization.contractCount} contract
                      {organization.contractCount !== 1 ? 's' : ''} will be
                      deleted
                    </li>
                    <li>• All settings and configurations will be lost</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orgName">
                  Type the organization name to confirm:{' '}
                  <strong>{organization.name}</strong>
                </Label>
                <Input
                  id="orgName"
                  value={formData.organizationName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      organizationName: e.target.value,
                    })
                  }
                  placeholder={organization.name}
                  className={isStep1Valid ? 'border-green-500' : ''}
                />
              </div>
            </div>
          )}

          {/* Step 2: Final Confirmation */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                    Final confirmation required
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    This is your last chance to cancel. Once confirmed, the
                    deletion process will begin immediately.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPhrase">
                  Type <strong>{CONFIRMATION_PHRASE}</strong> to confirm
                  deletion:
                </Label>
                <Input
                  id="confirmPhrase"
                  value={formData.confirmationPhrase}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmationPhrase: e.target.value,
                    })
                  }
                  placeholder={CONFIRMATION_PHRASE}
                  className={isStep2Valid ? 'border-green-500' : ''}
                />
              </div>
            </div>
          )}

          {/* Step 3: Deletion Options */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Deletion Type */}
              <div className="space-y-3">
                <Label>Deletion Type</Label>
                <RadioGroup
                  value={formData.deletionType}
                  onValueChange={(value: string) =>
                    setFormData({
                      ...formData,
                      deletionType: value as 'soft' | 'permanent',
                    })
                  }
                >
                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem value="soft" id="soft" className="mt-1" />
                    <div className="space-y-1">
                      <Label htmlFor="soft" className="flex items-center gap-2">
                        Soft Delete
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          30-day grace period
                        </Badge>
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Organization will be hidden but can be restored within
                        30 days. After 30 days, it will be permanently deleted
                        automatically.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 border rounded-lg border-red-200 dark:border-red-800">
                    <RadioGroupItem
                      value="permanent"
                      id="permanent"
                      className="mt-1"
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor="permanent"
                        className="flex items-center gap-2 text-red-700 dark:text-red-400"
                      >
                        Permanent Delete
                        <Badge variant="destructive" className="text-xs">
                          Immediate
                        </Badge>
                      </Label>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Organization and all data will be permanently deleted
                        immediately. This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Data Export Option */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="export"
                    checked={formData.dataExportRequested}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        dataExportRequested: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="export" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export data before deletion
                  </Label>
                </div>

                {formData.dataExportRequested && (
                  <div className="ml-6 space-y-2">
                    <Label>Export Format</Label>
                    <RadioGroup
                      value={formData.exportFormat}
                      onValueChange={(value: string) =>
                        setFormData({
                          ...formData,
                          exportFormat: value as 'json' | 'csv',
                        })
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="json" id="json" />
                        <Label
                          htmlFor="json"
                          className="flex items-center gap-1"
                        >
                          <Database className="h-3 w-3" />
                          JSON
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="csv" id="csv" />
                        <Label
                          htmlFor="csv"
                          className="flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" />
                          CSV
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>

              {/* Reason (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for deletion (optional)</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Provide a reason for this deletion..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
              >
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            {step < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className="bg-red-600 hover:bg-red-700"
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {formData.deletionType === 'soft'
                      ? 'Soft Delete'
                      : 'Permanently Delete'}
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
