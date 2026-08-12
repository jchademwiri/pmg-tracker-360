'use server';

import { db } from '@pmg/db';
import { tender, client, organization } from '@pmg/db/schema';
import { and, eq, inArray, isNull } from 'drizzle-orm';

import { validateSessionAndOrg } from './utils';

export type TenderWinLossReportData = {
  org: { name: string; logo: string | null; metadata: unknown };
  summary: {
    wonCount: number;
    lostCount: number;
    decidedCount: number;
    winRate: number;
    totalWonValue: number;
    totalLostValue: number;
  };
  awarded: Array<{
    tenderNumber: string;
    clientName: string | null;
    submissionDate: Date | null;
    awardValue: string | null;
  }>;
  lost: Array<{
    tenderNumber: string;
    clientName: string | null;
    submissionDate: Date | null;
    value: string | null;
    lossReason: string | null;
  }>;
  lossReasons: Array<{ reason: string; count: number }>;
};

export async function getTenderWinLossReport(organizationId: string) {
  try {
    await validateSessionAndOrg(organizationId);

    const org = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
    });
    if (!org) {
      return { success: false as const, error: 'Organization not found' };
    }

    const decided = await db
      .select({
        tenderNumber: tender.tenderNumber,
        clientName: client.name,
        submissionDate: tender.submissionDate,
        value: tender.value,
        awardValue: tender.awardValue,
        status: tender.status,
        lossReason: tender.lossReason,
      })
      .from(tender)
      .leftJoin(client, eq(tender.clientId, client.id))
      .where(
        and(
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt),
          inArray(tender.status, ['awarded', 'lost'])
        )
      )
      .orderBy(tender.tenderNumber);

    const awarded = decided
      .filter((row) => row.status === 'awarded')
      .map((row) => ({
        tenderNumber: row.tenderNumber,
        clientName: row.clientName,
        submissionDate: row.submissionDate,
        awardValue: row.awardValue,
      }));

    const lost = decided
      .filter((row) => row.status === 'lost')
      .map((row) => ({
        tenderNumber: row.tenderNumber,
        clientName: row.clientName,
        submissionDate: row.submissionDate,
        value: row.value,
        lossReason: row.lossReason,
      }));

    const totalWonValue = awarded.reduce((sum, row) => sum + (parseFloat(row.awardValue || '0') || 0), 0);
    const totalLostValue = lost.reduce((sum, row) => sum + (parseFloat(row.value || '0') || 0), 0);
    const decidedCount = awarded.length + lost.length;
    const winRate = decidedCount > 0 ? Math.round((awarded.length / decidedCount) * 100) : 0;

    const reasonCounts = new Map<string, number>();
    for (const row of lost) {
      const reason = row.lossReason?.trim() || 'Not specified';
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    }
    const lossReasons = Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    const data: TenderWinLossReportData = {
      org: { name: org.name, logo: org.logo, metadata: org.metadata },
      summary: {
        wonCount: awarded.length,
        lostCount: lost.length,
        decidedCount,
        winRate,
        totalWonValue,
        totalLostValue,
      },
      awarded,
      lost,
      lossReasons,
    };

    return { success: true as const, data };
  } catch (error: any) {
    console.error('Error building tender win/loss report:', error);
    return { success: false as const, error: error.message || 'Failed to build report' };
  }
}
