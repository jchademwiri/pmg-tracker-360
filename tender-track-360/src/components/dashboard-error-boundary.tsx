'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  Wifi,
  Server,
  Shield,
  Database,
} from 'lucide-react';

interface DashboardErrorFallbackProps {
  error?: Error;
  resetError: () => void;
  errorInfo?: React.ErrorInfo;
}

// Enhanced error categorization
function categorizeError(error?: Error): {
  type: 'network' | 'permission' | 'server' | 'client' | 'database' | 'unknown';
  icon: React.ReactNode;
  title: string;
  description: string;
  actionable: boolean;
} {
  const message = error?.message?.toLowerCase() || '';
  const stack = error?.stack?.toLowerCase() || '';

  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection')
  ) {
    return {
      type: 'network',
      icon: <Wifi className="h-6 w-6" />,
      title: 'Connection Error',
      description:
        'Unable to connect to the server. Please check your internet connection.',
      actionable: true,
    };
  }

  // Permission errors
  if (
    message.includes('permission') ||
    message.includes('unauthorized') ||
    message.includes('forbidden')
  ) {
    return {
      type: 'permission',
      icon: <Shield className="h-6 w-6" />,
      title: 'Access Denied',
      description: "You don't have permission to access this resource.",
      actionable: false,
    };
  }

  // Server errors
  if (
    message.includes('server') ||
    message.includes('500') ||
    message.includes('internal')
  ) {
    return {
      type: 'server',
      icon: <Server className="h-6 w-6" />,
      title: 'Server Error',
      description:
        'The server encountered an error. Our team has been notified.',
      actionable: true,
    };
  }

  // Database errors
  if (
    message.includes('database') ||
    message.includes('sql') ||
    message.includes('query')
  ) {
    return {
      type: 'database',
      icon: <Database className="h-6 w-6" />,
      title: 'Database Error',
      description:
        'There was an issue accessing the database. Please try again.',
      actionable: true,
    };
  }

  // Client-side errors (React errors, etc.)
  if (
    stack.includes('react') ||
    message.includes('render') ||
    message.includes('component')
  ) {
    return {
      type: 'client',
      icon: <Bug className="h-6 w-6" />,
      title: 'Application Error',
      description: 'A client-side error occurred while rendering the page.',
      actionable: true,
    };
  }

  // Unknown errors
  return {
    type: 'unknown',
    icon: <AlertTriangle className="h-6 w-6" />,
    title: 'Unexpected Error',
    description: 'An unexpected error occurred. Please try again.',
    actionable: true,
  };
}

function DashboardErrorFallback({
  error,
  resetError,
  errorInfo,
}: DashboardErrorFallbackProps) {
  const errorCategory = categorizeError(error);

  const handleGoHome = () => {
    window.location.href = '/organization';
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleReportError = () => {
    // In a real app, this would send error details to an error reporting service
    const errorDetails = {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace available',
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error('Error reported:', errorDetails);

    // You could integrate with services like Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error, { extra: errorDetails });

    alert('Error report sent. Thank you for helping us improve!');
  };

  return (
    <div className="flex items-center justify-center min-h-[600px] p-4">
      <Card className="max-w-2xl w-full border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <div className="text-destructive">{errorCategory.icon}</div>
          </div>
          <CardTitle className="text-2xl text-destructive">
            {errorCategory.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-muted-foreground text-lg mb-2">
              {errorCategory.description}
            </p>

            {!errorCategory.actionable && (
              <Alert className="mt-4">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  If you believe this is an error, please contact your
                  organization administrator.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Error Details for Development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs bg-muted p-4 rounded border">
              <summary className="cursor-pointer font-medium mb-3 text-sm">
                🔧 Error Details (Development Mode)
              </summary>
              <div className="space-y-3">
                <div>
                  <strong>Message:</strong>
                  <pre className="mt-1 text-destructive whitespace-pre-wrap">
                    {error?.message || 'Unknown error'}
                  </pre>
                </div>

                {error?.stack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {error?.stack}
                    </pre>
                  </div>
                )}

                {errorInfo && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            {errorCategory.actionable && (
              <Button onClick={resetError} className="flex-1" size="lg">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}

            <Button
              onClick={handleReload}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reload Page
            </Button>

            <Button
              onClick={handleGoHome}
              variant="outline"
              className="flex-1"
              size="lg"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>

          {/* Report Error Button */}
          {process.env.NODE_ENV === 'production' && (
            <div className="text-center pt-4 border-t">
              <Button
                onClick={handleReportError}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Bug className="mr-2 h-4 w-4" />
                Report this error
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Specialized error boundaries for different sections
export function DashboardErrorBoundary({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary
      fallback={DashboardErrorFallback}
      onError={(error, errorInfo) => {
        // Log error for monitoring
        console.error('Dashboard Error:', error, errorInfo);

        // In production, send to error reporting service
        if (process.env.NODE_ENV === 'production') {
          // Example: Sentry.captureException(error, { extra: errorInfo });
        }
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export function ComponentErrorBoundary({
  children,
  componentName,
}: {
  children: React.ReactNode;
  componentName: string;
}) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <Card className="border-destructive/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <h3 className="font-medium text-destructive">
                    {componentName} Error
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {error?.message || 'This component failed to load'}
                  </p>
                </div>
              </div>
              <Button onClick={resetError} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      onError={(error, errorInfo) => {
        console.error(`${componentName} Error:`, error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
