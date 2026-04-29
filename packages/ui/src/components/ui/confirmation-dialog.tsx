"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";

interface ConfirmationDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Legacy aliases used by tracker app
  isOpen?: boolean;
  onClose?: () => void;
  // Extra context props passed by tracker (accepted but not rendered)
  email?: string;
  memberName?: string;
  confirmText?: string;  // alias for confirmLabel
  icon?: string;
  title?: string;
  // Allow any additional props the old app passes
  [key: string]: unknown;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  variant?: "default" | "destructive";
  children?: React.ReactNode;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  isOpen,
  onClose,
  title = "Are you sure?",
  description,
  confirmLabel,
  confirmText,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
}: ConfirmationDialogProps) {
  const resolvedConfirmLabel = confirmLabel ?? confirmText ?? "Confirm";
  // Support both open/onOpenChange and isOpen/onClose patterns
  const isDialogOpen = open ?? isOpen;
  const handleOpenChange = (val: boolean) => {
    onOpenChange?.(val);
    if (!val) onClose?.();
  };
  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onCancel?.();
              handleOpenChange(false);
            }}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={() => {
              onConfirm?.();
              handleOpenChange(false);
            }}
          >
            {resolvedConfirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Named variants used by the tracker app
export function RemoveMemberConfirmationDialog(props: ConfirmationDialogProps) {
  return (
    <ConfirmationDialog
      title="Remove member?"
      description="This member will lose access to the organization."
      confirmLabel="Remove"
      variant="destructive"
      {...props}
    />
  );
}

export function CancelInvitationConfirmationDialog(props: ConfirmationDialogProps) {
  return (
    <ConfirmationDialog
      title="Cancel invitation?"
      description="The invitation link will no longer be valid."
      confirmLabel="Cancel invitation"
      variant="destructive"
      {...props}
    />
  );
}
