import 'server-only';

import { db } from '@pmg/db';
import {
  user,
  session,
  account,
  organization,
  member,
  invitation,
  tender,
  project,
  purchaseOrder,
  sessionTracking,
  securityAuditLog,
  ownershipTransfer,
  supportTickets,
  feedback,
  waitlist,
} from '@pmg/db/schema';
import {
  eq,
  and,
  lt,
  gt,
  isNull,
  sql,
  count,
  desc,
  asc,
} from 'drizzle-orm';
import { PLATFORM_ORG_ID } from './constants';

/* =============================================================================
   Return Types
============================================================================= */

export type DashboardMetrics = {
  totalUsers: number;
  newUsersThisWeek: number;
  activeOrgs: number;
  newOrgsThisWeek: number;
  totalTenders: number;
  activeProjects: number;
  liveSessions: number;
  suspiciousCount: number;
  verifiedCount: number;
  unverifiedCount: number;
  openTickets: number;
  inProgressTickets: number;
  waitlistTotal: number;
  newWaitlistThisWeek: number;
  tenderByStatus: Record<'draft' | 'submitted' | 'won' | 'lost' | 'pending', number>;
  planDistribution: Record<'free' | 'pro', number>;
};

export type AlertCounts = {
  suspiciousSessions: number;
  unverifiedRecentUsers: number;
  expiringInvitations: number;
  expiringTransfers: number;
  pendingPurgeOrgs: number;
  openTickets: number;
};

export type ActivityEntry = {
  id: string;
  action: string;
  resourceType: string;
  severity: string;
  createdAt: Date;
  userId: string | null;
  userName: string | null;
};

export type OrgWithCounts = {
  id: string;
  name: string;
  slug: string | null;
  logo: string | null;
  metadata: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  deletionReason: string | null;
  permanentDeletionScheduledAt: Date | null;
  memberCount: number;
  tenderCount: number;
  projectCount: number;
  poCount: number;
};

export type UserWithMemberships = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  plan: string;
  role: string;
  createdAt: Date;
  lastActiveOrganizationId: string | null;
  lastActiveOrgName: string | null;
  providerId: string | null;
  memberships: Array<{ orgId: string; orgName: string; role: string }>;
  isGhost: boolean;
};

export type SuspiciousSession = {
  id: string;
  sessionId: string;
  loginTime: Date;
  lastActivity: Date;
  logoutTime: Date | null;
  ipAddress: string | null;
  deviceInfo: string | null;
  locationInfo: string | null;
  isSuspicious: boolean;
  userEmail: string | null;
};

export type TicketWithUser = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: string;
  createdAt: Date;
  userId: string | null;
  userName: string | null;
};

export type FeedbackWithUser = {
  id: string;
  type: string;
  name: string | null;
  email: string | null;
  message: string;
  url: string | null;
  createdAt: Date;
  userId: string | null;
  userName: string | null;
};

/* =============================================================================
   Query Helpers
============================================================================= */

