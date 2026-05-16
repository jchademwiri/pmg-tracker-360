
import { FilterState } from '@/components/shared/search';
import type { Member, Role } from '@/db/schema';
import type { PendingInvitation } from '@/server/organizations';

export interface MemberWithUser extends Member {
  status?: 'active' | 'inactive';
  joinedAt?: Date;
}

/**
 * Filters members based on search and filter criteria
 */
export function filterMembers(
  members: MemberWithUser[],
  filters: FilterState
): MemberWithUser[] {
  return members.filter((member) => {
    // Search filter - check name and email
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesName = member.user.name.toLowerCase().includes(searchTerm);
      const matchesEmail = member.user.email.toLowerCase().includes(searchTerm);

      if (!matchesName && !matchesEmail) {
        return false;
      }
    }

    // Role filter
    if (filters.role !== 'all' && member.role !== filters.role) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all') {
      const memberStatus = member.status || 'active'; // Default to active if not specified
      if (memberStatus !== filters.status) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Filters pending invitations based on search and filter criteria
 */
export function filterInvitations(
  invitations: PendingInvitation[],
  filters: FilterState
): PendingInvitation[] {
  return invitations.filter((invitation) => {
    // Search filter - check email and inviter name
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesEmail = invitation.email.toLowerCase().includes(searchTerm);
      const matchesInviter = invitation.inviterName
        .toLowerCase()
        .includes(searchTerm);

      if (!matchesEmail && !matchesInviter) {
        return false;
      }
    }

    // Role filter
    if (filters.role !== 'all' && invitation.role !== filters.role) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all') {
      let invitationStatus: string;

      // Determine invitation status
      if (invitation.status === 'pending') {
        // Check if expired
        const now = new Date();
        invitationStatus = invitation.expiresAt < now ? 'expired' : 'pending';
      } else {
        invitationStatus = invitation.status;
      }

      if (invitationStatus !== filters.status) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Gets the display status for an invitation
 */
export function getInvitationDisplayStatus(
  invitation: PendingInvitation
): string {
  if (invitation.status === 'pending') {
    const now = new Date();
    return invitation.expiresAt < now ? 'expired' : 'pending';
  }
  return invitation.status;
}

/**
 * Checks if there are any active filters applied
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.search !== '' || filters.role !== 'all' || filters.status !== 'all'
  );
}

/**
 * Gets a summary of applied filters for display
 */
export function getFilterSummary(filters: FilterState): string {
  const parts: string[] = [];

  if (filters.search) {
    parts.push(`search: "${filters.search}"`);
  }

  if (filters.role !== 'all') {
    parts.push(`role: ${filters.role}`);
  }

  if (filters.status !== 'all') {
    parts.push(`status: ${filters.status}`);
  }

  return parts.join(', ');
}

/**
 * Validates if a role is a valid Role type
 */
export function isValidRole(role: string): role is Role {
  return ['owner', 'admin', 'member'].includes(role);
}

/**
 * Gets the role hierarchy level (higher number = more permissions)
 */
export function getRoleLevel(role: Role): number {
  switch (role) {
    case 'owner':
      return 3;
    case 'admin':
      return 2;
    case 'member':
      return 1;
    default:
      return 0;
  }
}

/**
 * Checks if a role has permission to perform actions on another role
 */
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  return getRoleLevel(managerRole) > getRoleLevel(targetRole);
}

/**
 * Gets available roles that a user can assign based on their role
 */
export function getAssignableRoles(userRole: Role): Role[] {
  const userLevel = getRoleLevel(userRole);
  const allRoles: Role[] = ['owner', 'admin', 'member'];

  return allRoles.filter((role) => getRoleLevel(role) < userLevel);
}

/**
 * Formats role name for display
 */
export function formatRoleName(role: Role): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Creates a "no results" message based on active filters
 */
export function getNoResultsMessage(
  filters: FilterState,
  type: 'members' | 'invitations' | 'both' = 'both'
): string {
  const hasFilters = hasActiveFilters(filters);

  if (!hasFilters) {
    switch (type) {
      case 'members':
        return 'No members found. Invite some people to get started!';
      case 'invitations':
        return 'No pending invitations.';
      case 'both':
        return 'No members or invitations found.';
    }
  }

  const filterSummary = getFilterSummary(filters);

  switch (type) {
    case 'members':
      return `No members found matching ${filterSummary}. Try adjusting your filters.`;
    case 'invitations':
      return `No invitations found matching ${filterSummary}. Try adjusting your filters.`;
    case 'both':
      return `No results found matching ${filterSummary}. Try adjusting your filters.`;
  }
}
