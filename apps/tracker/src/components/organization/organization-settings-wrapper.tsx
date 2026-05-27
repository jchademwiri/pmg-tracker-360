'use client';

import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingCard } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';

interface OrganizationSettingsWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function OrganizationSettingsWrapper({
  children,
  fallback,
}: OrganizationSettingsWrapperProps) {
  return (
    <ErrorBoundary
      fallback={({ resetError }) => (
        <ErrorState
          title="Settings Error"
          description="There was an error loading the organization settings. Please try again."
          action={{
            label: 'Reload Settings',
            onClick: resetError,
          }}
        />
      )}
      onError={(error, errorInfo) => {
        // Log to monitoring service
        console.error('Organization Settings Error:', error, errorInfo);
      }}
    >
      <Suspense fallback={fallback || <OrganizationSettingsLoading />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

function OrganizationSettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Loading */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-muted rounded-lg animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-muted rounded w-48 animate-pulse" />
            <div className="h-4 bg-muted rounded w-32 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Tabs Loading */}
      <div className="space-y-6">
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-10 w-24 bg-background rounded animate-pulse"
            />
          ))}
        </div>

        {/* Content Loading */}
        <div className="space-y-4">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      </div>
    </div>
  );
}