/**
 * getDashboardMetrics — executes all KPI count queries in a single Promise.all()
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsersResult,
    newUsersResult,
    activeOrgsResult,
    newOrgsResult,
    totalTendersResult,
    activeProjectsResult,
    liveSessionsResult,
    suspiciousSessionsResult,
    verifiedCountResult,
    unverifiedCountResult,
    openTicketsResult,
    inProgressTicketsResult,
    waitlistTotalResult,
    newWaitlistResult,
    tenderByStatusResult,
    planDistributionResult,
  ] = await Promise.all([
    // totalUsers
    db.select({ value: count() }).from(user),
    // newUsersThisWeek
    db.select({ value: count() }).from(user).where(gt(user.createdAt, sevenDaysAgo)),
    // activeOrgs (not soft-deleted, excluding sentinel)
    db.select({ value: count() }).from(organization).where(
      and(isNull(organization.deletedAt), sql`${organization.id} != ${PLATFORM_ORG_ID}`)
    ),
    // newOrgsThisWeek (not soft-deleted, excluding sentinel)
    db.select({ value: count() }).from(organization).where(
      and(
        gt(organization.createdAt, sevenDaysAgo),
        isNull(organization.deletedAt),
        sql`${organization.id} != ${PLATFORM_ORG_ID}`
      )
    ),
    // totalTenders
    db.select({ value: count() }).from(tender),
    // activeProjects
    db.select({ value: count() }).from(project).where(eq(project.status, 'active')),
    // liveSessions (expiresAt > now)
    db.select({ value: count() }).from(session).where(gt(session.expiresAt, now)),
    // suspiciousCount
    db.select({ value: count() }).from(sessionTracking).where(
      and(eq(sessionTracking.isSuspicious, true), isNull(sessionTracking.logoutTime))
    ),
    // verifiedCount
    db.select({ value: count() }).from(user).where(eq(user.emailVerified, true)),
    // unverifiedCount
    db.select({ value: count() }).from(user).where(eq(user.emailVerified, false)),
    // openTickets
    db.select({ value: count() }).from(supportTickets).where(eq(supportTickets.status, 'open')),
    // inProgressTickets
    db.select({ value: count() }).from(supportTickets).where(eq(supportTickets.status, 'in_progress')),
    // waitlistTotal
    db.select({ value: count() }).from(waitlist),
    // newWaitlistThisWeek
    db.select({ value: count() }).from(waitlist).where(gt(waitlist.createdAt, sevenDaysAgo)),
    // tenderByStatus
    db
      .select({ status: tender.status, cnt: count() })
      .from(tender)
      .groupBy(tender.status),
    // planDistribution
    db
      .select({ plan: user.plan, cnt: count() })
      .from(user)
      .groupBy(user.plan),
  ]);

  // Build tenderByStatus record
  const tenderByStatus: Record<'draft' | 'submitted' | 'won' | 'lost' | 'pending', number> = {
    draft: 0,
    submitted: 0,
    won: 0,
    lost: 0,
    pending: 0,
  };
  for (const row of tenderByStatusResult) {
    const s = row.status as keyof typeof tenderByStatus;
    if (s in tenderByStatus) {
      tenderByStatus[s] = Number(row.cnt);
    }
  }

  // Build planDistribution record
  const planDistribution: Record<'free' | 'pro', number> = {
    free: 0,
    pro: 0,
  };
  for (const row of planDistributionResult) {
    const p = row.plan as keyof typeof planDistribution;
    if (p in planDistribution) {
      planDistribution[p] = Number(row.cnt);
    }
  }

  return {
    totalUsers: Number(totalUsersResult[0]?.value ?? 0),
    newUsersThisWeek: Number(newUsersResult[0]?.value ?? 0),
    activeOrgs: Number(activeOrgsResult[0]?.value ?? 0),
    newOrgsThisWeek: Number(newOrgsResult[0]?.value ?? 0),
    totalTenders: Number(totalTendersResult[0]?.value ?? 0),
    activeProjects: Number(activeProjectsResult[0]?.value ?? 0),
    liveSessions: Number(liveSessionsResult[0]?.value ?? 0),
    suspiciousCount: Number(suspiciousSessionsResult[0]?.value ?? 0),
    verifiedCount: Number(verifiedCountResult[0]?.value ?? 0),
    unverifiedCount: Number(unverifiedCountResult[0]?.value ?? 0),
    openTickets: Number(openTicketsResult[0]?.value ?? 0),
    inProgressTickets: Number(inProgressTicketsResult[0]?.value ?? 0),
    waitlistTotal: Number(waitlistTotalResult[0]?.value ?? 0),
    newWaitlistThisWeek: Number(newWaitlistResult[0]?.value ?? 0),
    tenderByStatus,
    planDistribution,
  };
}

/**
 * getAlertCounts — 6 count-only queries for alert conditions
 */
