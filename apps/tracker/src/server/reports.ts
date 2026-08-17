"use server";

import { db } from "@pmg/db";
import { tender, project, purchaseOrder } from "@pmg/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { resolveTenderStatus } from "@/lib/tender-utils";
import { validateSessionAndOrg } from "./utils";

export type TenderSubmissionTrendPoint = {
  key: string; // e.g. "2026-03"
  label: string; // e.g. "Mar" or "Jan '26" at year boundaries
  count: number; // total submitted that month
  won: number;
  lost: number;
  pending: number;
};

export async function getTenderSubmissionTrend(organizationId: string) {
  try {
    await validateSessionAndOrg(organizationId);

    // Build the last 12 months (including the current one), oldest first.
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      const monthIndex = date.getMonth();
      const label =
        monthIndex === 0
          ? `${date.toLocaleString("en-US", { month: "short" })} '${String(date.getFullYear()).slice(2)}`
          : date.toLocaleString("en-US", { month: "short" });
      return {
        key: `${date.getFullYear()}-${String(monthIndex + 1).padStart(2, "0")}`,
        label,
      };
    });

    const rows = await db
      .select({
        submissionDate: tender.submissionDate,
        status: tender.status,
      })
      .from(tender)
      .where(
        and(
          eq(tender.organizationId, organizationId),
          isNull(tender.deletedAt),
        ),
      );

    const counts = new Map(
      months.map((m) => [m.key, { count: 0, won: 0, lost: 0, pending: 0 }]),
    );
    for (const row of rows) {
      if (!row.submissionDate) continue;
      const key = `${row.submissionDate.getFullYear()}-${String(
        row.submissionDate.getMonth() + 1,
      ).padStart(2, "0")}`;
      const bucket = counts.get(key);
      if (!bucket) continue;
      const resolved = resolveTenderStatus(row.status, row.submissionDate);
      bucket.count += 1;
      if (resolved === "awarded") bucket.won += 1;
      else if (resolved === "lost") bucket.lost += 1;
      else bucket.pending += 1;
    }

    const data: TenderSubmissionTrendPoint[] = months.map((m) => {
      const bucket = counts.get(m.key) || {
        count: 0,
        won: 0,
        lost: 0,
        pending: 0,
      };
      return { ...m, ...bucket };
    });

    return { success: true as const, data };
  } catch (error) {
    console.error("Failed to fetch tender submission trend:", error);
    return {
      success: false as const,
      error: "Failed to fetch tender submission trend",
    };
  }
}

export async function getReportStats(organizationId: string) {
  try {
    await validateSessionAndOrg(organizationId);

    // 1. Fetch Tenders Stats
    const tenders = await db
      .select({
        status: tender.status,
        value: tender.value,
        submissionDate: tender.submissionDate,
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
          eq(project.status, "active"),
        ),
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
    let pendingTenders = 0; // open, closed, evaluation
    let pipelineValue = 0;
    let totalWonValue = 0; // Was "revenueSecured" - now "Total Won Value"
    let poRevenue = 0; // New "Guaranteed" revenue

    // Calc Tender Stats
    for (const t of tenders) {
      totalTenders++;
      const val = parseFloat(t.value || "0");
      const resolvedStatus = resolveTenderStatus(t.status, t.submissionDate);

      if (resolvedStatus === "awarded") {
        wonTenders++;
        totalWonValue += val;
      } else if (resolvedStatus === "lost") {
        lostTenders++;
      } else {
        // open, closed, evaluation count as pending/pipeline
        pendingTenders++;
        pipelineValue += val;
      }
    }

    // Calc PO Stats
    for (const po of purchaseOrders) {
      const val = parseFloat(po.totalAmount || "0");
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
    console.error("Failed to fetch report stats:", error);
    return {
      success: false,
      error: "Failed to fetch report statistics",
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
