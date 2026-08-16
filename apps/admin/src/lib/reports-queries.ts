import 'server-only';

import { db } from '@pmg/db';
import {
  user,
  session,
  organization,
  member,
  invitation,
  tender,
  project,
  purchaseOrder,
  document,
  sessionTracking,
  securityAuditLog,
  supportTickets,
  feedback,
  waitlist,
} from '@pmg/db/schema';
import {
  eq,
  and,
  isNull,
  isNotNull,
  sql,
  count,
  sum,
  desc,
  gte,
  inArray,
} from 'drizzle-orm';
import { PLATFORM_ORG_ID } from './constants';
import {
  getCloudflareR2StorageStats,
  type CloudflareStorageOverview,
  type BucketUsage,
} from './cloudflare-r2';

export type { CloudflareStorageOverview, BucketUsage };

/* =============================================================================
   Types
============================================================================= */

export type PlatformOverviewStats = {
  totalTenants: number;
  activeTenants: number;
  softDeletedTenants: number;
  totalUsers: number;
  verifiedUsers: number;
  verificationRate: number;
  totalStorageBytes: number;
  totalStorageMB: number;
  totalStorageGB: number;
  totalStorageCapacityGB: number;
  availableStorageGB: number;
  availableStorageMB: number;
  storageUtilizationPct: number;
  storageWarningStatus: 'healthy' | 'warning' | 'critical';
  storageOverview: CloudflareStorageOverview;
  totalDocuments: number;
  totalTenderPipelineValue: number;
  totalTenderAwardedValue: number;
  totalTenders: number;
  totalProjects: number;
  activeProjects: number;
  totalPOs: number;
  totalPOAmount: number;
  openSupportTickets: number;
  totalFeedbackCount: number;
  waitlistCount: number;
  planCounts: Record<string, number>;
};

export type GrowthTrendItem = {
  period: string; // e.g. '2026-01' or 'Week 12'
  organizations: number;
  users: number;
  tenders: number;
};

export type StorageCategoryBreakdown = {
  category: string;
  count: number;
  sizeBytes: number;
  sizeMB: number;
  percentage: number;
};

export type TenantStorageUsage = {
  id: string;
  name: string;
  slug: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  documentCount: number;
  storageBytes: number;
  storageMB: number;
  tenderCount: number;
  projectCount: number;
  memberCount: number;
};

export type SecurityComplianceSummary = {
  totalLogs: number;
  criticalEvents: number;
  warningEvents: number;
  infoEvents: number;
  suspiciousSessions: number;
  totalSessions: number;
  recentCriticalLogs: Array<{
    id: string;
    action: string;
    resourceType: string;
    severity: string;
    createdAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
  }>;
};

export type TenderStatusDistribution = {
  status: string;
  count: number;
  value: number;
};

/* =============================================================================
   Query Functions
============================================================================= */

