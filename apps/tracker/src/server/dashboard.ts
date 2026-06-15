import { db } from '@pmg/db';
import { tender, document, client, member, project, purchaseOrder } from '@pmg/db/schema';
import { and, eq, isNull, gte, lte, or, sql } from 'drizzle-orm';
import { validateSessionAndOrg } from './utils';
import { resolveTenderStatus } from '@/lib/tender-utils';
import { autoCloseExpiredTenders } from './tenders';
import { nowInSAST } from '@/lib/timezone';

export async function getSpecialistDashboardStats(organizationId: string) {
  try {
    await validateSessionAndOrg(organizationId);

    // Auto-close expired tenders before calculating stats
    await autoCloseExpiredTenders(organizationId);

    const now = nowInSAST();
    const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Fetch all active tenders for this organization
    const tenders = await db
      .select({
        id: tender.id,
        status: tender.status,
        submissionDate: tender.submissionDate,
        evaluationDate: tender.evaluationDate,
        tenderNumber: tender.tenderNumber,
        value: tender.value,
        clientId: tender.clientId,
      })
      .from(tender)
      .where(
        and(
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt)
        )
      );

    // Filter using status resolver
    const resolvedTenders = tenders.map(t => ({
      ...t,
      resolvedStatus: resolveTenderStatus(t.status, t.submissionDate),
    }));

    const openCount = resolvedTenders.filter(t => t.resolvedStatus === 'open').length;
    const evaluationCount = resolvedTenders.filter(t => t.resolvedStatus === 'evaluation').length;

    // Count validity deadlines approaching in next 14 days
    const validityWarnings = resolvedTenders.filter(t => {
      if (!t.evaluationDate) return false;
      const evalDate = new Date(t.evaluationDate);
      return evalDate >= now && evalDate <= fourteenDaysFromNow;
    });

    return {
      success: true,
      stats: {
        openCount,
        evaluationCount,
        validityWarningCount: validityWarnings.length,
        validityWarnings: validityWarnings.map(w => ({
          id: w.id,
          tenderNumber: w.tenderNumber,
          evaluationDate: w.evaluationDate,
        })),
      },
    };
  } catch (error: any) {
    console.error('Error fetching specialist dashboard stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch dashboard stats',
      stats: {
        openCount: 0,
        evaluationCount: 0,
        validityWarningCount: 0,
        validityWarnings: [],
      },
    };
  }
}

export async function getAdminDashboardStats(organizationId: string) {
  try {
    await validateSessionAndOrg(organizationId);

    // Auto-close expired tenders before calculating stats
    await autoCloseExpiredTenders(organizationId);

    // Fetch all active tenders for this organization
    const tenders = await db
      .select({
        id: tender.id,
        status: tender.status,
        submissionDate: tender.submissionDate,
        value: tender.value,
      })
      .from(tender)
      .where(
        and(
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt)
        )
      );

    const resolvedTenders = tenders.map(t => ({
      ...t,
      resolvedStatus: resolveTenderStatus(t.status, t.submissionDate),
      parsedValue: parseFloat(t.value || '0'),
    }));

    // Funnel Values
    const openValue = resolvedTenders
      .filter(t => t.resolvedStatus === 'open')
      .reduce((sum, t) => sum + (isNaN(t.parsedValue) ? 0 : t.parsedValue), 0);

    const evaluationValue = resolvedTenders
      .filter(t => t.resolvedStatus === 'evaluation')
      .reduce((sum, t) => sum + (isNaN(t.parsedValue) ? 0 : t.parsedValue), 0);

    const awardedValue = resolvedTenders
      .filter(t => t.resolvedStatus === 'awarded')
      .reduce((sum, t) => sum + (isNaN(t.parsedValue) ? 0 : t.parsedValue), 0);

    return {
      success: true,
      data: [
        { name: 'Open Tenders', value: openValue },
        { name: 'Under Evaluation', value: evaluationValue },
        { name: 'Appointed / Awarded', value: awardedValue },
      ],
    };
  } catch (error: any) {
    console.error('Error fetching admin dashboard stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch admin dashboard stats',
      data: [],
    };
  }
}