export async function getAlertCounts(): Promise<AlertCounts> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in72h = new Date(now.getTime() + 72 * 60 * 60 * 1000);

  const [
    suspiciousResult,
    unverifiedResult,
    expiringInvitationsResult,
    expiringTransfersResult,
    pendingPurgeResult,
    openTicketsResult,
  ] = await Promise.all([
    // suspiciousSessions: isSuspicious=true AND logoutTime IS NULL
    db.select({ value: count() }).from(sessionTracking).where(
      and(eq(sessionTracking.isSuspicious, true), isNull(sessionTracking.logoutTime))
    ),
    // unverifiedRecentUsers: emailVerified=false AND createdAt > NOW()-7days
    db.select({ value: count() }).from(user).where(
      and(eq(user.emailVerified, false), gt(user.createdAt, sevenDaysAgo))
    ),
    // expiringInvitations: status='pending' AND expiresAt < NOW()+48h
    db.select({ value: count() }).from(invitation).where(
      and(eq(invitation.status, 'pending'), lt(invitation.expiresAt, in48h))
    ),
    // expiringTransfers: status='pending' AND expiresAt < NOW()+24h
    db.select({ value: count() }).from(ownershipTransfer).where(
      and(eq(ownershipTransfer.status, 'pending'), lt(ownershipTransfer.expiresAt, in24h))
    ),
    // pendingPurgeOrgs: permanentDeletionScheduledAt < NOW()+72h (and not null)
    db.select({ value: count() }).from(organization).where(
      and(
        sql`${organization.permanentDeletionScheduledAt} IS NOT NULL`,
        lt(organization.permanentDeletionScheduledAt, in72h)
      )
    ),
    // openTickets: status='open'
    db.select({ value: count() }).from(supportTickets).where(eq(supportTickets.status, 'open')),
  ]);

  return {
    suspiciousSessions: Number(suspiciousResult[0]?.value ?? 0),
    unverifiedRecentUsers: Number(unverifiedResult[0]?.value ?? 0),
    expiringInvitations: Number(expiringInvitationsResult[0]?.value ?? 0),
    expiringTransfers: Number(expiringTransfersResult[0]?.value ?? 0),
    pendingPurgeOrgs: Number(pendingPurgeResult[0]?.value ?? 0),
    openTickets: Number(openTicketsResult[0]?.value ?? 0),
  };
}

/**
 * getRecentActivity — left join securityAuditLog with user, order by createdAt DESC
 */
export async function getRecentActivity(limit: number): Promise<ActivityEntry[]> {
  const rows = await db
    .select({
      id: securityAuditLog.id,
      action: securityAuditLog.action,
      resourceType: securityAuditLog.resourceType,
      severity: securityAuditLog.severity,
      createdAt: securityAuditLog.createdAt,
      userId: securityAuditLog.userId,
      userName: user.name,
    })
    .from(securityAuditLog)
    .leftJoin(user, eq(securityAuditLog.userId, user.id))
    .orderBy(desc(securityAuditLog.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    resourceType: row.resourceType,
    severity: row.severity,
    createdAt: row.createdAt,
    userId: row.userId,
    userName: row.userName ?? null,
  }));
}

/**
 * getOrganizationsWithCounts — all orgs (excluding sentinel) with correlated subquery aggregates
 */
export async function getOrganizationsWithCounts(): Promise<OrgWithCounts[]> {
  const memberCountSq = db
    .select({ cnt: count() })
    .from(member)
    .where(eq(member.organizationId, organization.id))
    .as('memberCountSq');

  const tenderCountSq = db
    .select({ cnt: count() })
    .from(tender)
    .where(eq(tender.organizationId, organization.id))
    .as('tenderCountSq');

  const projectCountSq = db
    .select({ cnt: count() })
    .from(project)
    .where(eq(project.organizationId, organization.id))
    .as('projectCountSq');

  const poCountSq = db
    .select({ cnt: count() })
    .from(purchaseOrder)
    .where(eq(purchaseOrder.organizationId, organization.id))
    .as('poCountSq');

  const rows = await db
    .select({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      metadata: organization.metadata,
      createdAt: organization.createdAt,
      deletedAt: organization.deletedAt,
      deletionReason: organization.deletionReason,
      permanentDeletionScheduledAt: organization.permanentDeletionScheduledAt,
      memberCount: sql<number>`(${memberCountSq})`,
      tenderCount: sql<number>`(${tenderCountSq})`,
      projectCount: sql<number>`(${projectCountSq})`,
      poCount: sql<number>`(${poCountSq})`,
    })
    .from(organization)
    .where(sql`${organization.id} != ${PLATFORM_ORG_ID}`)
    .orderBy(asc(organization.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo,
    metadata: row.metadata,
    createdAt: row.createdAt,
    deletedAt: row.deletedAt,
    deletionReason: row.deletionReason,
    permanentDeletionScheduledAt: row.permanentDeletionScheduledAt,
    memberCount: Number(row.memberCount ?? 0),
    tenderCount: Number(row.tenderCount ?? 0),
    projectCount: Number(row.projectCount ?? 0),
    poCount: Number(row.poCount ?? 0),
  }));
}

