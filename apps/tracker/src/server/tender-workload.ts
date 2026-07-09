'use server';

import { db } from '@pmg/db';
import { tender, client, document, tenderFollowUp, tenderExtension } from '@pmg/db/schema';
import { and, eq, isNull, isNotNull, inArray, lte, gte, or, sql } from 'drizzle-orm';
import { validateSessionAndOrg } from './utils';
import { nowInSAST } from '@/lib/timezone';
import { URGENCY_WINDOWS, daysFromNow } from '@/lib/urgency-windows';

export interface WorkloadStats {
  /** Tenders in active pre-submission statuses with no documents uploaded */
  missingDocuments: number;
  /** Tenders whose client has no contact name, email, or phone, and the tender itself also has no contact info */
  missingContact: number;
  /** Tenders past their submission date still in active pre-submission status */
  overdueActions: number;
  /** Tenders in submitted/evaluation status awaiting results */
  awaitingResults: number;
}

export interface CalendarEvent {
  id: string;
  type: 'closing_date' | 'briefing' | 'validity_expiry' | 'follow_up' | 'tender_extension';
  title: string;
  date: Date;
  tenderNumber: string;
  tenderId: string;
  description?: string | null;
  urgency: 'critical' | 'warning' | 'info';
}

/**
 * Returns workload statistics for the tender overview dashboard.
 * Focuses on: missing documents, missing client contact, overdue actions, awaiting results.
 */
export async function getTenderWorkloadStats(organizationId: string): Promise<{
  success: boolean;
  stats: WorkloadStats;
  error?: string;
}> {
  try {
    await validateSessionAndOrg(organizationId);

    const activeStatuses = ['new', 'review', 'approved_to_prepare', 'preparation', 'ready', 'open'];
    const now = nowInSAST();

    // Get all active tenders with client info
    const activeTenders = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        submissionDate: tender.submissionDate,
        clientId: tender.clientId,
        contactName: tender.contactName,
        contactEmail: tender.contactEmail,
        contactPhone: tender.contactPhone,
        client: {
          id: client.id,
          contactName: client.contactName,
          contactEmail: client.contactEmail,
          contactPhone: client.contactPhone,
        },
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(
        and(
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt),
          inArray(tender.status, activeStatuses)
        )
      );

    const activeTenderIds = activeTenders.map((t) => t.id);

    // Get document counts per tender
    let docTenderIds = new Set<string>();
    if (activeTenderIds.length > 0) {
      const docs = await db
        .select({ tenderId: document.tenderId })
        .from(document)
        .where(
          and(
            eq(document.organizationId, organizationId),
            inArray(document.tenderId, activeTenderIds)
          )
        );
      docTenderIds = new Set(docs.map((d) => d.tenderId).filter(Boolean) as string[]);
    }

    // Missing documents: active tenders with no uploaded documents
    const missingDocuments = activeTenders.filter((t) => !docTenderIds.has(t.id)).length;

    // Missing contact: no contact on the tender AND no contact on the client
    const missingContact = activeTenders.filter(
      (t) =>
        !t.contactName &&
        !t.contactEmail &&
        !t.contactPhone &&
        (!t.client || (!t.client.contactName && !t.client.contactEmail && !t.client.contactPhone))
    ).length;

    // Overdue: submission date in the past
    const overdueActions = activeTenders.filter(
      (t) => t.submissionDate && t.submissionDate < now
    ).length;

    // Awaiting results: in submitted/evaluation
    const awaitingResultsResult = await db
      .select({ count: tender.id })
      .from(tender)
      .where(
        and(
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt),
          inArray(tender.status, ['submitted', 'evaluation'])
        )
      );

    return {
      success: true,
      stats: {
        missingDocuments,
        missingContact,
        overdueActions,
        awaitingResults: awaitingResultsResult.length,
      },
    };
  } catch (error: any) {
    console.error('Error fetching tender workload stats:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch workload stats',
      stats: { missingDocuments: 0, missingContact: 0, overdueActions: 0, awaitingResults: 0 },
    };
  }
}

/**
 * Returns an aggregated list of upcoming calendar events for the tender overview.
 * Includes: upcoming closing dates, briefings, validity expiries, and follow-ups.
 */
