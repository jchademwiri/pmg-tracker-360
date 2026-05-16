'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ConfirmationDialog,
  RemoveMemberConfirmationDialog,
} from '@/components/ui/confirmation-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  Crown,
  UserCheck,
  UserCog,
  User,
  Trash2,
  UserMinus,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { InviteMemberModal } from '@/components/shared/modals/invite-member-modal';
import type { Role } from '@/db/schema';
import {
  getOrganizationMembers,
  type OrganizationMember,
} from '@/server/organizations';
import {
  updateMemberRole,
  removeMemberFromOrganization,
  bulkRemoveMembersFromOrganization,
} from '@/server/organization-members';

interface MembersTabProps {
  organization: {
    id: string;
    name: string;
  };
  userRole: Role;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

// Using OrganizationMember interface from server

// Helper function to get role display info
function getRoleDisplay(role: Role) {
  switch (role) {
    case 'owner':
      return {
        color:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        icon: Crown,
        label: 'Owner',
      };
    case 'admin':
      return {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        icon: UserCheck,
        label: 'Admin',
      };
    case 'manager':
      return {
        color:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        icon: UserCog,
        label: 'Manager',
      };
    case 'member':
      return {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        icon: User,
        label: 'Member',
      };
    default:
      return {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        icon: User,
        label: 'Member',
      };
  }
}

// Helper function to get user initials
function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Helper function to check if user can manage members
function canManageMembers(role: Role): boolean {
  return ['owner', 'admin', 'manager'].includes(role);
}

// Helper function to check if user can change roles
function canChangeRole(
  userRole: Role,
  targetRole: Role,
  isCurrentUser: boolean
): boolean {
  if (isCurrentUser) return false; // Can't change own role
  if (targetRole === 'owner') return userRole === 'owner'; // Only owners can change owner role
  return ['owner', 'admin'].includes(userRole); // Owners and admins can change other roles
}

// Helper function to check if user can remove member
function canRemoveMember(
  userRole: Role,
  targetRole: Role,
  isCurrentUser: boolean
): boolean {
  if (isCurrentUser) return false; // Can't remove self
  if (targetRole === 'owner') return false; // Can't remove owner
  return ['owner', 'admin', 'manager'].includes(userRole);
}

export function MembersTab({
  organization,
  userRole,
  currentUser,
}: MembersTabProps) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [memberToRemove, setMemberToRemove] =
    useState<OrganizationMember | null>(null);
  const [showBulkRemoveDialog, setShowBulkRemoveDialog] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const canManage = canManageMembers(userRole);

