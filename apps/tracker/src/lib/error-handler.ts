import { toast } from 'sonner';

// Error types for better categorization
export enum ErrorType {
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  NETWORK = 'network',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Structured error interface
export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  details?: unknown;
  userMessage?: string;
  actionable?: boolean;
  retryable?: boolean;
}

// Common error codes and their user-friendly messages
const ERROR_MESSAGES: Record<
  string,
  { message: string; type: ErrorType; severity: ErrorSeverity }
> = {
  // Authentication & Authorization
  UNAUTHORIZED: {
    message: 'You need to be logged in to perform this action.',
    type: ErrorType.PERMISSION,
    severity: ErrorSeverity.MEDIUM,
  },
  FORBIDDEN: {
    message: "You don't have permission to perform this action.",
    type: ErrorType.PERMISSION,
    severity: ErrorSeverity.MEDIUM,
  },
  INSUFFICIENT_PERMISSIONS: {
    message: "You don't have the required permissions for this action.",
    type: ErrorType.PERMISSION,
    severity: ErrorSeverity.MEDIUM,
  },

  // Validation Errors
  INVALID_EMAIL: {
    message: 'Please enter a valid email address.',
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
  },
  INVALID_ROLE: {
    message: 'Please select a valid role.',
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
  },
  REQUIRED_FIELD: {
    message: 'This field is required.',
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
  },

  // Business Logic Errors
  ALREADY_MEMBER: {
    message: 'This user is already a member of the organization.',
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
  },
  INVITATION_EXISTS: {
    message: 'An invitation has already been sent to this email address.',
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
  },
  INVITATION_EXPIRED: {
    message: 'This invitation has expired. Please request a new one.',
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.MEDIUM,
  },
  ORGANIZATION_NOT_FOUND: {
    message:
      "The organization you're looking for doesn't exist or you don't have access to it.",
    type: ErrorType.NOT_FOUND,
    severity: ErrorSeverity.MEDIUM,
  },
  MEMBER_NOT_FOUND: {
    message: "The member you're looking for doesn't exist.",
    type: ErrorType.NOT_FOUND,
    severity: ErrorSeverity.MEDIUM,
  },

  // Network & Server Errors
  NETWORK_ERROR: {
    message:
      'Network connection failed. Please check your internet connection and try again.',
    type: ErrorType.NETWORK,
    severity: ErrorSeverity.MEDIUM,
  },
  SERVER_ERROR: {
    message: 'A server error occurred. Please try again later.',
    type: ErrorType.SERVER,
    severity: ErrorSeverity.HIGH,
  },
  RATE_LIMIT_EXCEEDED: {
    message: 'Too many requests. Please wait a moment before trying again.',
    type: ErrorType.SERVER,
    severity: ErrorSeverity.MEDIUM,
  },
  SERVICE_UNAVAILABLE: {
    message: 'The service is temporarily unavailable. Please try again later.',
    type: ErrorType.SERVER,
    severity: ErrorSeverity.HIGH,
  },
};

