'use server';

import { db } from '@pmg/db';
import { tender, project, purchaseOrder, tenderFollowUp, document } from '@pmg/db/schema';
import { and, eq, isNull, lte, gte } from 'drizzle-orm';
import { validateSessionAndOrg } from './utils';
import { resolveTenderStatus } from '@/lib/tender-utils';
import { nowInSAST } from '@/lib/timezone';
import { URGENCY_WINDOWS } from '@/lib/urgency-windows';

export interface UrgencyData {
  closingThisWeek: number;
  overdueTenders: number;
  underEvaluation: number;
  totalOpen: number;
  dueFollowUps: number;
  missingDocuments: number;
  overdueDeliveries: number;
}

export interface WorkflowCounts {
  closingSoon: number;
  awardedAwaitingConversion: number;
  overdue: number;
}

/**
 * Aggregated urgency counts for the dashboard action queue banner.
 * Answers: "What needs attention today?"
 */
/** Shared helper: fetch all active tenders for an org with resolved statuses */
async function resolveOrgTenders(organizationId: string) {
  await validateSessionAndOrg(organizationId);

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

  return tenders.map((t) => ({
    ...t,
    resolved: resolveTenderStatus(t.status, t.submissionDate),
  }));
}

export async function getDashboardUrgency(organizationId: string): Promise<{
  success: boolean;
  urgency: UrgencyData;
}> {
  try {
    const now = nowInSAST();
    const sevenDaysFromNow = new Date(now.getTime() + URGENCY_WINDOWS.CLOSING_THIS_WEEK_DAYS * 24 * 60 * 60 * 1000);

    const resolved = await resolveOrgTenders(organizationId);

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

    // Due Follow-ups (nextFollowUpDate <= now and outcome is empty/null)
    const followUps = await db
      .select({
        id: tenderFollowUp.id,
        nextFollowUpDate: tenderFollowUp.nextFollowUpDate,
        outcome: tenderFollowUp.outcome,
      })
      .from(tenderFollowUp)
      .where(eq(tenderFollowUp.organizationId, organizationId));

    const dueFollowUps = followUps.filter(
      (f) =>
        f.nextFollowUpDate &&
        new Date(f.nextFollowUpDate) <= now &&
        (!f.outcome || f.outcome.trim() === '')
    ).length;

    // Missing Documents (active/open tenders with 0 uploaded documents)
    const activeTenders = resolved.filter((t) => t.resolved === 'open');
    const activeTenderIds = activeTenders.map((t) => t.id);
    let missingDocuments = 0;
    if (activeTenderIds.length > 0) {
      const docs = await db
        .select({
          tenderId: document.tenderId,
        })
        .from(document)
        .where(eq(document.organizationId, organizationId));

      const docTenderIds = new Set(docs.map((d) => d.tenderId).filter(Boolean));
      missingDocuments = activeTenders.filter((t) => !docTenderIds.has(t.id)).length;
    }

    // Overdue Deliveries (expectedDeliveryDate <= now, and status is not delivered/completed/cancelled)
    const candidatePOs = await db
      .select({
        id: purchaseOrder.id,
        status: purchaseOrder.status,
        expectedDeliveryDate: purchaseOrder.expectedDeliveryDate,
      })
      .from(purchaseOrder)
      .where(
        and(
          eq(purchaseOrder.organizationId, organizationId),
          lte(purchaseOrder.expectedDeliveryDate, now),
          isNull(purchaseOrder.deletedAt)
        )
      );

    const overdueDeliveries = candidatePOs.filter(
      (po) => !['delivered', 'completed', 'cancelled'].includes(po.status)
    ).length;

    return {
      success: true,
      urgency: {
        closingThisWeek,
        overdueTenders,
        underEvaluation,
        totalOpen,
        dueFollowUps,
        missingDocuments,
        overdueDeliveries,
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
        dueFollowUps: 0,
        missingDocuments: 0,
        overdueDeliveries: 0,
      },
    };
  }
}

/**
 * Workflow shortcut counts for sidebar badge indicators.
 * Returns counts for: closing soon tenders, awarded awaiting project conversion, overdue items.
 */
export async function getWorkflowCounts(organizationId: string): Promise<{
  success: boolean;
  counts: WorkflowCounts;
}> {
  try {
    const now = nowInSAST();
    const sevenDaysFromNow = new Date(now.getTime() + URGENCY_WINDOWS.CLOSING_THIS_WEEK_DAYS * 24 * 60 * 60 * 1000);

    const resolved = await resolveOrgTenders(organizationId);

    // Closing soon: open tenders with submission date within 7 days
    const closingSoon = resolved.filter(
      (t) =>
        t.resolved === 'open' &&
        t.submissionDate &&
        t.submissionDate >= now &&
        t.submissionDate <= sevenDaysFromNow
    ).length;

    // Overdue: open tenders past submission date
    const overdue = resolved.filter(
      (t) =>
        t.resolved === 'open' &&
        t.submissionDate &&
        t.submissionDate < now
    ).length;

    // Awarded tenders without a linked project (awaiting conversion)
    const awardedTenderIds = resolved
      .filter((t) => t.resolved === 'awarded')
      .map((t) => t.id);

    let awardedAwaitingConversion = 0;
    if (awardedTenderIds.length > 0) {
      // Find projects linked to these tenders
      const linkedProjects = await db
        .select({ tenderId: project.tenderId })
        .from(project)
        .where(
          and(
            eq(project.organizationId, organizationId),
            isNull(project.deletedAt)
          )
        );

      const linkedTenderIds = new Set(
        linkedProjects.map((p) => p.tenderId).filter(Boolean)
      );

      awardedAwaitingConversion = awardedTenderIds.filter(
        (id) => !linkedTenderIds.has(id)
      ).length;
    }

    return {
      success: true,
      counts: {
        closingSoon,
        awardedAwaitingConversion,
        overdue,
      },
    };
  } catch (error: any) {
    console.error('Error fetching workflow counts:', error);
    return {
      success: false,
      counts: {
        closingSoon: 0,
        awardedAwaitingConversion: 0,
        overdue: 0,
      },
    };
  }
}