export async function getTenderCalendarEvents(organizationId: string, daysAhead: number = 30): Promise<{
  success: boolean;
  events: CalendarEvent[];
  error?: string;
}> {
  try {
    await validateSessionAndOrg(organizationId);

    const now = nowInSAST();
    const horizon = new Date(now.getTime() + (daysAhead || URGENCY_WINDOWS.UPCOMING_DEADLINES_DAYS) * 24 * 60 * 60 * 1000);
    const events: CalendarEvent[] = [];

    // 1. Closing dates (submissionDate) for active pre-submission tenders
    const activeStatuses = ['new', 'review', 'approved_to_prepare', 'preparation', 'ready', 'open'];
    const closingSoon = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        submissionDate: tender.submissionDate,
        description: tender.description,
      })
      .from(tender)
      .where(
        and(
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt),
          inArray(tender.status, activeStatuses),
          isNotNull(tender.submissionDate),
          lte(tender.submissionDate, horizon),
          gte(tender.submissionDate, now)
        )
      )
      .orderBy(tender.submissionDate);

    for (const t of closingSoon) {
      if (!t.submissionDate) continue;
      const daysUntil = Math.ceil((t.submissionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      events.push({
        id: `close-${t.id}`,
        type: 'closing_date',
        title: `Closing: ${t.tenderNumber}`,
        date: t.submissionDate,
        tenderNumber: t.tenderNumber,
        tenderId: t.id,
        description: t.description,
        urgency: daysUntil <= 3 ? 'critical' : daysUntil <= 7 ? 'warning' : 'info',
      });
    }

    // 2. Upcoming briefings
    const briefings = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        briefingDate: tender.briefingDate,
        briefingLocation: tender.briefingLocation,
        description: tender.description,
      })
      .from(tender)
      .where(
        and(
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt),
          isNotNull(tender.briefingDate),
          lte(tender.briefingDate, horizon),
          gte(tender.briefingDate, now)
        )
      )
      .orderBy(tender.briefingDate);

    for (const t of briefings) {
      if (!t.briefingDate) continue;
      events.push({
        id: `brief-${t.id}`,
        type: 'briefing',
        title: `Briefing: ${t.tenderNumber}${t.briefingLocation ? ` @ ${t.briefingLocation}` : ''}`,
        date: t.briefingDate,
        tenderNumber: t.tenderNumber,
        tenderId: t.id,
        description: t.description,
        urgency: 'info',
      });
    }

    // 3. Validity expiry (evaluationDate) for tenders in submitted/evaluation/awarded
    const validityTenders = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        evaluationDate: tender.evaluationDate,
        status: tender.status,
        description: tender.description,
      })
      .from(tender)
      .where(
        and(
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt),
          inArray(tender.status, ['submitted', 'evaluation', 'awarded']),
          isNotNull(tender.evaluationDate),
          lte(tender.evaluationDate, horizon),
          gte(tender.evaluationDate, now)
        )
      )
      .orderBy(tender.evaluationDate);

    for (const t of validityTenders) {
      if (!t.evaluationDate) continue;
      const daysUntil = Math.ceil((t.evaluationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      events.push({
        id: `validity-${t.id}`,
        type: 'validity_expiry',
        title: `Validity Expiry: ${t.tenderNumber} (${t.status})`,
        date: t.evaluationDate,
        tenderNumber: t.tenderNumber,
        tenderId: t.id,
        description: t.description,
        urgency: daysUntil <= 3 ? 'critical' : daysUntil <= 7 ? 'warning' : 'info',
      });
    }

    // 4. Upcoming follow-ups
    const followUps = await db
      .select({
        id: tenderFollowUp.id,
        tenderId: tenderFollowUp.tenderId,
        followUpDate: tenderFollowUp.followUpDate,
        nextFollowUpDate: tenderFollowUp.nextFollowUpDate,
        notes: tenderFollowUp.notes,
        contactPerson: tenderFollowUp.contactPerson,
        outcome: tenderFollowUp.outcome,
        tenderNumber: tender.tenderNumber,
      })
      .from(tenderFollowUp)
      .leftJoin(tender, eq(tenderFollowUp.tenderId, tender.id))
      .where(
        and(
          eq(tenderFollowUp.organizationId, organizationId),
          or(
            and(
              isNotNull(tenderFollowUp.nextFollowUpDate),
              lte(tenderFollowUp.nextFollowUpDate, horizon),
              gte(tenderFollowUp.nextFollowUpDate, now)
            ),
            and(
              isNull(tenderFollowUp.nextFollowUpDate),
              lte(tenderFollowUp.followUpDate, horizon),
              gte(tenderFollowUp.followUpDate, now)
            )
          )
        )
      )
      .orderBy(sql`COALESCE(${tenderFollowUp.nextFollowUpDate}, ${tenderFollowUp.followUpDate})`);

    for (const f of followUps) {
      const eventDate = f.nextFollowUpDate ?? f.followUpDate;
      if (!eventDate) continue;
      events.push({
        id: `fu-${f.id}`,
        type: 'follow_up',
        title: `Follow-up: ${f.tenderNumber}${f.contactPerson ? ` (${f.contactPerson})` : ''}`,
        date: eventDate,
        tenderNumber: f.tenderNumber ?? 'Unknown',
        tenderId: f.tenderId,
        description: f.notes,
        urgency: 'info',
      });
    }

    // 5. Tender extension deadlines
    const extensions = await db
      .select({
        id: tenderExtension.id,
        tenderId: tenderExtension.tenderId,
        newEvaluationDate: tenderExtension.newEvaluationDate,
        notes: tenderExtension.notes,
        tenderNumber: tender.tenderNumber,
      })
      .from(tenderExtension)
      .leftJoin(tender, eq(tenderExtension.tenderId, tender.id))
      .where(
        and(
          eq(tenderExtension.organizationId, organizationId),
          isNull(tenderExtension.deletedAt),
          lte(tenderExtension.newEvaluationDate, horizon),
          gte(tenderExtension.newEvaluationDate, now),
          isNotNull(tenderExtension.newEvaluationDate)
        )
      )
      .orderBy(tenderExtension.newEvaluationDate);

    for (const e of extensions) {
      const daysUntil = Math.ceil((e.newEvaluationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      events.push({
        id: `ext-${e.id}`,
        type: 'tender_extension',
        title: `Extension Deadline: ${e.tenderNumber}${e.notes ? ` - ${e.notes}` : ''}`,
        date: e.newEvaluationDate,
        tenderNumber: e.tenderNumber ?? 'Unknown',
        tenderId: e.tenderId,
        description: e.notes,
        urgency: daysUntil <= 3 ? 'critical' : daysUntil <= 7 ? 'warning' : 'info',
      });
    }

    // Sort by date ascending
    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    return {
      success: true,
      events,
    };
  } catch (error: any) {
    console.error('Error fetching tender calendar events:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch calendar events',
      events: [],
    };
  }
}


