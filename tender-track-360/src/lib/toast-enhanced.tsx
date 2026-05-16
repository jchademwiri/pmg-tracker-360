import React from 'react';
import { toast } from 'sonner';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  };
  cancel?: {
    label: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  };
  id?: string;
  dismissible?: boolean;
}

interface LoadingToastOptions {
  loading: string;
  success: string | ((data: unknown) => string);
  error: string | ((error: unknown) => string);
  duration?: number;
}

class EnhancedToast {
  // Success toast with enhanced styling
  success(message: string, options: ToastOptions = {}) {
    return toast.success(message, {
      duration: options.duration || 4000,
      action: options.action,
      cancel: options.cancel,
      id: options.id,
      dismissible: options.dismissible !== false,
      icon: <CheckCircle />,
      className: 'toast-success',
    });
  }

  // Error toast with enhanced styling
  error(message: string, options: ToastOptions = {}) {
    return toast.error(message, {
      duration: options.duration || 6000,
      action: options.action,
      cancel: options.cancel,
      id: options.id,
      dismissible: options.dismissible !== false,
      icon: <AlertCircle />,
      className: 'toast-error',
    });
  }

  // Warning toast
  warning(message: string, options: ToastOptions = {}) {
    return toast.warning(message, {
      duration: options.duration || 5000,
      action: options.action,
      cancel: options.cancel,
      id: options.id,
      dismissible: options.dismissible !== false,
      icon: <AlertTriangle />,
      className: 'toast-warning',
    });
  }

  // Info toast
  info(message: string, options: ToastOptions = {}) {
    return toast.info(message, {
      duration: options.duration || 4000,
      action: options.action,
      cancel: options.cancel,
      id: options.id,
      dismissible: options.dismissible !== false,
      icon: <Info />,
      className: 'toast-info',
    });
  }

  // Loading toast with promise handling
  promise<T>(promise: Promise<T>, options: LoadingToastOptions) {
    return toast.promise(promise, {
      loading: options.loading,
      success: options.success,
      error: options.error,
      duration: options.duration || 4000,
    });
  }

  // Custom toast with full control
  custom(
    content: (id: string | number) => React.ReactElement,
    options: ToastOptions = {}
  ) {
    return toast.custom(content, {
      duration: options.duration || 4000,
      id: options.id,
      dismissible: options.dismissible !== false,
    });
  }

  // Dismiss specific toast
  dismiss(id?: string) {
    return toast.dismiss(id);
  }

  // Dismiss all toasts
  dismissAll() {
    return toast.dismiss();
  }

  // Organization-specific toasts
  organization = {
    created: (name: string) =>
      this.success(`Organization "${name}" created successfully`),
    updated: (name: string) =>
      this.success(`Organization "${name}" updated successfully`),
    deleted: (name: string, type: 'soft' | 'permanent') => {
      if (type === 'soft') {
        this.success(
          `Organization "${name}" deleted. You have 30 days to restore it.`,
          {
            action: {
              label: 'Undo',
              onClick: () => {
                // Handle restore action
                console.log('Restore organization');
              },
            },
          }
        );
      } else {
        this.warning(`Organization "${name}" permanently deleted.`);
      }
    },
    restored: (name: string) =>
      this.success(`Organization "${name}" restored successfully`),
    memberAdded: (memberName: string, orgName: string) =>
      this.success(`${memberName} added to ${orgName}`),
    memberRemoved: (memberName: string, orgName: string) =>
      this.info(`${memberName} removed from ${orgName}`),
    invitationSent: (email: string) =>
      this.success(`Invitation sent to ${email}`),
    invitationCancelled: (email: string) =>
      this.info(`Invitation to ${email} cancelled`),
    roleUpdated: (memberName: string, role: string) =>
      this.success(`${memberName}'s role updated to ${role}`),
    ownershipTransferred: (newOwner: string) =>
      this.success(`Ownership transferred to ${newOwner}`),
    dataExported: (format: string) =>
      this.success(`Data exported as ${format.toUpperCase()}`),
  };

  // Network and API error toasts
  network = {
    offline: () =>
      this.error('You are offline. Some features may not work.', {
        dismissible: false,
      }),
    online: () => this.success('Connection restored'),
    timeout: () =>
      this.error('Request timed out. Please try again.', {
        action: {
          label: 'Retry',
          onClick: () => window.location.reload(),
        },
      }),
    serverError: () =>
      this.error('Server error. Please try again later.', {
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload(),
        },
      }),
    unauthorized: () =>
      this.error('Session expired. Please log in again.', {
        action: {
          label: 'Login',
          onClick: () => (window.location.href = '/login'),
        },
      }),
  };

  // Form validation toasts
  form = {
    validationError: (message: string) => this.error(message),
    saveSuccess: () => this.success('Changes saved successfully'),
    saveError: () => this.error('Failed to save changes. Please try again.'),
    requiredFields: () => this.warning('Please fill in all required fields'),
    invalidEmail: () => this.error('Please enter a valid email address'),
    passwordMismatch: () => this.error('Passwords do not match'),
    weakPassword: () =>
      this.warning('Password is too weak. Please choose a stronger password.'),
  };

  // File upload toasts
  upload = {
    started: (filename: string) => this.info(`Uploading ${filename}...`),
    success: (filename: string) =>
      this.success(`${filename} uploaded successfully`),
    error: (filename: string, error?: string) =>
      this.error(`Failed to upload ${filename}${error ? `: ${error}` : ''}`),
    tooLarge: (maxSize: string) =>
      this.error(`File is too large. Maximum size is ${maxSize}`),
    invalidType: (allowedTypes: string[]) =>
      this.error(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      ),
  };
}

// Export singleton instance
export const enhancedToast = new EnhancedToast();

// Export individual methods for convenience
export const {
  success,
  error,
  warning,
  info,
  promise,
  custom,
  dismiss,
  dismissAll,
  organization,
  network,
  form,
  upload,
} = enhancedToast;
