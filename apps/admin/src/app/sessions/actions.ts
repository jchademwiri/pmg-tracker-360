'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@pmg/db';
import { sessionTracking, session as sessionTable, securityAuditLog } from '@pmg/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { PLATFORM_ORG_ID } from '@/lib/constants';

export async function revokeAdminSession(sessionTrackingId: string): Promise<void> {
  // 1. Re-verify admin session
  const adminSession = await auth.api.getSession({ headers: await headers() });
  if (!adminSession || (adminSession.user as any).role !== 'admin') {
    throw new Error('Unauthorized');
  }

  // 2. Look up the Better Auth session token via tracking row
  const [trackingRow] = await db
    .select({ sessionId: sessionTracking.sessionId })
    .from(sessionTracking)
    .where(eq(sessionTracking.id, sessionTrackingId));
  if (!trackingRow) throw new Error('Session not found');

  const [sessionRow] = await db
    .select({ token: sessionTable.token })
    .from(sessionTable)
    .where(eq(sessionTable.id, trackingRow.sessionId));
  if (!sessionRow) throw new Error('Session token not found');

  // 3. Revoke via Better Auth
  await auth.api.revokeSession({
    body: { token: sessionRow.token },
    headers: await headers(),
  });

  // 4. Insert audit log (catch and log — do not rethrow)
  try {
    await db.insert(securityAuditLog).values({
      id: crypto.randomUUID(),
      organizationId: PLATFORM_ORG_ID,
      userId: adminSession.user.id,
      action: 'admin.session.revoke',
      resourceType: 'session',
      resourceId: sessionTrackingId,
      severity: 'warning',
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('[audit-log] Failed to insert for session revoke:', err);
  }

  revalidatePath('/sessions');
}
