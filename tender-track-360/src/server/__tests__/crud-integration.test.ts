/**
 * @jest-environment node
 */
import { db } from '@/db';
import {
  organization,
  client,
  tender,
  project,
  purchaseOrder,
} from '@/db/schema';
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} from '@/server/clients';
import { deleteTender } from '@/server/tenders';
import { deleteProject } from '@/server/projects';
import { eq } from 'drizzle-orm';

// Mock revalidatePath to avoid Next.js errors in test environment
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

// Mock console.error to avoid noise and potential Jest issues with ZodError logging
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

describe('Client CRUD Integration Tests', () => {
  let testOrgId: string;
  const TEST_PREFIX = 'TEST_RUN_' + Date.now();

  beforeAll(async () => {
    // Create a test organization
    testOrgId = `org_${Date.now()}`;
    await db.insert(organization).values({
      id: testOrgId,
      name: `${TEST_PREFIX}_Org`,
      createdAt: new Date(),
    });
  });

  afterAll(async () => {
    // Cleanup: Delete the test organization (cascades to clients)
    if (testOrgId) {
      await db.delete(organization).where(eq(organization.id, testOrgId));
    }
    // Close DB connection
    const { client } = await import('@/db');
    await client.end();
  });

  describe('Create Client', () => {
    it('should create a new client successfully', async () => {
      const clientData = {
        name: `${TEST_PREFIX}_Client`,
        contactName: 'John Doe',
        contactEmail: 'john@example.com',
        contactPhone: '1234567890',
      };

      const result = await createClient(testOrgId, clientData);

      expect(result.success).toBe(true);
      expect(result.client).toBeDefined();
      expect(result.client?.name).toBe(clientData.name);
      expect(result.client?.organizationId).toBe(testOrgId);

      // Verify in DB
      const dbClient = await db.query.client.findFirst({
        where: eq(client.id, result.client!.id),
      });
      expect(dbClient).toBeDefined();
      expect(dbClient?.name).toBe(clientData.name);
    });

    it('should fail validation with invalid email', async () => {
      const clientData = {
        name: `${TEST_PREFIX}_Invalid`,
        contactEmail: 'invalid-email',
      };

      const result = await createClient(testOrgId, clientData as any);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid input data');
    });
  });

  describe('Read Client', () => {
    let clientId: string;

    beforeAll(async () => {
      // Create a client for reading
      const res = await createClient(testOrgId, {
        name: `${TEST_PREFIX}_Read_Client`,
      });
      if (res.client) clientId = res.client.id;
    });

    it('should get client by ID', async () => {
      const result = await getClientById(testOrgId, clientId);
      expect(result.success).toBe(true);
      expect(result.client?.id).toBe(clientId);
    });

    it('should list clients with pagination', async () => {
      const result = await getClients(testOrgId);
      expect(result.clients.length).toBeGreaterThan(0);
      const found = result.clients.find((c) => c.id === clientId);
      expect(found).toBeDefined();
    });
  });

  describe('Update Client', () => {
    let clientId: string;

    beforeAll(async () => {
      const res = await createClient(testOrgId, {
        name: `${TEST_PREFIX}_Update_Client`,
      });
      if (res.client) clientId = res.client.id;
    });

    it('should update client details', async () => {
      const updateData = {
        name: `${TEST_PREFIX}_Updated_Name`,
        notes: 'Updated notes',
      };

      const result = await updateClient(testOrgId, clientId, updateData);

      expect(result.success).toBe(true);
      expect(result.client?.name).toBe(updateData.name);
      expect(result.client?.notes).toBe(updateData.notes);

      // Verify in DB
      const dbClient = await db.query.client.findFirst({
        where: eq(client.id, clientId),
      });
      expect(dbClient?.name).toBe(updateData.name);
    });
  });

  describe('Delete Client', () => {
    let clientId: string;

    beforeAll(async () => {
      const res = await createClient(testOrgId, {
        name: `${TEST_PREFIX}_Delete_Client`,
      });
      if (res.client) clientId = res.client.id;
    });

    it('should soft delete client', async () => {
      const result = await deleteClient(testOrgId, clientId);

      expect(result.success).toBe(true);

      // Verify soft delete in DB
      const dbClient = await db.query.client.findFirst({
        where: eq(client.id, clientId),
      });
      expect(dbClient?.deletedAt).not.toBeNull();

      // Verify it doesn't show up in getClients
      const listResult = await getClients(testOrgId);
      const found = listResult.clients.find((c) => c.id === clientId);
      expect(found).toBeUndefined();
    });
  });

  describe('Safe Deletion Constraints', () => {
    let clientId: string;
    let tenderId: string;
    let projectId: string;
    let poId: string;

    beforeAll(async () => {
      // Create Client
      const clientRes = await createClient(testOrgId, {
        name: `${TEST_PREFIX}_Safe_Client`,
      });
      clientId = clientRes.client!.id;

      // Create Tender linked to Client
      tenderId = `tender_${Date.now()}`;
      await db.insert(tender).values({
        id: tenderId,
        organizationId: testOrgId,
        tenderNumber: `TND_${Date.now()}`,
        clientId: clientId,
        description: 'Safe Deletion Test Tender',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create Project linked to Tender
      projectId = `proj_${Date.now()}`;
      await db.insert(project).values({
        id: projectId,
        organizationId: testOrgId,
        projectNumber: `PRJ_${Date.now()}`,
        clientId: clientId,
        tenderId: tenderId,
        description: 'Safe Deletion Test Project',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create Active Purchase Order linked to Project
      poId = `po_${Date.now()}`;
      await db.insert(purchaseOrder).values({
        id: poId,
        organizationId: testOrgId,
        projectId: projectId,
        poNumber: `PO_${Date.now()}`,
        description: 'Safe Deletion Test PO',
        totalAmount: '1000',
        status: 'sent', // Active status
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('should prevent deleting Project with active Purchase Orders', async () => {
      const result = await deleteProject(testOrgId, projectId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('active purchase orders');
    });

    it('should prevent deleting Tender with active Projects', async () => {
      const result = await deleteTender(testOrgId, tenderId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('active projects');
    });

    it('should prevent deleting Client with active Tenders', async () => {
      const result = await deleteClient(testOrgId, clientId);
      expect(result.success).toBe(false);
      expect(result.error).toContain('active tenders');
    });

    it('should allow deletion after dependencies are removed', async () => {
      // 1. Delete PO
      await db
        .update(purchaseOrder)
        .set({ deletedAt: new Date() })
        .where(eq(purchaseOrder.id, poId));

      // 2. Delete Project (Should now succeed)
      const projResult = await deleteProject(testOrgId, projectId);
      expect(projResult.success).toBe(true);

      // 3. Delete Tender (Should now succeed)
      const tenderResult = await deleteTender(testOrgId, tenderId);
      expect(tenderResult.success).toBe(true);

      // 4. Delete Client (Should now succeed)
      const clientResult = await deleteClient(testOrgId, clientId);
      expect(clientResult.success).toBe(true);
    }, 15000);
  });
});