export async function getOperationalRisks(organizationId: string): Promise<{
  success: boolean;
  risks: {
    overdueDeliveries: {
      count: number;
      items: { id: string; poNumber: string; supplierName: string | null; expectedDeliveryDate: Date | null; totalAmount: string }[];
    };
    awardedAwaitingConversion: {
      count: number;
      items: { id: string; tenderNumber: string; clientName: string; value: string | null }[];
    };
    expiringValidity: {
      count: number;
      items: { id: string; tenderNumber: string; evaluationDate: Date | null; value: string | null }[];
    };
    missingDocuments: {
      count: number;
      items: { id: string; tenderNumber: string; description: string | null }[];
    };
  };
}> {
  try {
    await validateSessionAndOrg(organizationId);
    const now = nowInSAST();
    const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    // 1. Overdue PO deliveries
    const pos = await db
      .select({
        id: purchaseOrder.id,
        poNumber: purchaseOrder.poNumber,
        supplierName: purchaseOrder.supplierName,
        expectedDeliveryDate: purchaseOrder.expectedDeliveryDate,
        totalAmount: purchaseOrder.totalAmount,
        status: purchaseOrder.status,
      })
      .from(purchaseOrder)
      .where(
        and(
          eq(purchaseOrder.organizationId, organizationId),
          lte(purchaseOrder.expectedDeliveryDate, now),
          isNull(purchaseOrder.deletedAt)
        )
      );
    const overduePOs = pos.filter(
      (po) => !['delivered', 'completed', 'cancelled'].includes(po.status)
    );

    // 2. Awarded Tenders Awaiting Project Conversion
    const tenders = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        status: tender.status,
        submissionDate: tender.submissionDate,
        evaluationDate: tender.evaluationDate,
        value: tender.value,
        clientId: tender.clientId,
        description: tender.description,
      })
      .from(tender)
      .where(
        and(
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt)
        )
      );

    const resolvedTenders = tenders.map((t) => ({
      ...t,
      resolvedStatus: resolveTenderStatus(t.status, t.submissionDate),
    }));

    const awardedTenders = resolvedTenders.filter((t) => t.resolvedStatus === 'awarded');
    const awardedTenderIds = awardedTenders.map((t) => t.id);

    let awardedAwaitingConversion: typeof awardedTenders = [];
    if (awardedTenderIds.length > 0) {
      const projects = await db
        .select({ tenderId: project.tenderId })
        .from(project)
        .where(
          and(
            eq(project.organizationId, organizationId),
            isNull(project.deletedAt)
          )
        );
      const projectTenderIds = new Set(projects.map((p) => p.tenderId).filter(Boolean));
      awardedAwaitingConversion = awardedTenders.filter((t) => !projectTenderIds.has(t.id));
    }

    const clients = await db
      .select({ id: client.id, name: client.name })
      .from(client)
      .where(eq(client.organizationId, organizationId));
    const clientMap = new Map(clients.map((c) => [c.id, c.name]));

    const awardedItems = awardedAwaitingConversion.map((t) => ({
      id: t.id,
      tenderNumber: t.tenderNumber,
      clientName: clientMap.get(t.clientId) || 'Unknown Client',
      value: t.value,
    }));

    // 3. Expiring validity (tenders under evaluation expiring in 14 days)
    const expiringTenders = resolvedTenders.filter((t) => {
      if (t.resolvedStatus !== 'evaluation' || !t.evaluationDate) return false;
      const evalDate = new Date(t.evaluationDate);
      return evalDate >= now && evalDate <= fourteenDaysFromNow;
    });

    const expiringItems = expiringTenders.map((t) => ({
      id: t.id,
      tenderNumber: t.tenderNumber,
      evaluationDate: t.evaluationDate,
      value: t.value,
    }));

    // 4. Active tenders missing documents
    const activeTenders = resolvedTenders.filter((t) => t.resolvedStatus === 'open');
    const activeTenderIds = activeTenders.map((t) => t.id);
    let missingDocTenders: typeof activeTenders = [];
    if (activeTenderIds.length > 0) {
      const docs = await db
        .select({ tenderId: document.tenderId })
        .from(document)
        .where(eq(document.organizationId, organizationId));
      const docTenderIds = new Set(docs.map((d) => d.tenderId).filter(Boolean));
      missingDocTenders = activeTenders.filter((t) => !docTenderIds.has(t.id));
    }

    const missingDocItems = missingDocTenders.map((t) => ({
      id: t.id,
      tenderNumber: t.tenderNumber,
      description: t.description,
    }));

    return {
      success: true,
      risks: {
        overdueDeliveries: {
          count: overduePOs.length,
          items: overduePOs.map((po) => ({
            id: po.id,
            poNumber: po.poNumber,
            supplierName: po.supplierName,
            expectedDeliveryDate: po.expectedDeliveryDate,
            totalAmount: po.totalAmount,
          })),
        },
        awardedAwaitingConversion: {
          count: awardedItems.length,
          items: awardedItems,
        },
        expiringValidity: {
          count: expiringItems.length,
          items: expiringItems,
        },
        missingDocuments: {
          count: missingDocItems.length,
          items: missingDocItems,
        },
      },
    };
  } catch (error: any) {
    console.error('Error fetching operational risks:', error);
    return {
      success: false,
      risks: {
        overdueDeliveries: { count: 0, items: [] },
        awardedAwaitingConversion: { count: 0, items: [] },
        expiringValidity: { count: 0, items: [] },
        missingDocuments: { count: 0, items: [] },
      },
    };
  }
}

