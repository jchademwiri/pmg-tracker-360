'use server';

import { db } from '@/db';
import { tender, project, purchaseOrder } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getReportStats(organizationId: string) {
  try {
    // 1. Fetch Tenders Stats
    const tenders = await db
      .select({
        status: tender.status,
        value: tender.value,
      })
      .from(tender)
      .where(and(eq(tender.organizationId, organizationId)));

    // 2. Fetch Active Projects Count
    const projectsConfig = await db
      .select({ count: sql<number>`count(*)` })
      .from(project)
      .where(
        and(
          eq(project.organizationId, organizationId),
          eq(project.status, 'active')
        )
      );

    const activeProjectsCount = Number(projectsConfig[0]?.count || 0);

    // 3. Fetch Purchase Orders Stats
    const purchaseOrders = await db
      .select({
        totalAmount: purchaseOrder.totalAmount,
      })
      .from(purchaseOrder)
      .where(eq(purchaseOrder.organizationId, organizationId));

    // 4. Aggregate Data
    let totalTenders = 0;
    let wonTenders = 0;
    let lostTenders = 0;
    let pendingTenders = 0; // submitted or pending
    let pipelineValue = 0;
    let totalWonValue = 0; // Was "revenueSecured" - now "Total Won Value"
    let poRevenue = 0; // New "Guaranteed" revenue

    // Calc Tender Stats
    for (const t of tenders) {
      totalTenders++;
      const val = parseFloat(t.value || '0');

      if (t.status === 'won') {
        wonTenders++;
        totalWonValue += val;
      } else if (t.status === 'lost') {
        lostTenders++;
      } else if (t.status === 'submitted' || t.status === 'pending') {
        pendingTenders++;
        pipelineValue += val;
      }
    }

    // Calc PO Stats
    for (const po of purchaseOrders) {
      const val = parseFloat(po.totalAmount || '0');
      poRevenue += val;
    }

    // Calculate Win Rate
    const decidedTenders = wonTenders + lostTenders;
    const winRate =
      decidedTenders > 0 ? Math.round((wonTenders / decidedTenders) * 100) : 0;

    return {
      success: true,
      stats: {
        totalTenders,
        wonTenders,
        lostTenders,
        pendingTenders,
        activeProjects: activeProjectsCount,
        winRate,
        pipelineValue, // Potential value of pending tenders
        totalWonValue, // Value of won tenders (Contracts Booked)
        poRevenue, // Value of Purchase Orders (Guaranteed)
      },
    };
  } catch (error) {
    console.error('Failed to fetch report stats:', error);
    return {
      success: false,
      error: 'Failed to fetch report statistics',
      stats: {
        totalTenders: 0,
        wonTenders: 0,
        lostTenders: 0,
        pendingTenders: 0,
        activeProjects: 0,
        winRate: 0,
        pipelineValue: 0,
        totalWonValue: 0,
        poRevenue: 0,
      },
    };
  }
}
