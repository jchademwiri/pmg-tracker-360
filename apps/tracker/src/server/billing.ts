'use server';

import { db } from '@pmg/db';
import {
  user as userTable,
  member,
  organization,
  tender,
  project,
  document,
  securityAuditLog,
} from '@pmg/db/schema';
import { eq, inArray, count, isNull, and, gte, sql, or, desc } from 'drizzle-orm';
import { getCurrentUser } from './users';

function getStartOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
}

export interface BillingInvoice {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  receipt: string;
}

export async function getUserUsageStats() {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    // 1. Get User's Active Organizations where user has 'owner' role
    const ownerMemberships = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(
        and(
          eq(member.userId, currentUser.id),
          eq(member.role, 'owner'),
          isNull(organization.deletedAt)
        )
      );

    const ownedOrgIds = ownerMemberships.map((m) => m.organizationId);
    const organizationsCount = ownedOrgIds.length;

    // 2. Monthly Tenders Count (tenders created in the current month)
    let tendersCount = 0;
    let totalLifetimeTenders = 0;
    if (ownedOrgIds.length > 0) {
      const startOfMonth = getStartOfCurrentMonth();

      const monthlyTendersResult = await db
        .select({ count: count() })
        .from(tender)
        .where(
          and(
            inArray(tender.organizationId, ownedOrgIds),
            gte(tender.createdAt, startOfMonth),
            isNull(tender.deletedAt)
          )
        );
      tendersCount = monthlyTendersResult[0]?.count || 0;

      const lifetimeResult = await db
        .select({ count: count() })
        .from(tender)
        .where(
          and(
            inArray(tender.organizationId, ownedOrgIds),
            isNull(tender.deletedAt)
          )
        );
      totalLifetimeTenders = lifetimeResult[0]?.count || 0;
    }

    // 3. Active Projects Count
    let projectsCount = 0;
    if (ownedOrgIds.length > 0) {
      const activeProjectsResult = await db
        .select({ count: count() })
        .from(project)
        .where(
          and(
            inArray(project.organizationId, ownedOrgIds),
            eq(project.status, 'active'),
            isNull(project.deletedAt)
          )
        );
      projectsCount = activeProjectsResult[0]?.count || 0;
    }

    // 4. Storage Space Calculation (sum of size in document table)
    let storageUsedMb = 0;
    const documentWhere =
      ownedOrgIds.length > 0
        ? or(inArray(document.organizationId, ownedOrgIds), eq(document.uploadedBy, currentUser.id))
        : eq(document.uploadedBy, currentUser.id);

    const storageResult = await db
      .select({ totalSize: sql<number>`coalesce(sum(${document.size}), 0)` })
      .from(document)
      .where(documentWhere);

    const totalBytes = Number(storageResult[0]?.totalSize || 0);
    storageUsedMb = Number((totalBytes / (1024 * 1024)).toFixed(2));

    // 5. Invoice & Subscription History from securityAuditLog
    const auditLogs = await db
      .select()
      .from(securityAuditLog)
      .where(
        and(
          eq(securityAuditLog.userId, currentUser.id),
          eq(securityAuditLog.action, 'subscription_plan_updated')
        )
      )
      .orderBy(desc(securityAuditLog.createdAt));

    let invoices: BillingInvoice[] = auditLogs.map((log) => {
      let detailsObj: any = {};
      if (typeof log.details === 'string') {
        try {
          detailsObj = JSON.parse(log.details);
        } catch (e) {}
      } else if (log.details && typeof log.details === 'object') {
        detailsObj = log.details;
      }

      const planName = (detailsObj.plan || log.resourceId || 'starter').toUpperCase();
      const amount = detailsObj.amount ?? (planName.includes('PRO') ? 499 : planName.includes('STARTER') ? 249 : 0);

      return {
        id: detailsObj.invoiceId || `INV-${log.id.slice(0, 8).toUpperCase()}`,
        date: new Date(log.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        }),
        description: `PMG Tracker 360 Subscription (${planName} Tier)`,
        amount: amount,
        status: 'Paid',
        receipt: '#',
      };
    });

    // If user is on paid plan but has no audit log yet, generate historical invoice for active plan
    const userPlan = (currentUser.plan || 'free').toLowerCase();
    if (invoices.length === 0 && (userPlan === 'starter' || userPlan === 'pro')) {
      const planPrice = userPlan === 'pro' ? 499 : 249;
      invoices.push({
        id: `INV-${currentUser.id.slice(-6).toUpperCase()}-01`,
        date: new Date(currentUser.updatedAt || currentUser.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        }),
        description: `PMG Tracker 360 Subscription (${userPlan.toUpperCase()} Tier)`,
        amount: planPrice,
        status: 'Paid',
        receipt: '#',
      });
    }

    return {
      success: true,
      plan: currentUser.plan,
      userUpdatedAt: currentUser.updatedAt,
      usage: {
        organizations: organizationsCount,
        tenders: tendersCount, // Current Month Tenders Count against monthly quota
        lifetimeTenders: totalLifetimeTenders,
        projects: projectsCount,
        storage: storageUsedMb,
      },
      invoices,
    };
  } catch (error) {
    console.error('Error fetching user usage stats:', error);
    return {
      success: false,
      plan: 'free',
      userUpdatedAt: new Date(),
      error: 'Failed to fetch usage stats',
      usage: {
        organizations: 0,
        tenders: 0,
        lifetimeTenders: 0,
        projects: 0,
        storage: 0,
      },
      invoices: [],
    };
  }
}