export async function getPlatformOverviewStats(): Promise<PlatformOverviewStats> {
  const [
    orgCounts,
    userCounts,
    planDistribution,
    docStats,
    tenderStats,
    projectStats,
    poStats,
    ticketStats,
    feedbackStats,
    waitlistStats,
  ] = await Promise.all([
    // 1. Organizations
    db
      .select({
        total: count(),
        active: sql<number>`count(*) filter (where ${organization.deletedAt} is null and ${organization.id} != ${PLATFORM_ORG_ID})`,
        softDeleted: sql<number>`count(*) filter (where ${organization.deletedAt} is not null and ${organization.id} != ${PLATFORM_ORG_ID})`,
      })
      .from(organization)
      .where(sql`${organization.id} != ${PLATFORM_ORG_ID}`),

    // 2. Users
    db
      .select({
        total: count(),
        verified: sql<number>`count(*) filter (where ${user.emailVerified} = true)`,
      })
      .from(user),

    // 3. User Plans
    db
      .select({
        plan: user.plan,
        count: count(),
      })
      .from(user)
      .groupBy(user.plan),

    // 4. Documents & Storage
    db
      .select({
        docCount: count(),
        totalBytes: sum(document.size),
      })
      .from(document),

    // 5. Tenders
    db
      .select({
        totalTenders: count(),
        pipelineValue: sum(tender.value),
        awardedValue: sum(tender.awardValue),
      })
      .from(tender)
      .where(isNull(tender.deletedAt)),

    // 6. Projects
    db
      .select({
        totalProjects: count(),
        activeProjects: sql<number>`count(*) filter (where ${project.status} = 'active')`,
      })
      .from(project)
      .where(isNull(project.deletedAt)),

    // 7. Purchase Orders
    db
      .select({
        totalPOs: count(),
        totalAmount: sum(purchaseOrder.totalAmount),
      })
      .from(purchaseOrder)
      .where(isNull(purchaseOrder.deletedAt)),

    // 8. Support Tickets
    db
      .select({
        openCount: sql<number>`count(*) filter (where ${supportTickets.status} in ('open', 'in_progress'))`,
      })
      .from(supportTickets),

    // 9. Feedback
    db
      .select({
        total: count(),
      })
      .from(feedback),

    // 10. Waitlist
    db
      .select({
        total: count(),
      })
      .from(waitlist),
  ]);

  const totalTenants = Number(orgCounts[0]?.total ?? 0);
  const activeTenants = Number(orgCounts[0]?.active ?? 0);
  const softDeletedTenants = Number(orgCounts[0]?.softDeleted ?? 0);

  const totalUsers = Number(userCounts[0]?.total ?? 0);
  const verifiedUsers = Number(userCounts[0]?.verified ?? 0);
  const verificationRate =
    totalUsers > 0 ? Math.round((verifiedUsers / totalUsers) * 100) : 0;

  const totalStorageBytes = Number(docStats[0]?.totalBytes ?? 0);
  const totalDocuments = Number(docStats[0]?.docCount ?? 0);

  // Fetch Cloudflare live storage metrics (all buckets) or fallback to DB-tracked
  const storageOverview = await getCloudflareR2StorageStats(
    totalStorageBytes,
    totalDocuments
  );

  const totalTenderPipelineValue = Number(tenderStats[0]?.pipelineValue ?? 0);
  const totalTenderAwardedValue = Number(tenderStats[0]?.awardedValue ?? 0);
  const totalTenders = Number(tenderStats[0]?.totalTenders ?? 0);

  const totalProjects = Number(projectStats[0]?.totalProjects ?? 0);
  const activeProjects = Number(projectStats[0]?.activeProjects ?? 0);

  const totalPOs = Number(poStats[0]?.totalPOs ?? 0);
  const totalPOAmount = Number(poStats[0]?.totalAmount ?? 0);

  const planCounts: Record<string, number> = {};
  for (const p of planDistribution) {
    planCounts[p.plan || 'free'] = Number(p.count);
  }

  return {
    totalTenants,
    activeTenants,
    softDeletedTenants,
    totalUsers,
    verifiedUsers,
    verificationRate,
    totalStorageBytes,
    totalStorageMB: storageOverview.totalUsedMB,
    totalStorageGB: storageOverview.totalUsedGB,
    totalStorageCapacityGB: storageOverview.totalCapacityGB,
    availableStorageGB: storageOverview.availableStorageGB,
    availableStorageMB: storageOverview.availableStorageMB,
    storageUtilizationPct: storageOverview.utilizationPct,
    storageWarningStatus: storageOverview.warningStatus,
    storageOverview,
    totalDocuments,
    totalTenderPipelineValue,
    totalTenderAwardedValue,
    totalTenders,
    totalProjects,
    activeProjects,
    totalPOs,
    totalPOAmount,
    openSupportTickets: Number(ticketStats[0]?.openCount ?? 0),
    totalFeedbackCount: Number(feedbackStats[0]?.total ?? 0),
    waitlistCount: Number(waitlistStats[0]?.total ?? 0),
    planCounts,
  };
}

/**
 * Monthly growth trend across Orgs, Users, and Tenders for the last 6 months.
 */
