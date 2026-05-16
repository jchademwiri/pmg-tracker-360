'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { inviteMember } from '@/server/invitations';
import type { Role } from '@/db/schema';
import { handleSuccess } from '@/lib/error-handler';
import { Loader, AlertCircle } from 'lucide-react';

interface InviteMemberModalProps {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface InviteMemberForm {
  email: string;
  role: Role | '';
}

interface FormErrors {
  email?: string;
  role?: string;
  general?: string;
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteMemberModal({
  organizationId,
  isOpen,
  onClose,
  onSuccess,
}: InviteMemberModalProps) {
  const [form, setForm] = useState<InviteMemberForm>({
    email: '',
    role: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setForm({ email: '', role: '' });
      setErrors({});
      setIsLoading(false);
      onClose();
    }
  };

  // Client-side validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Role validation
    if (!form.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await inviteMember(
        organizationId,
        form.email,
        form.role as Role
      );

      if (result.success) {
        handleSuccess('Invitation sent successfully!', {
          description: `An invitation has been sent to ${form.email}`,
        });

        // Reset form and close modal
        setForm({ email: '', role: '' });
        onSuccess();
        onClose();
      } else {
        // Handle server-side errors with enhanced error handling
        const errorCode = result.error?.code;
        const errorMessage =
          result.error?.message || 'Failed to send invitation';

        // Show specific error messages based on error codes
        switch (errorCode) {
          case 'INVALID_EMAIL':
            setErrors({ email: errorMessage });
            break;
          case 'INVALID_ROLE':
            setErrors({ role: errorMessage });
            break;
          case 'ALREADY_MEMBER':
          case 'INVITATION_EXISTS':
            setErrors({ email: errorMessage });
            break;
          case 'INSUFFICIENT_PERMISSIONS':
            setErrors({ general: errorMessage });
            break;
          case 'RATE_LIMIT_EXCEEDED':
            setErrors({
              general:
                'Too many invitations sent. Please wait before sending more.',
            });
            break;
          default:
            // For unknown errors, show as general error
            setErrors({ general: errorMessage });
        }
      }
    } catch (error) {
      console.error('Error inviting member:', error);

      // Enhanced error handling for network/unexpected errors
      if (
        error instanceof Error &&
        error.message.toLowerCase().includes('network')
      ) {
        setErrors({
          general: 'Network error. Please check your connection and try again.',
        });
      } else {
        setErrors({
          general: 'An unexpected error occurred. Please try again later.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes with real-time validation clearing
  const handleEmailChange = (value: string) => {
    setForm((prev) => ({ ...prev, email: value }));
    if (errors.email && value && EMAIL_REGEX.test(value)) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handleRoleChange = (value: Role) => {
    setForm((prev) => ({ ...prev, role: value }));
    if (errors.role && value) {
      setErrors((prev) => ({ ...prev, role: undefined }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error Alert */}
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={form.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={
                errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''
              }
              disabled={isLoading}
              autoComplete="email"
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p
                id="email-error"
                className="text-sm text-red-500 dark:text-red-400"
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={handleRoleChange}
              disabled={isLoading}
            >
              <SelectTrigger
                className={
                  errors.role ? 'border-red-500 focus:ring-red-500' : ''
                }
                aria-label="Role"
              >
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500 dark:text-red-400">
                {errors.role}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Sending...</span>
                </div>
              ) : (
                'Send Invite'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
