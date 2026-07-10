import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, ChevronDown } from 'lucide-react';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { checkUserSession } from '@/lib/session-check';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { AdminView } from '@/components/dashboard/admin-view';
import { SpecialistView } from '@/components/dashboard/specialist-view';
import { DashboardUrgencyBanner } from '@/components/dashboard/dashboard-urgency-banner';
import { validateSessionAndOrg } from '@/server/utils';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const headersList = await headers();

  // Check if user has an organization
  const sessionCheck = await checkUserSession();

  if (!sessionCheck.hasSession) {
    redirect('/login');
  }

  if (!sessionCheck.hasOrganization) {
    if (sessionCheck.organizationCount && sessionCheck.organizationCount > 0) {
      redirect('/organization/select');
    }

    redirect('/onboarding');
  }

  const organizationId = sessionCheck.activeOrganizationId!;

  // Fetch membership role
  let role = 'member';
  let memberName = 'there';
  try {
    const sessionDetails = await validateSessionAndOrg(organizationId);
    role = sessionDetails.role;
    memberName = sessionDetails.session?.user?.name || 'there';
  } catch (error) {
    console.error('Failed to validate session role:', error);
  }

  const isAdmin = role === 'owner' || role === 'admin' || role === 'manager';

  // Check permissions for create actions
  const [hasPOCreate, hasProjectCreate] = await Promise.all([
    auth.api.hasPermission({
      headers: headersList,
      body: {
        permissions: {
          purchase_order: ['create'],
        },
      },
    }),
    auth.api.hasPermission({
      headers: headersList,
      body: {
        permissions: {
          project: ['create'],
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {memberName}!{' '}
            {isAdmin
              ? "Here's an overview of your organization's procurement pipeline."
              : "Here's your operational checklist and bidding activity overview."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Consolidated Create Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/tenders/create">Create Tender</Link>
              </DropdownMenuItem>
              {hasPOCreate.success && (
                <DropdownMenuItem asChild>
                  <Link href="/projects/purchase-orders/create">Create PO</Link>
                </DropdownMenuItem>
              )}
              {hasProjectCreate.success && (
                <DropdownMenuItem asChild>
                  <Link href="/projects/create">Create Project</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link href="/clients/create">Create Client</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Urgency Action Queue */}
      <Suspense fallback={<div className="h-12 rounded-xl bg-muted/30 animate-pulse" />}>
        <DashboardUrgencyBanner organizationId={organizationId} />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton />}>
        {isAdmin ? (
          <AdminView organizationId={organizationId} />
        ) : (
          <SpecialistView organizationId={organizationId} />
        )}
      </Suspense>
    </div>
  );
}
