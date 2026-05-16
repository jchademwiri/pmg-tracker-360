'use server';

import { db } from '@/db';
import { tender, purchaseOrder, client } from '@/db/schema';
import { and, eq, gte, isNull, lte, inArray } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserOrganizationMembership } from '@/server/organizations';

type CalendarEventType =
  | 'tender_submission'
  | 'po_expected_delivery'
  | 'po_delivered';

export interface GetCalendarEventsParams {
  start: string; // ISO string UTC
  end: string; // ISO string UTC
  types?: CalendarEventType[];
  status?: string[]; // tender or PO status values
  clientId?: string;
}

export interface CalendarEventItem {
  id: string;
  type: CalendarEventType;
  title: string;
  date: string; // ISO UTC
  color: string; // token key e.g. 'primary'
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

const EVENT_TYPE_TO_COLOR: Record<CalendarEventType, string> = {
  tender_submission: 'primary',
  po_expected_delivery: 'warning',
  po_delivered: 'success',
};

function clampRange(start: Date, end: Date) {
  // Limit to max 6 months span
  const maxMs = 1000 * 60 * 60 * 24 * 31 * 6;
  if (end.getTime() - start.getTime() > maxMs) {
    const clampedEnd = new Date(start.getTime() + maxMs);
    return { start, end: clampedEnd };
  }
  return { start, end };
}

export async function getCalendarEvents(
  params: GetCalendarEventsParams
): Promise<CalendarEventItem[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return [];
  }

  const membership = await getUserOrganizationMembership(
    session.user.id,
    session.session.activeOrganizationId as string
  );
  if (!membership) {
    return [];
  }

  const startDate = new Date(params.start);
  const endDate = new Date(params.end);
  const { start, end } = clampRange(startDate, endDate);

  const typeFilter =
    params.types && params.types.length > 0
      ? params.types
      : ([
          'tender_submission',
          'po_expected_delivery',
          'po_delivered',
        ] as CalendarEventType[]);

  const statusFilter =
    params.status && params.status.length > 0 ? params.status : undefined;
  const clientId = params.clientId || undefined;

  const events: CalendarEventItem[] = [];

  // Tenders: submission dates
  if (typeFilter.includes('tender_submission')) {
    const tenderWhere = and(
      eq(tender.organizationId, membership.organizationId),
      isNull(tender.deletedAt),
      gte(tender.submissionDate, start),
      lte(tender.submissionDate, end),
      clientId ? eq(tender.clientId, clientId) : undefined,
      statusFilter ? inArray(tender.status, statusFilter) : undefined
    );

    const tenderRows = await db
      .select({
        id: tender.id,
        tenderNumber: tender.tenderNumber,
        submissionDate: tender.submissionDate,
        status: tender.status,
        clientName: client.name,
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(tenderWhere);

    for (const row of tenderRows) {
      if (!row.submissionDate) continue;
      events.push({
        id: row.id,
        type: 'tender_submission',
        title: `${row.tenderNumber} submission`,
        date: row.submissionDate.toISOString(),
        color: EVENT_TYPE_TO_COLOR.tender_submission,
        metadata: {
          status: row.status,
          clientName: row.clientName,
          tenderId: row.id,
        },
      });
    }
  }

  // POs: expected delivery
  if (typeFilter.includes('po_expected_delivery')) {
    const poExpectedWhere = and(
      eq(purchaseOrder.organizationId, membership.organizationId),
      isNull(purchaseOrder.deletedAt),
      gte(purchaseOrder.expectedDeliveryDate, start),
      lte(purchaseOrder.expectedDeliveryDate, end),
      statusFilter ? inArray(purchaseOrder.status, statusFilter) : undefined
    );

    const poExpectedRows = await db
      .select({
        id: purchaseOrder.id,
        expectedDeliveryDate: purchaseOrder.expectedDeliveryDate,
        status: purchaseOrder.status,
        description: purchaseOrder.description,
      })
      .from(purchaseOrder)
      .where(poExpectedWhere);

    for (const row of poExpectedRows) {
      if (!row.expectedDeliveryDate) continue;
      events.push({
        id: row.id,
        type: 'po_expected_delivery',
        title: `PO expected: ${row.description}`,
        date: row.expectedDeliveryDate.toISOString(),
        color: EVENT_TYPE_TO_COLOR.po_expected_delivery,
        metadata: {
          status: row.status,
          purchaseOrderId: row.id,
        },
      });
    }
  }

  // POs: delivered
  if (typeFilter.includes('po_delivered')) {
    const poDeliveredWhere = and(
      eq(purchaseOrder.organizationId, membership.organizationId),
      isNull(purchaseOrder.deletedAt),
      gte(purchaseOrder.deliveredAt, start),
      lte(purchaseOrder.deliveredAt, end),
      statusFilter ? inArray(purchaseOrder.status, statusFilter) : undefined
    );

    const poDeliveredRows = await db
      .select({
        id: purchaseOrder.id,
        deliveredAt: purchaseOrder.deliveredAt,
        status: purchaseOrder.status,
        description: purchaseOrder.description,
      })
      .from(purchaseOrder)
      .where(poDeliveredWhere);

    for (const row of poDeliveredRows) {
      if (!row.deliveredAt) continue;
      events.push({
        id: row.id,
        type: 'po_delivered',
        title: `PO delivered: ${row.description}`,
        date: row.deliveredAt.toISOString(),
        color: EVENT_TYPE_TO_COLOR.po_delivered,
        metadata: {
          status: row.status,
          purchaseOrderId: row.id,
        },
      });
    }
  }

  return events;
}