export async function updateUserPlan(plan: 'free' | 'starter' | 'pro') {
  try {
    const { currentUser } = await getCurrentUser();

    if (!currentUser?.id) {
      throw new Error('User not authenticated');
    }

    // Fetch live usage metrics for downgrade checks
    const usageStats = await getUserUsageStats();
    const { organizations, projects, tenders, storage } = usageStats.usage;

    // Plan limits:
    // Free: max 1 org, max 0 active projects, max 10 tenders/mo, max 100 MB storage
    // Starter: max 1 org, max 2 active projects, max 20 tenders/mo, max 1000 MB storage
    // Pro: max 2 orgs, max 5 active projects, unlimited tenders, max 10000 MB storage

    const maxOrgs = plan === 'pro' ? 2 : 1;
    const maxProjects = plan === 'pro' ? 5 : plan === 'starter' ? 2 : 0;
    const maxTenders = plan === 'pro' ? Infinity : plan === 'starter' ? 20 : 10;
    const maxStorageMb = plan === 'pro' ? 10000 : plan === 'starter' ? 1000 : 100;

    if (organizations > maxOrgs) {
      return {
        success: false,
        error: `Cannot switch to ${plan.toUpperCase()} plan: You own ${organizations} organizations, but the ${plan.toUpperCase()} plan limit is ${maxOrgs}. Please delete or archive an organization first.`,
      };
    }

    if (projects > maxProjects) {
      return {
        success: false,
        error: `Cannot switch to ${plan.toUpperCase()} plan: You have ${projects} active projects, but the ${plan.toUpperCase()} plan limit is ${maxProjects}. Please complete or archive projects first.`,
      };
    }

    if (tenders > maxTenders) {
      return {
        success: false,
        error: `Cannot switch to ${plan.toUpperCase()} plan: You have created ${tenders} tenders this month, but the ${plan.toUpperCase()} plan limit is ${maxTenders} tenders per month.`,
      };
    }

    if (storage > maxStorageMb) {
      return {
        success: false,
        error: `Cannot switch to ${plan.toUpperCase()} plan: Your storage usage is ${storage} MB, which exceeds the ${plan.toUpperCase()} plan limit of ${maxStorageMb} MB.`,
      };
    }

    const now = new Date();

    // Execute plan update
    await db
      .update(userTable)
      .set({ plan: plan, updatedAt: now })
      .where(eq(userTable.id, currentUser.id));

    // Get an organization context for security audit log
    const ownerMemberships = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(and(eq(member.userId, currentUser.id), eq(member.role, 'owner')));

    const primaryOrgId = ownerMemberships[0]?.organizationId || 'org_platform_admin';
    const planPrice = plan === 'pro' ? 499 : plan === 'starter' ? 249 : 0;

    // Log subscription change to securityAuditLog
    try {
      await db.insert(securityAuditLog).values({
        id: crypto.randomUUID(),
        organizationId: primaryOrgId,
        userId: currentUser.id,
        action: 'subscription_plan_updated',
        resourceType: 'billing',
        resourceId: plan,
        details: JSON.stringify({
          plan,
          amount: planPrice,
          date: now.toISOString(),
          invoiceId: `INV-${Date.now().toString().slice(-6)}`,
        }),
        severity: 'info',
        createdAt: now,
      });
    } catch (auditError) {
      console.warn('Failed to insert billing audit log:', auditError);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating plan:', error);
    return { success: false, error: error.message || 'Failed to update plan' };
  }
}

