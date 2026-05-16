import { ServerActionResult } from '@/server/invitations';

// Enhanced server action error handler
export function createServerActionError(
  code: string,
  message: string,
  details?: unknown
): ServerActionResult<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

// Common server action error responses
export const SERVER_ACTION_ERRORS = {
  // Authentication & Authorization
  UNAUTHORIZED: (message = 'You must be logged in to perform this action') =>
    createServerActionError('UNAUTHORIZED', message),

  FORBIDDEN: (message = 'You do not have permission to perform this action') =>
    createServerActionError('FORBIDDEN', message),

  INSUFFICIENT_PERMISSIONS: (
    message = 'You do not have the required permissions'
  ) => createServerActionError('INSUFFICIENT_PERMISSIONS', message),

  // Validation Errors
  INVALID_EMAIL: (message = 'Please provide a valid email address') =>
    createServerActionError('INVALID_EMAIL', message),

  INVALID_ROLE: (message = 'Please select a valid role') =>
    createServerActionError('INVALID_ROLE', message),

  REQUIRED_FIELD: (field: string) =>
    createServerActionError('REQUIRED_FIELD', `${field} is required`),

  // Business Logic Errors
  ALREADY_MEMBER: (email: string) =>
    createServerActionError(
      'ALREADY_MEMBER',
      `${email} is already a member of this organization`
    ),

  INVITATION_EXISTS: (email: string) =>
    createServerActionError(
      'INVITATION_EXISTS',
      `An invitation has already been sent to ${email}`
    ),

  INVITATION_EXPIRED: (message = 'This invitation has expired') =>
    createServerActionError('INVITATION_EXPIRED', message),

  ORGANIZATION_NOT_FOUND: (
    message = 'Organization not found or access denied'
  ) => createServerActionError('ORGANIZATION_NOT_FOUND', message),

  MEMBER_NOT_FOUND: (message = 'Member not found') =>
    createServerActionError('MEMBER_NOT_FOUND', message),

  // Rate Limiting & Server Errors
  RATE_LIMIT_EXCEEDED: (
    message = 'Too many requests. Please wait before trying again'
  ) => createServerActionError('RATE_LIMIT_EXCEEDED', message),

  SERVER_ERROR: (message = 'An internal server error occurred') =>
    createServerActionError('SERVER_ERROR', message),

  DATABASE_ERROR: (message = 'Database operation failed') =>
    createServerActionError('DATABASE_ERROR', message),

  NETWORK_ERROR: (message = 'Network connection failed') =>
    createServerActionError('NETWORK_ERROR', message),
};

// Helper function to handle common server action patterns
export async function handleServerAction<T>(
  action: () => Promise<T>,
  errorContext?: string
): Promise<ServerActionResult<T>> {
  try {
    const result = await action();
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error(
      `Server action error${errorContext ? ` (${errorContext})` : ''}:`,
      error
    );

    // Handle specific error types
    if (error instanceof Error) {
      // Check for common error patterns
      if (
        error.message.includes('permission') ||
        error.message.includes('unauthorized')
      ) {
        return SERVER_ACTION_ERRORS.FORBIDDEN();
      }

      if (error.message.includes('not found')) {
        return SERVER_ACTION_ERRORS.ORGANIZATION_NOT_FOUND();
      }

      if (
        error.message.includes('rate limit') ||
        error.message.includes('too many')
      ) {
        return SERVER_ACTION_ERRORS.RATE_LIMIT_EXCEEDED();
      }

      if (
        error.message.includes('database') ||
        error.message.includes('connection')
      ) {
        return SERVER_ACTION_ERRORS.DATABASE_ERROR(error.message);
      }

      // Generic error with original message
      return createServerActionError('UNKNOWN_ERROR', error.message);
    }

    // Fallback for unknown error types
    return SERVER_ACTION_ERRORS.SERVER_ERROR('An unexpected error occurred');
  }
}

// Validation helpers for server actions
export function validateEmail(
  email: string
): ServerActionResult<string> | null {
  if (!email) {
    return SERVER_ACTION_ERRORS.REQUIRED_FIELD('Email');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return SERVER_ACTION_ERRORS.INVALID_EMAIL();
  }

  return null;
}

export function validateRole(
  role: string,
  validRoles: string[]
): ServerActionResult<string> | null {
  if (!role) {
    return SERVER_ACTION_ERRORS.REQUIRED_FIELD('Role');
  }

  if (!validRoles.includes(role)) {
    return SERVER_ACTION_ERRORS.INVALID_ROLE(
      `Role must be one of: ${validRoles.join(', ')}`
    );
  }

  return null;
}

export function validateOrganizationId(
  organizationId: string
): ServerActionResult<string> | null {
  if (!organizationId) {
    return SERVER_ACTION_ERRORS.REQUIRED_FIELD('Organization ID');
  }

  return null;
}

// Success response helper
export function createServerActionSuccess<T>(data: T): ServerActionResult<T> {
  return {
    success: true,
    data,
  };
}
