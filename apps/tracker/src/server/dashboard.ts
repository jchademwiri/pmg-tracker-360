import { db } from '@pmg/db';
import { tender } from '@pmg/db/schema';
import { and, eq, isNull } from 'drizzle-orm';
import { validateSessionAndOrg } from './utils';
import { resolveTenderStatus } from '@/lib/tender-utils';
import { autoCloseExpiredTenders } from './tenders';
import { nowInSAST } from '@/lib/timezone';
import { URGENCY_WINDOWS } from '@/lib/urgency-windows';

export async function getSpecialistDashboardStats(organizationId: string) {
  try {
    await validateSessionAndOrg(organizationId);

    // Auto-close expired tenders before calculating stats
    await autoCloseExpiredTenders(organizationId);

    const now = nowInSAST();
    const fourteenDaysFromNow = new Date(now.getTime() + URGENCY_WINDOWS.CLOSING_SOON_DAYS * 24 * 60 * 60 * 1000);

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


