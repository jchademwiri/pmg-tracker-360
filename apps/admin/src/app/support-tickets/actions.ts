'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@pmg/db';
import { supportTickets, securityAuditLog } from '@pmg/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { PLATFORM_ORG_ID } from '@/lib/constants';
import { validateStatusTransition } from './ticket-utils';

export async function updateTicketStatus(ticketId: string, newStatus: string): Promise<void> {
  // 1. Re-verify admin session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== 'admin') {
    throw new Error('Unauthorized');
  }

  // 2. Fetch current status
  const [ticket] = await db
    .select({ status: supportTickets.status })
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId));
  if (!ticket) throw new Error('Ticket not found');

  // 3. Validate forward-only transition
  if (!validateStatusTransition(ticket.status, newStatus)) {
    throw new Error('Invalid status transition');
  }

  // 4. Execute DB write
  await db
    .update(supportTickets)
    .set({ status: newStatus })
    .where(eq(supportTickets.id, ticketId));

  // 5. Insert audit log (catch and log — do not rethrow)
  try {
    await db.insert(securityAuditLog).values({
      id: crypto.randomUUID(),
      organizationId: PLATFORM_ORG_ID,
      userId: session.user.id,
      action: 'admin.ticket.status_update',
      resourceType: 'support_ticket',
      resourceId: ticketId,
      severity: 'info',
      createdAt: new Date(),
    });
  } catch (err) {
    console.error('[audit-log] Failed to insert for ticket status update:', err);
  }

  revalidatePath('/support-tickets');
}
