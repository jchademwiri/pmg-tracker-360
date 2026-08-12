'use server';

import { db } from '@pmg/db';
import { tender, client } from '@pmg/db/schema';
import { and, eq, isNull } from 'drizzle-orm';

import { validateSessionAndOrg } from './utils';
import { buildCsv } from '@/lib/csv';
import { formatDate } from '@/lib/format';
import { getStatusConfig } from '@/components/ui/status-badge';

export async function getTendersExportCsv(organizationId: string) {
  try {
    await validateSessionAndOrg(organizationId);

    const rows = await db
      .select({
        tenderNumber: tender.tenderNumber,
        clientName: client.name,
        description: tender.description,
        status: tender.status,
        priority: tender.priority,
        submissionDate: tender.submissionDate,
        briefingDate: tender.briefingDate,
        value: tender.value,
        awardValue: tender.awardValue,
        contactName: tender.contactName,
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(and(eq(tender.organizationId, organizationId), isNull(tender.deletedAt)))
      .orderBy(tender.tenderNumber);

    const headers = [
      'Tender Number',
      'Client',
      'Description',
      'Status',
      'Priority',
      'Submission Date',
      'Briefing Date',
      'Estimated Value',
      'Award Value',
      'Contact Person',
    ];

    const csv = buildCsv(
      headers,
      rows.map((row) => [
        row.tenderNumber,
        row.clientName,
        row.description,
        getStatusConfig(row.status, 'tender').label,
        row.priority,
        formatDate(row.submissionDate),
        formatDate(row.briefingDate),
        row.value,
        row.awardValue,
        row.contactName,
      ])
    );

    return {
      success: true as const,
      csv,
      filename: `tender-register-${new Date().toISOString().split('T')[0]}.csv`,
    };
  } catch (error: any) {
    console.error('Error exporting tenders CSV:', error);
    return { success: false as const, error: error.message || 'Failed to export tenders' };
  }
}