/**
 * getUsersWithMemberships — all users with memberships, isGhost flag, lastActiveOrgName, providerId
 * Ghost = user has no rows in member table.
 * Assembles in JS from three separate queries to avoid N+1.
 */
export async function getUsersWithMemberships(): Promise<UserWithMemberships[]> {
  const [allUsers, allMembers, allAccounts, allOrgs] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        plan: user.plan,
        role: user.role,
        createdAt: user.createdAt,
        lastActiveOrganizationId: user.lastActiveOrganizationId,
      })
      .from(user)
      .orderBy(desc(user.createdAt)),
    // all member rows, joined to org name
    db
      .select({
        userId: member.userId,
        orgId: member.organizationId,
        orgName: organization.name,
        role: member.role,
      })
      .from(member)
      .leftJoin(organization, eq(member.organizationId, organization.id)),
    // all accounts, most recent per user
    db
      .select({
        userId: account.userId,
        providerId: account.providerId,
        createdAt: account.createdAt,
      })
      .from(account)
      .orderBy(desc(account.createdAt)),
    // all orgs (for lastActiveOrgName resolution)
    db
      .select({ id: organization.id, name: organization.name })
      .from(organization),
  ]);

  // Build lookup maps
  const orgNameById = new Map<string, string>(allOrgs.map((o) => [o.id, o.name]));

  // membersByUserId: Map<userId, membership[]>
  const membersByUserId = new Map<string, Array<{ orgId: string; orgName: string; role: string }>>();
  for (const m of allMembers) {
    if (!m.userId) continue;
    const existing = membersByUserId.get(m.userId) ?? [];
    existing.push({
      orgId: m.orgId,
      orgName: m.orgName ?? '',
      role: m.role,
    });
    membersByUserId.set(m.userId, existing);
  }

  // providerByUserId: most recent account provider per user
  const providerByUserId = new Map<string, string>();
  for (const a of allAccounts) {
    // allAccounts is ordered by createdAt DESC so first entry per user is most recent
    if (!providerByUserId.has(a.userId)) {
      providerByUserId.set(a.userId, a.providerId);
    }
  }

  return allUsers.map((u) => {
    const memberships = membersByUserId.get(u.id) ?? [];
    const isGhost = memberships.length === 0;
    const lastActiveOrgName = u.lastActiveOrganizationId
      ? (orgNameById.get(u.lastActiveOrganizationId) ?? null)
      : null;
    const providerId = providerByUserId.get(u.id) ?? null;

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: u.emailVerified,
      plan: u.plan,
      role: u.role,
      createdAt: u.createdAt,
      lastActiveOrganizationId: u.lastActiveOrganizationId,
      lastActiveOrgName,
      providerId,
      memberships,
      isGhost,
    };
  });
}

/**
 * getSuspiciousSessions — sessionTracking where isSuspicious=true AND logoutTime IS NULL, joined to user
 */
