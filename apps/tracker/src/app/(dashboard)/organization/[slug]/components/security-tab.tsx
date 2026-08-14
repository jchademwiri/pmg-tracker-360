'use client';

import { ShieldAlert } from 'lucide-react';
import type { Role } from '@pmg/db/schema';
import { DangerZone } from '@/components/organization/danger-zone';

interface SecurityTabProps {
  organization: {
    id: string;
    name: string;
    memberCount: number;
    activeProjects?: number;
  };
  userRole: Role;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

function canAccessSecurity(role: Role): boolean {
  return ['owner', 'admin'].includes(role);
}

export function SecurityTab({
  organization,
  userRole,
  currentUser: _currentUser,
}: SecurityTabProps) {
  if (!canAccessSecurity(userRole)) {
    return (
      <div className="text-center py-12">
        <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">
          You need admin or owner permissions to access security settings.
        </p>
      </div>
    );
  }

  return (
    <DangerZone
      organizationId={organization.id}
      userRole={userRole}
      organizationName={organization.name}
      memberCount={organization.memberCount}
      hasActiveProjects={
        organization.activeProjects !== undefined &&
        organization.activeProjects > 0
      }
    />
  );
}
