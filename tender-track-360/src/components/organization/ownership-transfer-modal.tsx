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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserX } from 'lucide-react';

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
}

interface OwnershipTransferRequest {
  organizationId: string;
  newOwnerId: string;
  reason?: string;
  transferMessage?: string;
}

interface OwnershipTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  eligibleMembers: Member[];
  onTransfer: (request: OwnershipTransferRequest) => Promise<void>;
}

export function OwnershipTransferModal({
  isOpen,
  onClose,
  organizationId,
  eligibleMembers,
  onTransfer,
}: OwnershipTransferModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = async () => {
    if (!selectedMemberId) return;

    setIsLoading(true);
    try {
      await onTransfer({
        organizationId,
        newOwnerId: selectedMemberId,
        reason: reason.trim() || undefined,
      });
      onClose();
      setSelectedMemberId('');
      setReason('');
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5" />
            Transfer Ownership
          </DialogTitle>
          <DialogDescription>
            Transfer ownership of this organization to another member. You will
            become an admin after the transfer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-select">Select New Owner</Label>
            <Select
              value={selectedMemberId}
              onValueChange={setSelectedMemberId}
            >
              <SelectTrigger className="w-full h-auto flex items-center p-3 text-left">
                <SelectValue placeholder="Select Member">
                  {selectedMemberId ? (
                    (() => {
                      const member = eligibleMembers.find(
                        (m) => m.userId === selectedMemberId
                      );
                      return member ? (
                        <div className="flex flex-col text-left">
                          <span className="text-xs text-muted-foreground">
                            {member.email} - {member.name}
                          </span>
                        </div>
                      ) : (
                        'Select Member'
                      );
                    })()
                  ) : (
                    <span className="text-muted-foreground">Select Member</span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {eligibleMembers.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    <div className="flex flex-col text-left">
                      <span className="text-xs text-muted-foreground">
                        {member.email} - {member.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Input
              id="reason"
              placeholder="Why are you transferring ownership?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedMemberId || isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Transferring...' : 'Transfer Ownership'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