export async function getSuspiciousSessions(): Promise<SuspiciousSession[]> {
  const rows = await db
    .select({
      id: sessionTracking.id,
      sessionId: sessionTracking.sessionId,
      loginTime: sessionTracking.loginTime,
      lastActivity: sessionTracking.lastActivity,
      logoutTime: sessionTracking.logoutTime,
      ipAddress: sessionTracking.ipAddress,
      deviceInfo: sessionTracking.deviceInfo,
      locationInfo: sessionTracking.locationInfo,
      isSuspicious: sessionTracking.isSuspicious,
      userEmail: user.email,
    })
    .from(sessionTracking)
    .innerJoin(session, eq(sessionTracking.sessionId, session.id))
    .leftJoin(user, eq(session.userId, user.id))
    .where(
      and(eq(sessionTracking.isSuspicious, true), isNull(sessionTracking.logoutTime))
    )
    .orderBy(desc(sessionTracking.loginTime));

  return rows.map((row) => ({
    id: row.id,
    sessionId: row.sessionId,
    loginTime: row.loginTime,
    lastActivity: row.lastActivity,
    logoutTime: row.logoutTime,
    ipAddress: row.ipAddress,
    deviceInfo: row.deviceInfo,
    locationInfo: row.locationInfo,
    isSuspicious: row.isSuspicious,
    userEmail: row.userEmail ?? null,
  }));
}

/**
 * getAllActiveSessions — same join as getSuspiciousSessions() but without the isSuspicious filter;
 * returns all rows where logoutTime IS NULL, ordered by loginTime DESC
 */
export async function getAllActiveSessions(): Promise<SuspiciousSession[]> {
  const rows = await db
    .select({
      id: sessionTracking.id,
      sessionId: sessionTracking.sessionId,
      loginTime: sessionTracking.loginTime,
      lastActivity: sessionTracking.lastActivity,
      logoutTime: sessionTracking.logoutTime,
      ipAddress: sessionTracking.ipAddress,
      deviceInfo: sessionTracking.deviceInfo,
      locationInfo: sessionTracking.locationInfo,
      isSuspicious: sessionTracking.isSuspicious,
      userEmail: user.email,
    })
    .from(sessionTracking)
    .innerJoin(session, eq(sessionTracking.sessionId, session.id))
    .leftJoin(user, eq(session.userId, user.id))
    .where(isNull(sessionTracking.logoutTime))
    .orderBy(desc(sessionTracking.loginTime));

  return rows.map((row) => ({
    id: row.id,
    sessionId: row.sessionId,
    loginTime: row.loginTime,
    lastActivity: row.lastActivity,
    logoutTime: row.logoutTime,
    ipAddress: row.ipAddress,
    deviceInfo: row.deviceInfo,
    locationInfo: row.locationInfo,
    isSuspicious: row.isSuspicious,
    userEmail: row.userEmail ?? null,
  }));
}

/**
 * getOpenTickets — supportTickets left joined with user, ordered by createdAt DESC
 */
export async function getOpenTickets(): Promise<TicketWithUser[]> {
  const rows = await db
    .select({
      id: supportTickets.id,
      name: supportTickets.name,
      email: supportTickets.email,
      message: supportTickets.message,
      status: supportTickets.status,
      createdAt: supportTickets.createdAt,
      userId: supportTickets.userId,
      userName: user.name,
    })
    .from(supportTickets)
    .leftJoin(user, eq(supportTickets.userId, user.id))
    .orderBy(desc(supportTickets.createdAt));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    message: row.message,
    status: row.status,
    createdAt: row.createdAt,
    userId: row.userId,
    userName: row.userName ?? null,
  }));
}

/**
 * getFeedback — feedback left joined with user, optional type filter, ordered by createdAt DESC
 */
export async function getFeedback(typeFilter?: string): Promise<FeedbackWithUser[]> {
  const rows = await db
    .select({
      id: feedback.id,
      type: feedback.type,
      name: feedback.name,
      email: feedback.email,
      message: feedback.message,
      url: feedback.url,
      createdAt: feedback.createdAt,
      userId: feedback.userId,
      userName: user.name,
    })
    .from(feedback)
    .leftJoin(user, eq(feedback.userId, user.id))
    .where(typeFilter !== undefined ? eq(feedback.type, typeFilter) : undefined)
    .orderBy(desc(feedback.createdAt));

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    name: row.name,
    email: row.email,
    message: row.message,
    url: row.url,
    createdAt: row.createdAt,
    userId: row.userId,
    userName: row.userName ?? null,
  }));
}
