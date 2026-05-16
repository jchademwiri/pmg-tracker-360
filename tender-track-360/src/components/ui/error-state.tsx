'use client';

import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface ErrorStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  type?: 'error' | 'network' | 'not-found' | 'unauthorized';
  className?: string;
}

export function ErrorState({
  title,
  description,
  action,
  type = 'error',
  className,
}: ErrorStateProps) {
  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: WifiOff,
          title: title || 'Connection Error',
          description:
            description ||
            'Unable to connect to the server. Please check your internet connection.',
          iconColor: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-100 dark:bg-orange-900/20',
        };
      case 'not-found':
        return {
          icon: AlertTriangle,
          title: title || 'Not Found',
          description:
            description ||
            'The resource you&apos;re looking for doesn&apos;t exist.',
          iconColor: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        };
      case 'unauthorized':
        return {
          icon: AlertTriangle,
          title: title || 'Access Denied',
          description:
            description ||
            'You don&apos;t have permission to access this resource.',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
        };
      default:
        return {
          icon: AlertTriangle,
          title: title || 'Something went wrong',
          description:
            description || 'An unexpected error occurred. Please try again.',
          iconColor: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
        };
    }
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  return (
    <div className={`flex items-center justify-center py-12 px-4 ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div
            className={`mx-auto w-12 h-12 ${config.bgColor} rounded-full flex items-center justify-center mb-4`}
          >
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <CardTitle>{config.title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">{config.description}</p>

          {action && (
            <Button onClick={action.onClick} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              {action.label}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Specific error state components for common scenarios
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      type="network"
      action={onRetry ? { label: 'Retry', onClick: onRetry } : undefined}
    />
  );
}

export function NotFoundError({ message }: { message?: string }) {
  return <ErrorState type="not-found" description={message} />;
}

export function UnauthorizedError({ message }: { message?: string }) {
  return <ErrorState type="unauthorized" description={message} />;
}
