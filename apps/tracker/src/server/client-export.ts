'use server';

import { db } from '@pmg/db';
import { client } from '@pmg/db/schema';
import { validateSessionAndOrg } from './utils';
import { eq, and, isNull } from 'drizzle-orm';

export async function getClientsExportCsv(organizationId: string) {
  try {
    await validateSessionAndOrg(organizationId);

    const clients = await db
      .select({
        name: client.name,
        contactName: client.contactName,
        contactEmail: client.contactEmail,
        contactPhone: client.contactPhone,
        notes: client.notes,
        createdAt: client.createdAt,
      })
      .from(client)
      .where(
        and(
          eq(client.organizationId, organizationId),
          isNull(client.deletedAt)
        )
      )
      .orderBy(client.name);

    // Build CSV
    const header = 'Name,Contact Person,Email,Phone,Notes,Created';
    const rows = clients.map((c) => {
      const escape = (val: string | null | undefined) => {
        if (!val) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      return [
        escape(c.name),
        escape(c.contactName),
        escape(c.contactEmail),
        escape(c.contactPhone),
        escape(c.notes),
        escape(c.createdAt?.toISOString().split('T')[0]),
      ].join(',');
    });

    const csv = [header, ...rows].join('\n');

    return { success: true, csv, filename: `clients-export-${new Date().toISOString().split('T')[0]}.csv` };
  } catch (error: any) {
    console.error('Error exporting clients CSV:', error);
    return { success: false, error: error.message || 'Failed to export clients' };
  }
}
