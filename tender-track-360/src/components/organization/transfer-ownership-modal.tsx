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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserX, Mail, Shield } from 'lucide-react';
import type { OwnershipTransferRequest } from '@/lib/ownership-transfer';

interface OwnershipTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  eligibleMembers: Array<{
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager';
  }>;
  onTransfer: (request: OwnershipTransferRequest) => Promise<void>;
}

export function OwnershipTransferModal({
  isOpen,
  onClose,
  organizationId,
  eligibleMembers,
  onTransfer,
}: OwnershipTransferModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    newOwnerId: '',
    reason: '',
    transferMessage: '',
  });

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        newOwnerId: '',
        reason: '',
        transferMessage: '',
      });
      onClose();
    }
  };

  const handleTransfer = async () => {
    if (!formData.newOwnerId) return;

    setIsLoading(true);
    try {
      await onTransfer({
        organizationId,
        newOwnerId: formData.newOwnerId,
        reason: formData.reason || undefined,
        transferMessage: formData.transferMessage || undefined,
      });
      handleClose();
    } catch (error) {
      console.error('Error initiating transfer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMember = eligibleMembers.find(
    (m) => m.id === formData.newOwnerId
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Transfer Ownership
          </DialogTitle>
          <DialogDescription>
            Transfer ownership of this organization to another admin or manager.
            You will become an admin after the transfer is completed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member Selection */}
          <div className="space-y-2">
            <Label htmlFor="member">Select New Owner</Label>
            {eligibleMembers.length > 0 ? (
              <Select
                value={formData.newOwnerId}
                onValueChange={(value) =>
                  setFormData({ ...formData, newOwnerId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member to transfer ownership to" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </p>
                        </div>
                        <div className="ml-auto">
                          <div className="flex items-center gap-1 text-xs">
                            <Shield className="h-3 w-3" />
                            {member.role}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="py-6 text-center border rounded-md bg-muted/20 border-dashed">
                <UserX className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">
                  No eligible members found
                </p>
                <p className="text-xs text-muted-foreground mt-1 px-4">
                  Only other admins and managers can receive ownership. Invite a
                  member or upgrade their role first.
                </p>
              </div>
            )}
          </div>

          {/* Transfer Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message to New Owner (optional)</Label>
            <Textarea
              id="message"
              value={formData.transferMessage}
              onChange={(e) =>
                setFormData({ ...formData, transferMessage: e.target.value })
              }
              placeholder="Add a personal message to the new owner..."
              rows={3}
            />
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Transfer (optional)</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="Provide a reason for this ownership transfer..."
              rows={2}
            />
          </div>

          {/* Transfer Preview */}
          {selectedMember && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="text-sm font-medium">Transfer Summary:</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  • <strong>{selectedMember.name}</strong> will become the
                  organization owner
                </p>
                <p>• You will become an admin with reduced permissions</p>
                <p>• The new owner will receive an email notification</p>
                <p>• Transfer can be cancelled before acceptance</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!formData.newOwnerId || isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Initiating Transfer...
              </>
            ) : (
              <>
                <UserX className="h-4 w-4" />
                Initiate Transfer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
