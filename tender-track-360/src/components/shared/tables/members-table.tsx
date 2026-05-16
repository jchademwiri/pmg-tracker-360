import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Member } from '@/db/schema';
import MembersTableAction from '@/components/members-table-action';
import { UserPlus, AlertCircle, RefreshCw } from 'lucide-react';

interface MembersTableProps {
  members: Member[];
  selectedMembers?: string[];
  onSelectionChange?: (memberIds: string[]) => void;
  onInviteClick?: () => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

// Helper function to get member status
function getMemberStatus(): 'active' | 'inactive' {
  // For now, we'll consider all members as active
  // This can be enhanced based on additional logic like last login, etc.
  return 'active';
}

// Helper function to get status badge variant
function getStatusBadgeVariant(status: 'active' | 'inactive') {
  switch (status) {
    case 'active':
      return 'default';
    case 'inactive':
      return 'secondary';
    default:
      return 'secondary';
  }
}

// Helper function to get role badge variant
function getRoleBadgeVariant(role: string) {
  switch (role.toLowerCase()) {
    case 'owner':
      return 'destructive';
    case 'admin':
      return 'default';
    case 'member':
      return 'secondary';
    default:
      return 'outline';
  }
}

// Helper function to get user initials
function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Loading skeleton component
function MembersTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Skeleton className="h-4 w-4" />
          </TableHead>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 3 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-4" />
            </TableCell>
            <TableCell>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-16" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-14" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="h-8 w-8 ml-auto" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Empty state component
function MembersEmptyState({ onInviteClick }: { onInviteClick?: () => void }) {
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <UserPlus className="h-6 w-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg">No members yet</CardTitle>
        <p className="text-sm text-muted-foreground">
          Get started by inviting your first team member to the organization.
        </p>
      </CardHeader>
      <CardContent className="text-center">
        <Button onClick={onInviteClick} className="mx-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </CardContent>
    </Card>
  );
}

// Error state component
function MembersErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-destructive/50">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-lg text-destructive">
          Failed to Load Members
        </CardTitle>
        <p className="text-sm text-muted-foreground">{error}</p>
      </CardHeader>
      {onRetry && (
        <CardContent className="text-center">
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

export function MembersTable({
  members,
  selectedMembers = [],
  onSelectionChange,
  onInviteClick,
  isLoading = false,
  error = null,
  onRetry,
}: MembersTableProps) {
  // Handle loading state
  if (isLoading) {
    return <MembersTableSkeleton />;
  }

  // Handle error state
  if (error) {
    return <MembersErrorState error={error} onRetry={onRetry} />;
  }

  // Handle empty state
  if (members.length === 0) {
    return <MembersEmptyState onInviteClick={onInviteClick} />;
  }

  // Handle select all checkbox
  const isAllSelected =
    members.length > 0 && selectedMembers.length === members.length;
  const isIndeterminate =
    selectedMembers.length > 0 && selectedMembers.length < members.length;

  const handleSelectAll = (checked: boolean) => {
    if (onSelectionChange) {
      onSelectionChange(checked ? members.map((m) => m.id) : []);
    }
  };

  const handleSelectMember = (memberId: string, checked: boolean) => {
    if (onSelectionChange) {
      if (checked) {
        onSelectionChange([...selectedMembers, memberId]);
      } else {
        onSelectionChange(selectedMembers.filter((id) => id !== memberId));
      }
    }
  };

  return (
    <Table>
      <TableCaption>A list of your organization members.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              aria-label="Select all members"
              {...(isIndeterminate && { 'data-state': 'indeterminate' })}
            />
          </TableHead>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const status = getMemberStatus();
          const isSelected = selectedMembers.includes(member.id);

          return (
            <TableRow
              key={member.id}
              className={isSelected ? 'bg-muted/50' : ''}
            >
              <TableCell>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    handleSelectMember(member.id, checked as boolean)
                  }
                  aria-label={`Select ${member.user.name}`}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={member.user.image || undefined}
                      alt={member.user.name}
                    />
                    <AvatarFallback className="text-xs">
                      {getUserInitials(member.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {member.user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(member.role)}>
                  {member.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(status)}>{status}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(member.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </TableCell>
              <TableCell className="text-right">
                <MembersTableAction
                  memberId={member.id}
                  memberRole={member.role}
                  memberName={member.user.name}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