// Create structured error from various input types
export function createAppError(
  input: string | Error | { code?: string; message?: string; type?: ErrorType },
  fallbackMessage = 'An unexpected error occurred'
): AppError {
  // Handle string input
  if (typeof input === 'string') {
    const errorConfig = ERROR_MESSAGES[input];
    if (errorConfig) {
      return {
        code: input,
        message: errorConfig.message,
        type: errorConfig.type,
        severity: errorConfig.severity,
        userMessage: errorConfig.message,
        actionable: true,
        retryable:
          errorConfig.type === ErrorType.NETWORK ||
          errorConfig.type === ErrorType.SERVER,
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: input,
      userMessage: input,
      actionable: false,
      retryable: false,
    };
  }

  // Handle Error object
  if (input instanceof Error) {
    // Check if it's a network error
    if (
      input.message.toLowerCase().includes('network') ||
      input.message.toLowerCase().includes('fetch')
    ) {
      return {
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.MEDIUM,
        message: input.message,
        userMessage:
          'Network connection failed. Please check your internet connection and try again.',
        actionable: true,
        retryable: true,
      };
    }

    return {
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message: input.message,
      userMessage: fallbackMessage,
      actionable: false,
      retryable: false,
    };
  }

  // Handle object input (like server action results)
  if (typeof input === 'object' && input !== null) {
    const code = input.code;
    const message = input.message || fallbackMessage;

    if (code && ERROR_MESSAGES[code]) {
      const errorConfig = ERROR_MESSAGES[code];
      return {
        code,
        message: errorConfig.message,
        type: errorConfig.type,
        severity: errorConfig.severity,
        userMessage: errorConfig.message,
        actionable: true,
        retryable:
          errorConfig.type === ErrorType.NETWORK ||
          errorConfig.type === ErrorType.SERVER,
      };
    }

    return {
      type: input.type || ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      message,
      userMessage: message,
      actionable: false,
      retryable: false,
    };
  }

  // Fallback
  return {
    type: ErrorType.UNKNOWN,
    severity: ErrorSeverity.MEDIUM,
    message: fallbackMessage,
    userMessage: fallbackMessage,
    actionable: false,
    retryable: false,
  };
}

// Enhanced toast error handler
export function handleError(
  error: string | Error | { code?: string; message?: string; type?: ErrorType },
  options: {
    title?: string;
    fallbackMessage?: string;
    showToast?: boolean;
    logError?: boolean;
  } = {}
) {
  const {
    title,
    fallbackMessage = 'An unexpected error occurred',
    showToast = true,
    logError = true,
  } = options;

  const appError = createAppError(error, fallbackMessage);

  // Log error for debugging
  if (logError) {
    console.error('Error handled:', {
      error,
      appError,
      timestamp: new Date().toISOString(),
    });
  }

  // Show toast notification
  if (showToast) {
    const toastTitle = title || getErrorTitle(appError.type, appError.severity);
    const description = appError.userMessage || appError.message;

    switch (appError.severity) {
      case ErrorSeverity.LOW:
        toast.error(toastTitle, { description });
        break;
      case ErrorSeverity.MEDIUM:
        toast.error(toastTitle, {
          description,
          duration: 5000,
        });
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        toast.error(toastTitle, {
          description: `${description} If this problem persists, please contact support.`,
          duration: 8000,
        });
        break;
    }
  }

  return appError;
}

// Get appropriate error title based on type and severity
function getErrorTitle(type: ErrorType, severity: ErrorSeverity): string {
  if (severity === ErrorSeverity.CRITICAL) {
    return 'Critical Error';
  }

  switch (type) {
    case ErrorType.VALIDATION:
      return 'Validation Error';
    case ErrorType.PERMISSION:
      return 'Permission Denied';
    case ErrorType.NOT_FOUND:
      return 'Not Found';
    case ErrorType.NETWORK:
      return 'Connection Error';
    case ErrorType.SERVER:
      return 'Server Error';
    default:
      return 'Error';
  }
}

// Success toast helper
export function handleSuccess(
  message: string,
  options: {
    title?: string;
    description?: string;
    duration?: number;
  } = {}
) {
  const { title = 'Success', description, duration = 4000 } = options;

  toast.success(title, {
    description: description || message,
    duration,
  });
}

// Info toast helper
export function handleInfo(
  message: string,
  options: {
    title?: string;
    description?: string;
    duration?: number;
  } = {}
) {
  const { title = 'Information', description, duration = 4000 } = options;

  toast.info(title, {
    description: description || message,
    duration,
  });
}

// Warning toast helper
export function handleWarning(
  message: string,
  options: {
    title?: string;
    description?: string;
    duration?: number;
  } = {}
) {
  const { title = 'Warning', description, duration = 5000 } = options;

  toast.warning(title, {
    description: description || message,
    duration,
  });
}
