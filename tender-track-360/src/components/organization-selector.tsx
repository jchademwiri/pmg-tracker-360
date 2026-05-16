'use client';

import { useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { OrganizationWithStats } from '@/server/organizations';

interface OrganizationSelectorProps {
  organizations: OrganizationWithStats[];
  fallbackContent: React.ReactNode;
}

export function OrganizationSelector({
  organizations,
  fallbackContent,
}: OrganizationSelectorProps) {
  const { data: activeOrganization, isPending: isLoading } =
    authClient.useActiveOrganization();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Prevent hydration mismatch
  if (!isClient) {
    return (
      <section className="grid place-items-center min-h-[600px] text-center">
        <div>
          <h1 className="text-4xl font-bold">Tender Track 360</h1>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </section>
    );
  }

  // Show loading state while checking organization
  if (isLoading) {
    return (
      <section className="grid place-items-center min-h-[600px] text-center">
        <div>
          <h1 className="text-4xl font-bold">Tender Track 360</h1>
          <p className="mt-4 text-lg">Loading your organization...</p>
        </div>
      </section>
    );
  }

  // If no organizations, show the create form
  if (organizations.length === 0) {
    return <>{fallbackContent}</>;
  }

  // Show organization selector
  return (
    <section className="grid place-items-center min-h-[600px] text-center">
      <div className="max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Tender Track 360</h1>
          <p className="mt-4 text-lg">Select an organization to continue</p>
          {activeOrganization && (
            <p className="mt-2 text-sm text-muted-foreground">
              Current: {activeOrganization.name}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Organizations</h2>
          <div className="grid gap-3">
            {organizations.map((org) => (
              <Button
                key={org.id}
                asChild
                variant={
                  activeOrganization?.id === org.id ? 'default' : 'outline'
                }
                className="w-full justify-start"
              >
                <Link href="/dashboard">
                  <span className="font-medium">{org.name}</span>
                </Link>
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">{fallbackContent}</div>
      </div>
    </section>
  );
}
