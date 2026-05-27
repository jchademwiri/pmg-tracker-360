'use client';

// useState removed as it's not used in this component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

import { useSearchAndFilter } from '@/hooks/use-search-and-filter';
import { getInvitationDisplayStatus } from '@/lib/filter-utils';
import type { MemberWithUser } from '@/lib/filter-utils';
import type { PendingInvitation } from '@/server/organizations';
import { MoreHorizontal, Mail, UserPlus } from 'lucide-react';
import { NoResults } from '@/components/shared/empty-states';
import { SearchAndFilters } from './shared/search';

export interface MembersAndInvitationsWithSearchProps {
  members: MemberWithUser[];
  invitations: PendingInvitation[];
  onInviteMember?: () => void;
  onMemberAction?: (memberId: string, action: string) => void;
  onInvitationAction?: (invitationId: string, action: string) => void;
  className?: string;
}

function getRoleColor(role: string): string {
  switch (role) {
    case 'owner':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case 'admin':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'member':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'expired':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'inactive':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}

export function MembersAndInvitationsWithSearch({
  members,
  invitations,
  onInviteMember,
  onMemberAction,
  onInvitationAction,
  className = '',
}: MembersAndInvitationsWithSearchProps) {
  const {
    setFilters,
    filteredMembers,
    filteredInvitations,
    hasActiveFilters,
    totalResults,
    noResultsMessage,
  } = useSearchAndFilter({ members, invitations });

  const hasMembers = filteredMembers.length > 0;
  const hasInvitations = filteredInvitations.length > 0;
  const hasAnyResults = hasMembers || hasInvitations;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <SearchAndFilters
            onFiltersChange={setFilters}
            placeholder="Search members and invitations..."
            showRoleFilter={true}
            showStatusFilter={true}
          />
        </div>

        {onInviteMember && (
          <Button onClick={onInviteMember} className="whitespace-nowrap">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Results Summary */}
      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground">
          Showing {totalResults} result{totalResults !== 1 ? 's' : ''}
          {hasMembers && hasInvitations && (
            <span>
              {' '}
              ({filteredMembers.length} member
              {filteredMembers.length !== 1 ? 's' : ''},{' '}
              {filteredInvitations.length} invitation
              {filteredInvitations.length !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      )}

      {/* No Results */}
      {!hasAnyResults && (
        <NoResults
          title={
            hasActiveFilters ? 'No results found' : 'No members or invitations'
          }
          message={noResultsMessage}
          actionLabel={
            !hasActiveFilters && onInviteMember
              ? 'Invite First Member'
              : undefined
          }
          onAction={!hasActiveFilters ? onInviteMember : undefined}
          icon={hasActiveFilters ? 'search' : 'users'}
        />
      )}

      {/* Members Section */}
      {hasMembers && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>Members</span>
              <Badge variant="secondary">{filteredMembers.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.user.image || undefined} />
                          <AvatarFallback>
                            {member.user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{member.user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {member.user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(member.role)}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusColor(member.status || 'active')}
                      >
                        {member.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.joinedAt
                        ? member.joinedAt.toLocaleDateString()
                        : member.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {onMemberAction && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onMemberAction(member.id, 'menu')}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Separator between sections */}
      {hasMembers && hasInvitations && <Separator />}

      {/* Pending Invitations Section */}
      {hasInvitations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Pending Invitations</span>
              <Badge variant="secondary">{filteredInvitations.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invited By</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvitations.map((invitation) => {
                  const displayStatus = getInvitationDisplayStatus(invitation);
                  return (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-muted p-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {invitation.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(invitation.role)}>
                          {invitation.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(displayStatus)}>
                          {displayStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {invitation.inviterName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {invitation.expiresAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {onInvitationAction && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onInvitationAction(invitation.id, 'menu')
                            }
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
