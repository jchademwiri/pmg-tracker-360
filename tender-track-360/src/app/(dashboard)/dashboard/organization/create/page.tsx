'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';
import { CreateOrganizationForm } from '@/components/shared/forms/create-organization-form';
import { authClient } from '@/lib/auth-client';
import { useEffect, useState } from 'react';

export default function CreateOrganizationPage() {
  const [organizations, setOrganizations] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const result = await authClient.organization.list();
        if (result.data) {
          setOrganizations(result.data);
        }
      } catch (error) {
        console.error('Error fetching organizations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-2xl">
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">
              Create a new Organization
            </CardTitle>
            <p className="text-muted-foreground">
              Set up your organization to get started
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <CreateOrganizationForm currentOrganizationCount={organizations.length} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
