'use client';

import { OrganizationMembersSection } from '@/components/organization-members-section';
import { Member } from '@/db/schema';
import { PendingInvitation } from '@/server/organizations';
import { faker } from '@faker-js/faker';

// Example usage of the BulkActionsToolbar component
export function BulkActionsExample() {
  // Generate mock data using Faker.js
  const mockMembers: Member[] = Array.from({ length: 5 }, () => ({
    id: faker.string.uuid(),
    userId: faker.string.uuid(),
    organizationId: faker.string.uuid(),
    role: faker.helpers.arrayElement(['member', 'admin', 'owner']),
    createdAt: faker.date.recent(),
    user: {
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      image: faker.image.avatar(),
      emailVerified: faker.datatype.boolean(),
      createdAt: faker.date.recent(),
      updatedAt: faker.date.recent(),
      plan: 'free',
    },
  }));

  const mockInvitations: PendingInvitation[] = Array.from(
    { length: 3 },
    () => ({
      id: faker.string.uuid(),
      email: faker.internet.email(),
      role: faker.helpers.arrayElement(['member', 'admin']),
      status: 'pending',
      invitedAt: faker.date.recent(),
      expiresAt: faker.date.future(),
      inviterName: faker.person.fullName(),
    })
  );

  const handleInviteClick = () => {
    console.log('Invite member clicked');
    // This would typically open an invite modal
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Organization Members Management
      </h1>
      <p className="text-muted-foreground mb-6">
        This example demonstrates the BulkActionsToolbar component in action.
        Select multiple members or invitations to see the bulk actions toolbar
        appear at the bottom.
      </p>

      <OrganizationMembersSection
        members={mockMembers}
        pendingInvitations={mockInvitations}
        onInviteClick={handleInviteClick}
        isLoading={false}
      />
    </div>
  );
}

export default BulkActionsExample;
