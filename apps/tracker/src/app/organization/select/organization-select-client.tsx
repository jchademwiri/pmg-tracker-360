'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Loader2, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OrganizationWithStats } from '@/server/organizations';
import { rememberActiveOrganization } from '@/server/organizations';

interface OrganizationSelectClientProps {
  organizations: OrganizationWithStats[];
}

export function OrganizationSelectClient({
  organizations,
}: OrganizationSelectClientProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function selectOrganization(organization: OrganizationWithStats) {
    setError(null);
    setSelectedId(organization.id);

    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/organization/set-active', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ organizationId: organization.id }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        const remembered = await rememberActiveOrganization(organization.id);
        if (!remembered.success) {
          throw new Error(remembered.error);
        }

        router.replace('/dashboard');
        router.refresh();
      } catch (selectionError) {
        setSelectedId(null);
        setError(
          selectionError instanceof Error
            ? selectionError.message
            : 'Failed to select organization'
        );
      }
    });
  }

  return (
    <div className="w-full max-w-3xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle className="text-3xl">Choose Organization</CardTitle>
          <p className="text-muted-foreground">
            Select the workspace you want to use for this session.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-3">
            {organizations.map((organization) => {
              const isSelected = selectedId === organization.id;

              return (
                <button
                  key={organization.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => selectOrganization(organization)}
                  className="flex w-full items-center justify-between rounded-lg border bg-background p-4 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border bg-muted">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">
                        {organization.name}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>
                          {organization.memberCount}{' '}
                          {organization.memberCount === 1
                            ? 'member'
                            : 'members'}
                        </span>
                        <span className="rounded-full border px-2 py-0.5 uppercase">
                          {organization.userRole}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isSelected ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <Button size="sm" variant="outline" tabIndex={-1}>
                      Select
                    </Button>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