  // Fetch real organization members from database
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        const organizationMembers = await getOrganizationMembers(
          organization.id
        );
        setMembers(organizationMembers);
      } catch (error) {
        console.error('Error fetching members:', error);
        toast.error('Failed to load organization members');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [organization.id]);

  const handleRoleChange = async (memberId: string, newRole: Role) => {
    try {
      const result = await updateMemberRole(organization.id, memberId, newRole);

      if (result.success) {
        // Update local state optimistically
        setMembers((prev) =>
          prev.map((member) =>
            member.id === memberId ? { ...member, role: newRole } : member
          )
        );
        toast.success('Member role updated successfully');
      } else {
        toast.error(result.error?.message || 'Failed to update member role');
      }
    } catch (error) {
      console.error('Error updating member role:', error);
      toast.error('Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const result = await removeMemberFromOrganization(
        organization.id,
        memberId
      );

      if (result.success) {
        // Update local state optimistically
        setMembers((prev) => prev.filter((member) => member.id !== memberId));
        toast.success('Member removed successfully');
      } else {
        toast.error(result.error?.message || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleBulkRemove = async () => {
    if (selectedMembers.length === 0) return;

    try {
      const result = await bulkRemoveMembersFromOrganization(
        organization.id,
        selectedMembers
      );

      if (result.success) {
        // Update local state optimistically
        setMembers((prev) =>
          prev.filter((member) => !selectedMembers.includes(member.id))
        );
        setSelectedMembers([]);
        toast.success(`${selectedMembers.length} members removed successfully`);
      } else {
        toast.error(result.error?.message || 'Failed to remove members');
      }
    } catch (error) {
      console.error('Error bulk removing members:', error);
      toast.error('Failed to remove members');
    }
  };

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  const selectAllMembers = () => {
    const selectableMembers = members.filter((member) =>
      canRemoveMember(userRole, member.role, member.userId === currentUser.id)
    );
    setSelectedMembers(selectableMembers.map((member) => member.id));
  };

  const clearSelection = () => {
    setSelectedMembers([]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Organization Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center space-x-4 p-4 border rounded-lg"
              >
                <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                </div>
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Members Header with Bulk Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Organization Members
              </CardTitle>
              <CardDescription>
                Manage team members and their roles in the organization
              </CardDescription>
            </div>
            {canManage && selectedMembers.length > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedMembers.length} selected
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearSelection}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkRemoveDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Selected
                </Button>
              </div>
            ) : canManage ? (
              <Button onClick={() => setIsInviteModalOpen(true)} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {canManage && (
            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                checked={
                  selectedMembers.length ===
                  members.filter((member) =>
                    canRemoveMember(
                      userRole,
                      member.role,
                      member.userId === currentUser.id
                    )
                  ).length
                }
                onCheckedChange={(checked) => {
                  if (checked) {
                    selectAllMembers();
                  } else {
                    clearSelection();
                  }
                }}
              />
              <span className="text-sm text-muted-foreground">
                Select all removable members
              </span>
            </div>
          )}

          <div className="space-y-4">
            {members.map((member) => {
              const roleDisplay = getRoleDisplay(member.role);
              const RoleIcon = roleDisplay.icon;
              const isCurrentUser = member.userId === currentUser.id;
              const canChangeThisRole = canChangeRole(
                userRole,
                member.role,
                isCurrentUser
              );
              const canRemoveThisMember = canRemoveMember(
                userRole,
                member.role,
                isCurrentUser
              );

              return (
                <div
                  key={member.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {canManage && canRemoveThisMember && (
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={() => toggleMemberSelection(member.id)}
                    />
                  )}

                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={member.image || ''}
                      alt={`${member.name} avatar`}
                    />
                    <AvatarFallback>
                      {getUserInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{member.name}</p>
                      {isCurrentUser && (
                        <Badge variant="secondary" className="text-xs">
                          You
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {member.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Joined{' '}
                      {new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }).format(member.joinedAt)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {canChangeThisRole ? (
                      <Select
                        value={member.role}
                        onValueChange={(newRole: Role) =>
                          handleRoleChange(member.id, newRole)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">
                            <div className="flex items-center gap-2">
                              <Crown className="h-4 w-4" />
                              Owner
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <UserCheck className="h-4 w-4" />
                              Admin
                            </div>
                          </SelectItem>
                          <SelectItem value="manager">
                            <div className="flex items-center gap-2">
                              <UserCog className="h-4 w-4" />
                              Manager
                            </div>
                          </SelectItem>
                          <SelectItem value="member">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Member
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={roleDisplay.color}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {roleDisplay.label}
                      </Badge>
                    )}

                    {canRemoveThisMember && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setMemberToRemove(member)}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {!canManage && (
            <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg mt-4">
              You have read-only access to member information. Contact an admin
              or owner to manage members.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <RemoveMemberConfirmationDialog
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={async () => {
          if (memberToRemove) {
            await handleRemoveMember(memberToRemove.id);
            setMemberToRemove(null);
          }
        }}
        memberName={memberToRemove?.name || ''}
      />

      <ConfirmationDialog
        isOpen={showBulkRemoveDialog}
        onClose={() => setShowBulkRemoveDialog(false)}
        onConfirm={async () => {
          await handleBulkRemove();
          setShowBulkRemoveDialog(false);
        }}
        title="Remove Members"
        description={`Are you sure you want to remove ${selectedMembers.length} member(s) from this organization? This action cannot be undone.`}
        confirmText="Remove Members"
        variant="destructive"
        icon="remove"
      />

      <InviteMemberModal
        organizationId={organization.id}
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          // Reload members
          // Since we don't have a direct reload function exposed from the effect,
          // we might want to trigger a re-fetch or rely on the server action's revalidatePath.
          // However, revalidatePath reloads the page data, but this component fetches in useEffect.
          // We should probably lift the fetch or trigger it again.
          // For now, we'll force a reload by toggling a key or just relying on the user to refresh,
          // BUT better is to trigger the effect again.
          // actually inviteMember server action does revalidatePath so the page should update?
          // But this component fetches client-side on mount.
          // Let's add a refresh trigger.
          window.location.reload();
        }}
      />
    </div>
  );
}