export async function getGrowthTrend(): Promise<GrowthTrendItem[]> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [orgsByMonth, usersByMonth, tendersByMonth] = await Promise.all([
    db
      .select({
        month: sql<string>`to_char(${organization.createdAt}, 'YYYY-MM')`,
        count: count(),
      })
      .from(organization)
      .where(
        and(
          gte(organization.createdAt, sixMonthsAgo),
          sql`${organization.id} != ${PLATFORM_ORG_ID}`
        )
      )
      .groupBy(sql`to_char(${organization.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${organization.createdAt}, 'YYYY-MM')`),

    db
      .select({
        month: sql<string>`to_char(${user.createdAt}, 'YYYY-MM')`,
        count: count(),
      })
      .from(user)
      .where(gte(user.createdAt, sixMonthsAgo))
      .groupBy(sql`to_char(${user.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${user.createdAt}, 'YYYY-MM')`),

    db
      .select({
        month: sql<string>`to_char(${tender.createdAt}, 'YYYY-MM')`,
        count: count(),
      })
      .from(tender)
      .where(
        and(gte(tender.createdAt, sixMonthsAgo), isNull(tender.deletedAt))
      )
      .groupBy(sql`to_char(${tender.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${tender.createdAt}, 'YYYY-MM')`),
  ]);

  // Build map of month keys
  const monthMap = new Map<string, GrowthTrendItem>();

  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    monthMap.set(key, {
      period: label,
      organizations: 0,
      users: 0,
      tenders: 0,
    });
  }

  for (const row of orgsByMonth) {
    if (monthMap.has(row.month)) {
      monthMap.get(row.month)!.organizations = Number(row.count);
    }
  }

  for (const row of usersByMonth) {
    if (monthMap.has(row.month)) {
      monthMap.get(row.month)!.users = Number(row.count);
    }
  }

  for (const row of tendersByMonth) {
    if (monthMap.has(row.month)) {
      monthMap.get(row.month)!.tenders = Number(row.count);
    }
  }

  return Array.from(monthMap.values());
}

/**
 * Storage breakdown by resource attachment type (Tenders, Projects, POs, Extensions, General)
 */
