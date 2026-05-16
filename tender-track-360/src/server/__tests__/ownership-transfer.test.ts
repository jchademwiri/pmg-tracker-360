/**
 * @jest-environment node
 */
import { db } from '@/db';
import { organization, user, member, ownershipTransfer } from '@/db/schema';
import { ownershipTransferManager } from '@/lib/ownership-transfer';
import { eq } from 'drizzle-orm';

// Mock revalidatePath
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock Resend
jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ id: 'mock_email_id' }),
      },
    })),
  };
});

// Mock console.error/log
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
beforeAll(() => {
  console.error = jest.fn();
  console.log = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

describe('Ownership Transfer Tests', () => {
  const TEST_PREFIX = 'OT_TEST_' + Date.now();
  let orgId: string;
  let ownerId: string;
  let newOwnerId: string;

  beforeAll(async () => {
    // 1. Create Users
    ownerId = `user_owner_${Date.now()}`;
    newOwnerId = `user_new_${Date.now()}`;

    await db.insert(user).values([
      {
        id: ownerId,
        name: 'Owner User',
        email: `owner_${Date.now()}@test.com`,
      },
      {
        id: newOwnerId,
        name: 'New Owner User',
        email: `new_${Date.now()}@test.com`,
      },
    ]);

    // 2. Create Organization
    orgId = `org_${Date.now()}`;
    await db.insert(organization).values({
      id: orgId,
      name: `${TEST_PREFIX}_Org`,
      createdAt: new Date(),
    });

    // 3. Create Memberships
    await db.insert(member).values([
      {
        id: `mem_${Date.now()}_1`,
        organizationId: orgId,
        userId: ownerId,
        role: 'owner',
        createdAt: new Date(),
      },
      {
        id: `mem_${Date.now()}_2`,
        organizationId: orgId,
        userId: newOwnerId,
        role: 'member',
        createdAt: new Date(),
      },
    ]);
  });

  afterAll(async () => {
    // Cleanup
    if (orgId) {
      await db.delete(organization).where(eq(organization.id, orgId));
    }
    if (ownerId) await db.delete(user).where(eq(user.id, ownerId));
    if (newOwnerId) await db.delete(user).where(eq(user.id, newOwnerId));

    // Close DB connection
    const { client } = await import('@/db');
    await client.end();
  });

  describe('Initiate Transfer', () => {
    it('should allow owner to initiate transfer', async () => {
      const result = await ownershipTransferManager.initiateOwnershipTransfer(
        {
          organizationId: orgId,
          newOwnerId: newOwnerId,
          reason: 'Test transfer',
        },
        ownerId
      );

      expect(result.success).toBe(true);
      expect(result.transferId).toBeDefined();

      // Verify DB
      const transfer = await db.query.ownershipTransfer.findFirst({
        where: eq(ownershipTransfer.id, result.transferId!),
      });
      expect(transfer).toBeDefined();
      expect(transfer?.status).toBe('pending');
      expect(transfer?.fromUserId).toBe(ownerId);
      expect(transfer?.toUserId).toBe(newOwnerId);
    });

    it('should fail if non-owner tries to initiate', async () => {
      const result = await ownershipTransferManager.initiateOwnershipTransfer(
        {
          organizationId: orgId,
          newOwnerId: ownerId, // trying to transfer back to original owner? or doesn't matter
        },
        newOwnerId // Not the owner
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Only the current owner');
    });
  });

  describe('Cancel Transfer', () => {
    beforeEach(async () => {
      // Clean up any existing pending transfers to avoid conflicts
      await db
        .delete(ownershipTransfer)
        .where(eq(ownershipTransfer.organizationId, orgId));
    });

    it('should allow owner to cancel pending transfer', async () => {
      // Create a pending transfer first
      const initResult =
        await ownershipTransferManager.initiateOwnershipTransfer(
          { organizationId: orgId, newOwnerId: newOwnerId },
          ownerId
        );
      expect(initResult.success).toBe(true);
      const transferId = initResult.transferId!;

      // Cancel it
      const result = await ownershipTransferManager.cancelOwnershipTransfer(
        transferId,
        ownerId
      );
      expect(result.success).toBe(true);

      // Verify DB
      const transfer = await db.query.ownershipTransfer.findFirst({
        where: eq(ownershipTransfer.id, transferId),
      });
      expect(transfer?.status).toBe('cancelled');
    }, 15000); // Increased timeout
  });

  describe('Accept Transfer', () => {
    let transferId: string;

    beforeEach(async () => {
      // Ensure no pending transfers exist
      await db
        .delete(ownershipTransfer)
        .where(eq(ownershipTransfer.organizationId, orgId));

      const initResult =
        await ownershipTransferManager.initiateOwnershipTransfer(
          { organizationId: orgId, newOwnerId: newOwnerId },
          ownerId
        );
      transferId = initResult.transferId!;
    });

    it('should successfully transfer ownership', async () => {
      const result = await ownershipTransferManager.acceptOwnershipTransfer(
        transferId,
        newOwnerId
      );

      if (!result.success) {
        console.error('Accept Transfer Error:', result.error);
      }
      expect(result.success).toBe(true);

      // Verify Transfer Status
      const transfer = await db.query.ownershipTransfer.findFirst({
        where: eq(ownershipTransfer.id, transferId),
      });
      expect(transfer?.status).toBe('accepted');

      // Verify Member Roles
      const oldOwnerMember = await db.query.member.findFirst({
        where: eq(member.userId, ownerId),
      });
      const newOwnerMember = await db.query.member.findFirst({
        where: eq(member.userId, newOwnerId),
      });

      expect(oldOwnerMember?.role).toBe('admin');
      expect(newOwnerMember?.role).toBe('owner');
    }, 15000);

    it('should fail if wrong user tries to accept', async () => {
      // Create another pending transfer (first reset roles if needed?
      // The previous test changed roles. So owner is now newOwnerId.)

      // Reset roles for this test setup if necessary, or just use current state.
      // Current owner is newOwnerId. Let's try to transfer back to ownerId.

      const initResult =
        await ownershipTransferManager.initiateOwnershipTransfer(
          { organizationId: orgId, newOwnerId: ownerId },
          newOwnerId // Current owner
        );
      const tid = initResult.transferId!;

      // Random user tries to accept
      const result = await ownershipTransferManager.acceptOwnershipTransfer(
        tid,
        'random_user_id'
      );
      expect(result.success).toBe(false);
      expect(result.error).toContain('not the intended recipient');
    }, 15000); // Increased timeout
  });
});
