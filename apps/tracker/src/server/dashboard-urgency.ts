'use server';

import { db } from '@pmg/db';
import { tender, project, purchaseOrder } from '@pmg/db/schema';
import { and, eq, isNull, lte, gte } from 'drizzle-orm';
import { validateSessionAndOrg } from './utils';
import { resolveTenderStatus } from '@/lib/tender-utils';
import { nowInSAST } from '@/lib/timezone';

export interface UrgencyData {
  closingThisWeek: number;
  overdueTenders: number;
  underEvaluation: number;
  totalOpen: number;
}

/**
 * Aggregated urgency counts for the dashboard action queue banner.
 * Answers: "What needs attention today?"
 */
export async function getDashboardUrgency(organizationId: string): Promise<{
  success: boolean;
  urgency: UrgencyData;
}> {
  try {
    await validateSessionAndOrg(organizationId);

    const now = nowInSAST();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Fetch all active tenders
    const tenders = await db
      .select({
        id: tender.id,
        status: tender.status,
        submissionDate: tender.submissionDate,
      })
      .from(tender)
      .where(
        and(
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt)
        )
      );

    // Resolve dynamic statuses
    const resolved = tenders.map((t) => ({
      ...t,
      resolved: resolveTenderStatus(t.status, t.submissionDate),
    }));

    // Tenders closing within 7 days (and still open)
    const closingThisWeek = resolved.filter(
      (t) =>
        t.resolved === 'open' &&
        t.submissionDate &&
        t.submissionDate >= now &&
        t.submissionDate <= sevenDaysFromNow
    ).length;

    // Overdue tenders (submission date passed, still open)
    const overdueTenders = resolved.filter(
      (t) =>
        t.resolved === 'open' &&
        t.submissionDate &&
        t.submissionDate < now
    ).length;

    // Under evaluation
    const underEvaluation = resolved.filter(
      (t) => t.resolved === 'evaluation'
    ).length;

    // Total open
    const totalOpen = resolved.filter((t) => t.resolved === 'open').length;

    return {
      success: true,
      urgency: {
        closingThisWeek,
        overdueTenders,
        underEvaluation,
        totalOpen,
      },
    };
  } catch (error: any) {
    console.error('Error fetching dashboard urgency:', error);
    return {
      success: false,
      urgency: {
        closingThisWeek: 0,
        overdueTenders: 0,
        underEvaluation: 0,
        totalOpen: 0,
      },
    };
  }
}