export async function getStorageBreakdown(): Promise<{
  categories: StorageCategoryBreakdown[];
  topTenants: TenantStorageUsage[];
  storageOverview: CloudflareStorageOverview;
}> {
  const [categoryResults, topTenantResults] = await Promise.all([
    db
      .select({
        tenderCount: sql<number>`count(*) filter (where ${document.tenderId} is not null)`,
        tenderBytes: sql<number>`coalesce(sum(${document.size}) filter (where ${document.tenderId} is not null), 0)`,
        projectCount: sql<number>`count(*) filter (where ${document.projectId} is not null and ${document.tenderId} is null)`,
        projectBytes: sql<number>`coalesce(sum(${document.size}) filter (where ${document.projectId} is not null and ${document.tenderId} is null), 0)`,
        poCount: sql<number>`count(*) filter (where ${document.purchaseOrderId} is not null)`,
        poBytes: sql<number>`coalesce(sum(${document.size}) filter (where ${document.purchaseOrderId} is not null), 0)`,
        extCount: sql<number>`count(*) filter (where ${document.extensionId} is not null)`,
        extBytes: sql<number>`coalesce(sum(${document.size}) filter (where ${document.extensionId} is not null), 0)`,
        otherCount: sql<number>`count(*) filter (where ${document.tenderId} is null and ${document.projectId} is null and ${document.purchaseOrderId} is null and ${document.extensionId} is null)`,
        otherBytes: sql<number>`coalesce(sum(${document.size}) filter (where ${document.tenderId} is null and ${document.projectId} is null and ${document.purchaseOrderId} is null and ${document.extensionId} is null), 0)`,
        totalBytes: sql<number>`coalesce(sum(${document.size}), 0)`,
      })
      .from(document),

    // Top tenants by storage
    db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        createdAt: organization.createdAt,
        deletedAt: organization.deletedAt,
        documentCount: count(document.id),
        storageBytes: sql<number>`coalesce(sum(${document.size}), 0)`,
      })
      .from(organization)
      .leftJoin(document, eq(organization.id, document.organizationId))
      .where(sql`${organization.id} != ${PLATFORM_ORG_ID}`)
      .groupBy(organization.id)
      .orderBy(desc(sql`coalesce(sum(${document.size}), 0)`))
      .limit(10),
  ]);

  const raw = categoryResults[0] ?? {
    tenderCount: 0,
    tenderBytes: 0,
    projectCount: 0,
    projectBytes: 0,
    poCount: 0,
    poBytes: 0,
    extCount: 0,
    extBytes: 0,
    otherCount: 0,
    otherBytes: 0,
    totalBytes: 0,
  };

  const totalBytes = Number(raw.totalBytes) || 1; // avoid divide by zero

  const categories: StorageCategoryBreakdown[] = [
    {
      category: 'Tender Documents',
      count: Number(raw.tenderCount),
      sizeBytes: Number(raw.tenderBytes),
      sizeMB: Number((Number(raw.tenderBytes) / (1024 * 1024)).toFixed(2)),
      percentage: Math.round((Number(raw.tenderBytes) / totalBytes) * 100),
    },
    {
      category: 'Project Contracts & Files',
      count: Number(raw.projectCount),
      sizeBytes: Number(raw.projectBytes),
      sizeMB: Number((Number(raw.projectBytes) / (1024 * 1024)).toFixed(2)),
      percentage: Math.round((Number(raw.projectBytes) / totalBytes) * 100),
    },
    {
      category: 'Purchase Orders & PODs',
      count: Number(raw.poCount),
      sizeBytes: Number(raw.poBytes),
      sizeMB: Number((Number(raw.poBytes) / (1024 * 1024)).toFixed(2)),
      percentage: Math.round((Number(raw.poBytes) / totalBytes) * 100),
    },
    {
      category: 'Tender Extensions',
      count: Number(raw.extCount),
      sizeBytes: Number(raw.extBytes),
      sizeMB: Number((Number(raw.extBytes) / (1024 * 1024)).toFixed(2)),
      percentage: Math.round((Number(raw.extBytes) / totalBytes) * 100),
    },
    {
      category: 'Other / Unassigned',
      count: Number(raw.otherCount),
      sizeBytes: Number(raw.otherBytes),
      sizeMB: Number((Number(raw.otherBytes) / (1024 * 1024)).toFixed(2)),
      percentage: Math.round((Number(raw.otherBytes) / totalBytes) * 100),
    },
  ];

  // Fetch extra counts for top tenants
  const topTenants: TenantStorageUsage[] = [];
  for (const t of topTenantResults) {
    const [tendersRes, projectsRes, membersRes] = await Promise.all([
      db
        .select({ count: count() })
        .from(tender)
        .where(and(eq(tender.organizationId, t.id), isNull(tender.deletedAt))),
      db
        .select({ count: count() })
        .from(project)
        .where(and(eq(project.organizationId, t.id), isNull(project.deletedAt))),
      db
        .select({ count: count() })
        .from(member)
        .where(eq(member.organizationId, t.id)),
    ]);

    const bytes = Number(t.storageBytes);
    topTenants.push({
      id: t.id,
      name: t.name,
      slug: t.slug,
      createdAt: t.createdAt,
      deletedAt: t.deletedAt,
      documentCount: Number(t.documentCount),
      storageBytes: bytes,
      storageMB: Number((bytes / (1024 * 1024)).toFixed(2)),
      tenderCount: Number(tendersRes[0]?.count ?? 0),
      projectCount: Number(projectsRes[0]?.count ?? 0),
      memberCount: Number(membersRes[0]?.count ?? 0),
    });
  }

  // Calculate Cloudflare R2 storage overview
  const totalDocCount =
    Number(raw.tenderCount) +
    Number(raw.projectCount) +
    Number(raw.poCount) +
    Number(raw.extCount) +
    Number(raw.otherCount);

  const storageOverview = await getCloudflareR2StorageStats(
    Number(raw.totalBytes),
    totalDocCount
  );

  return { categories, topTenants, storageOverview };
}

/**
 * Security & Compliance metrics
 */
export async function getSecurityComplianceMetrics(): Promise<SecurityComplianceSummary> {
  const [logCounts, sessionCounts, recentLogs] = await Promise.all([
    db
      .select({
        total: count(),
        critical: sql<number>`count(*) filter (where ${securityAuditLog.severity} = 'critical')`,
        warning: sql<number>`count(*) filter (where ${securityAuditLog.severity} = 'warning')`,
        info: sql<number>`count(*) filter (where ${securityAuditLog.severity} = 'info')`,
      })
      .from(securityAuditLog),

    db
      .select({
        total: count(),
        suspicious: sql<number>`count(*) filter (where ${sessionTracking.isSuspicious} = true)`,
      })
      .from(sessionTracking),

    db
      .select({
        id: securityAuditLog.id,
        action: securityAuditLog.action,
        resourceType: securityAuditLog.resourceType,
        severity: securityAuditLog.severity,
        createdAt: securityAuditLog.createdAt,
        ipAddress: securityAuditLog.ipAddress,
        userAgent: securityAuditLog.userAgent,
      })
      .from(securityAuditLog)
      .where(eq(securityAuditLog.severity, 'critical'))
      .orderBy(desc(securityAuditLog.createdAt))
      .limit(10),
  ]);

  return {
    totalLogs: Number(logCounts[0]?.total ?? 0),
    criticalEvents: Number(logCounts[0]?.critical ?? 0),
    warningEvents: Number(logCounts[0]?.warning ?? 0),
    infoEvents: Number(logCounts[0]?.info ?? 0),
    totalSessions: Number(sessionCounts[0]?.total ?? 0),
    suspiciousSessions: Number(sessionCounts[0]?.suspicious ?? 0),
    recentCriticalLogs: recentLogs,
  };
}

/**
 * Tender Status distribution across all organizations
 */
export async function getTenderStatusDistribution(): Promise<TenderStatusDistribution[]> {
  const results = await db
    .select({
      status: tender.status,
      count: count(),
      value: sum(tender.value),
    })
    .from(tender)
    .where(isNull(tender.deletedAt))
    .groupBy(tender.status)
    .orderBy(desc(count()));

  return results.map((r) => ({
    status: r.status,
    count: Number(r.count),
    value: Number(r.value ?? 0),
  }));
}

/**
 * Complete list of all tenants with full operational counts for Excel Export
 */
export async function getAllTenantsUtilization(): Promise<TenantStorageUsage[]> {
  const orgs = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      createdAt: organization.createdAt,
      deletedAt: organization.deletedAt,
      documentCount: count(document.id),
      storageBytes: sql<number>`coalesce(sum(${document.size}), 0)`,
    })
    .from(organization)
    .leftJoin(document, eq(organization.id, document.organizationId))
    .where(sql`${organization.id} != ${PLATFORM_ORG_ID}`)
    .groupBy(organization.id)
    .orderBy(desc(organization.createdAt));

  const list: TenantStorageUsage[] = [];
  for (const org of orgs) {
    const [tendersRes, projectsRes, membersRes] = await Promise.all([
      db
        .select({ count: count() })
        .from(tender)
        .where(and(eq(tender.organizationId, org.id), isNull(tender.deletedAt))),
      db
        .select({ count: count() })
        .from(project)
        .where(and(eq(project.organizationId, org.id), isNull(project.deletedAt))),
      db
        .select({ count: count() })
        .from(member)
        .where(eq(member.organizationId, org.id)),
    ]);

    const bytes = Number(org.storageBytes);
    list.push({
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.createdAt,
      deletedAt: org.deletedAt,
      documentCount: Number(org.documentCount),
      storageBytes: bytes,
      storageMB: Number((bytes / (1024 * 1024)).toFixed(2)),
      tenderCount: Number(tendersRes[0]?.count ?? 0),
      projectCount: Number(projectsRes[0]?.count ?? 0),
      memberCount: Number(membersRes[0]?.count ?? 0),
    });
  }

  return list;
}
