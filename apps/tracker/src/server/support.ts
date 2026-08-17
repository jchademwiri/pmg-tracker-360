'use server';

import { db } from '@pmg/db';
import { supportTickets, supportTicketMessages, user as userTable } from '@pmg/db/schema';
import { eq, and, sql, desc, asc, isNull, count } from 'drizzle-orm';
import { z } from 'zod';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { checkRateLimit, getClientIp, verifyBotProtection } from '@/lib/bot-protection';

import { formatTicketCode } from '@/lib/support-utils';

const supportTicketSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  subject: z.string().max(150, 'Subject is too long').optional().default('General Inquiry'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(2000, 'Message is too long'),
  userId: z.string().optional(),
  honeypot: z.string().optional(),
  formMountedAt: z.number().optional(),
});

export type SupportTicketInput = z.input<typeof supportTicketSchema>;

export async function createSupportTicket(input: SupportTicketInput) {
  try {
    const validated = supportTicketSchema.parse(input);

    // Verify session if available
    let sessionUser: { id: string; name?: string | null; email?: string | null } | null = null;
    try {
      const headerList = await headers();
      const session = await auth.api.getSession({ headers: headerList });
      if (session?.user) {
        sessionUser = session.user;
      }
    } catch {
      // Non-blocking if called outside session context
    }

    // Look up registered user if available
    let linkedUserId: string | null = sessionUser?.id || validated.userId || null;
    const effectiveName = sessionUser?.name || validated.name;
    const effectiveEmail = sessionUser?.email || validated.email;

    // For unauthenticated/public submissions, enforce bot protection and rate limiting
    if (!sessionUser) {
      const clientIp = await getClientIp();

      // IP Rate limit check
      const rateLimit = checkRateLimit(`ticket:${clientIp}`, 5, 10 * 60 * 1000);
      if (!rateLimit.allowed) {
        return {
          success: false,
          error: `Too many submissions. Please wait ${Math.ceil((rateLimit.retryAfterSeconds || 60) / 60)} minute(s).`,
        };
      }

      // Bot protection check
      const botCheck = await verifyBotProtection({
        name: effectiveName,
        email: effectiveEmail,
        honeypot: validated.honeypot,
        formMountedAt: validated.formMountedAt,
      });

      if (botCheck.isBot) {
        console.warn(`[Anti-Spam] Ticket creation blocked: ${botCheck.reason}`);
        return {
          success: true,
          ticketId: crypto.randomUUID(),
        };
      }
    }

    if (!linkedUserId && effectiveEmail) {
      const [foundUser] = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(sql`lower(${userTable.email})`, effectiveEmail.toLowerCase()))
        .limit(1);

      if (foundUser) {
        linkedUserId = foundUser.id;
      }
    }

    const ticketId = crypto.randomUUID();
    const now = new Date();

    // 1. Insert parent ticket with subject, priority and default sequence ticket_number
    const [insertedTicket] = await db
      .insert(supportTickets)
      .values({
        id: ticketId,
        name: effectiveName,
        email: effectiveEmail,
        subject: validated.subject || 'Support Request',
        message: validated.message,
        userId: linkedUserId,
        status: 'open',
        priority: validated.priority || 'medium',
        createdAt: now,
        updatedAt: now,
      })
      .returning({
        id: supportTickets.id,
        ticketNumber: supportTickets.ticketNumber,
      });

    const ticketCode = formatTicketCode(insertedTicket?.ticketNumber, ticketId);

    // 2. Insert initial message into thread
    await db.insert(supportTicketMessages).values({
      id: crypto.randomUUID(),
      ticketId,
      senderId: linkedUserId,
      senderType: 'user',
      senderName: effectiveName,
      senderEmail: effectiveEmail,
      message: validated.message,
      isInternal: false,
      createdAt: now,
    });

    const escapeHtml = (unsafe: string) =>
      unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const safeSubject = escapeHtml(validated.subject || 'Support Request');
    const safeMessage = escapeHtml(validated.message).replace(/\n/g, '<br>');
    const safeName = escapeHtml(effectiveName);
    const safeEmail = escapeHtml(effectiveEmail);
    const safePriority = (validated.priority || 'medium').toUpperCase();
    const senderEmail = process.env.SENDER_EMAIL || 'no-reply@contact.tendertrack360.co.za';
    const adminUrl = process.env.ADMIN_APP_URL || 'https://admin.tendertrack360.co.za/support-tickets';

    // 3. Send email notifications ONLY on new ticket creation
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Fetch admin emails
        const adminUsers = await db
          .select({ email: userTable.email })
          .from(userTable)
          .where(eq(userTable.role, 'admin'));

        const adminEmails = adminUsers.map((a) => a.email).filter(Boolean) as string[];
        const recipients = adminEmails.length > 0 ? adminEmails : ['info@contact.tendertrack360.co.za'];

        // Alert Admins of new ticket
        await resend.emails.send({
          from: `Tender Track 360 Support <${senderEmail}>`,
          to: recipients,
          subject: `[New Support Ticket #${ticketCode}] [${safePriority}] ${safeSubject}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 20px;">
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                  <span style="background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                    Ticket #${ticketCode}
                  </span>
                  <span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                    Priority: ${safePriority}
                  </span>
                </div>
                <h2 style="color: #0f172a; margin: 12px 0 4px 0; font-size: 20px;">${safeSubject}</h2>
                <p style="color: #64748b; margin: 0; font-size: 13px;">Submitted by ${safeName} &lt;${safeEmail}&gt;</p>
              </div>

              <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-left: 4px solid #d4af37; padding: 16px; margin-bottom: 24px; border-radius: 4px; font-size: 14px; line-height: 1.6; color: #1e293b;">
                ${safeMessage}
              </div>

              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${adminUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 13px; font-weight: 600;">
                  Open Ticket in Admin Console &rarr;
                </a>
              </div>
            </div>
          `,
        });

        // Confirmation to User
        await resend.emails.send({
          from: `Tender Track 360 Support <${senderEmail}>`,
          to: [validated.email],
          subject: `Support request received: ${safeSubject} (#${ticketCode})`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 20px;">
                <h2 style="color: #0f172a; margin: 0; font-size: 20px;">Support Request Received</h2>
                <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Subject: <strong>${safeSubject}</strong> (Ticket #${ticketCode})</p>
              </div>
              <p style="font-size: 14px; line-height: 1.5; color: #334155;">Hi ${safeName},</p>
              <p style="font-size: 14px; line-height: 1.5; color: #334155;">
                We have received your support inquiry and our team is actively reviewing it. You can follow and reply directly inside your in-app Support Desk.
              </p>
              <div style="background-color: #f8fafc; border-left: 4px solid #d4af37; padding: 14px; margin: 16px 0; font-size: 14px; line-height: 1.6; color: #1e293b;">
                ${safeMessage}
              </div>
            </div>
          `,
        });
      }
    } catch (emailErr) {
      console.error('Failed to send support notification emails:', emailErr);
    }

    return { success: true, ticketId, ticketNumber: insertedTicket?.ticketNumber, ticketCode };
  } catch (error: any) {
    console.error('Failed to create support ticket:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0]?.message || 'Invalid input data' };
    }
    return { success: false, error: error?.message || 'Failed to submit support request' };
  }
}

/**
 * Get active & recent tickets for the current authenticated user.
 */
export async function getUserSupportTickets() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return { success: false, tickets: [], unreadTotal: 0 };
    }

    const userId = session.user.id;
    const userEmail = session.user.email?.toLowerCase() || '';

    const tickets = await db
      .select({
        id: supportTickets.id,
        ticketNumber: supportTickets.ticketNumber,
        name: supportTickets.name,
        email: supportTickets.email,
        subject: supportTickets.subject,
        message: supportTickets.message,
        status: supportTickets.status,
        priority: supportTickets.priority,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        messageCount: count(supportTicketMessages.id),
        unreadAdminCount: sql<number>`count(*) filter (where ${supportTicketMessages.senderType} = 'admin' and ${supportTicketMessages.readAt} is null and ${supportTicketMessages.isInternal} = false)`,
      })
      .from(supportTickets)
      .leftJoin(supportTicketMessages, eq(supportTickets.id, supportTicketMessages.ticketId))
      .where(
        sql`${supportTickets.userId} = ${userId} OR lower(${supportTickets.email}) = ${userEmail}`
      )
      .groupBy(supportTickets.id)
      .orderBy(desc(supportTickets.updatedAt));

    let unreadTotal = 0;
    const mapped = tickets.map((t) => {
      const unread = Number(t.unreadAdminCount) || 0;
      if (unread > 0) {
        unreadTotal += 1; // Count tickets that have unread responses
      }
      return {
        id: t.id,
        ticketNumber: t.ticketNumber,
        ticketCode: formatTicketCode(t.ticketNumber, t.id),
        name: t.name,
        email: t.email,
        subject: t.subject || 'Support Request',
        message: t.message,
        status: t.status,
        priority: t.priority || 'medium',
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
        messageCount: Number(t.messageCount) || 1,
        unreadCount: unread,
      };
    });

    return {
      success: true,
      tickets: mapped,
      unreadTotal,
    };
  } catch (err: any) {
    console.error('Error fetching user tickets:', err);
    return { success: false, tickets: [], unreadTotal: 0 };
  }
}

/**
 * Get full message thread for a user ticket and mark admin messages as read.
 */
export async function getUserTicketThread(ticketId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const userId = session?.user?.id;
    const userEmail = session?.user?.email?.toLowerCase();

    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId));

    if (!ticket) {
      return { success: false, error: 'Ticket not found.' };
    }

    // Permission check: must belong to user or match email
    if (
      userId &&
      ticket.userId !== userId &&
      ticket.email.toLowerCase() !== userEmail
    ) {
      return { success: false, error: 'Unauthorized.' };
    }

    // Fetch non-internal messages
    const messages = await db
      .select()
      .from(supportTicketMessages)
      .where(
        and(
          eq(supportTicketMessages.ticketId, ticketId),
          eq(supportTicketMessages.isInternal, false)
        )
      )
      .orderBy(asc(supportTicketMessages.createdAt));

    // Mark admin messages as read by user
    await db
      .update(supportTicketMessages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(supportTicketMessages.ticketId, ticketId),
          eq(supportTicketMessages.senderType, 'admin'),
          isNull(supportTicketMessages.readAt)
        )
      );

    const ticketCode = formatTicketCode(ticket.ticketNumber, ticket.id);

    return {
      success: true,
      ticket: {
        ...ticket,
        ticketCode,
        subject: ticket.subject || 'Support Request',
        priority: ticket.priority || 'medium',
      },
      messages,
    };
  } catch (err: any) {
    console.error('Error fetching user ticket thread:', err);
    return { success: false, error: err.message || 'Failed to fetch thread.' };
  }
}

/**
 * User sends a reply into the ticket conversation thread.
 */
export async function sendUserTicketMessage(ticketId: string, message: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!message || !message.trim()) {
      return { success: false, error: 'Message cannot be empty.' };
    }

    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId));

    if (!ticket) return { success: false, error: 'Ticket not found.' };

    const senderName = session?.user?.name || ticket.name;
    const senderEmail = session?.user?.email || ticket.email;
    const now = new Date();

    // 1. Insert message
    await db.insert(supportTicketMessages).values({
      id: crypto.randomUUID(),
      ticketId,
      senderId: session?.user?.id || null,
      senderType: 'user',
      senderName,
      senderEmail,
      message: message.trim(),
      isInternal: false,
      createdAt: now,
    });

    // 2. Update ticket updated_at and reopen if closed
    const newStatus = ticket.status === 'closed' || ticket.status === 'resolved' ? 'open' : ticket.status;
    await db
      .update(supportTickets)
      .set({
        status: newStatus,
        updatedAt: now,
      })
      .where(eq(supportTickets.id, ticketId));

    return { success: true };
  } catch (err: any) {
    console.error('Error sending user message:', err);
    return { success: false, error: err.message || 'Failed to send message.' };
  }
}

/**
 * User requests full conversation transcript emailed to them.
 */
export async function emailUserTicketTranscript(ticketId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId));

    if (!ticket) return { success: false, error: 'Ticket not found.' };

    const targetEmail = session?.user?.email || ticket.email;
    if (!targetEmail) return { success: false, error: 'No email found.' };

    const ticketCode = formatTicketCode(ticket.ticketNumber, ticket.id);

    const messages = await db
      .select()
      .from(supportTicketMessages)
      .where(
        and(
          eq(supportTicketMessages.ticketId, ticketId),
          eq(supportTicketMessages.isInternal, false)
        )
      )
      .orderBy(asc(supportTicketMessages.createdAt));

    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const messagesHtml = messages
      .map((m) => {
        const isAdmin = m.senderType === 'admin';
        const bg = isAdmin ? '#f0fdf4' : '#f8fafc';
        const borderColor = isAdmin ? '#16a34a' : '#0284c7';
        const senderBadge = isAdmin ? 'Support Team' : 'You';
        const dateStr = new Date(m.createdAt).toLocaleString('en-GB');

        return `
          <div style="background-color: ${bg}; border-left: 4px solid ${borderColor}; padding: 12px 16px; margin-bottom: 12px; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; color: #64748b;">
              <strong>${escapeHtml(m.senderName)} (${senderBadge})</strong>
              <span>${dateStr}</span>
            </div>
            <div style="font-size: 14px; line-height: 1.5; color: #1e293b;">
              ${escapeHtml(m.message).replace(/\n/g, '<br>')}
            </div>
          </div>
        `;
      })
      .join('');

    const senderEmailAddr = process.env.SENDER_EMAIL || 'no-reply@contact.tendertrack360.co.za';

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: `Tender Track 360 Support <${senderEmailAddr}>`,
        to: [targetEmail],
        subject: `Support Conversation Transcript: ${ticket.subject || 'Support Request'} (#${ticketCode})`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 20px;">
              <h2 style="color: #0f172a; margin: 0; font-size: 20px;">Support Conversation Transcript</h2>
              <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Subject: <strong>${escapeHtml(ticket.subject || 'Support Request')}</strong> | Ticket Reference: #${ticketCode} | Status: ${ticket.status.toUpperCase()}</p>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 20px; font-size: 13px;">
              <p style="margin: 0 0 4px 0;"><strong>User:</strong> ${escapeHtml(ticket.name)}</p>
              <p style="margin: 0;"><strong>Date Opened:</strong> ${new Date(ticket.createdAt).toLocaleString('en-GB')}</p>
            </div>

            <h3 style="font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 12px;">Conversation History:</h3>
            ${messagesHtml}

            <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #94a3b8; text-align: center;">
              <p style="margin: 0;">&copy; ${new Date().getFullYear()} Tender Track 360 Support</p>
            </div>
          </div>
        `,
      });
    }

    return { success: true, message: `Transcript sent to ${targetEmail}!` };
  } catch (err: any) {
    console.error('Error sending transcript to user:', err);
    return { success: false, error: err.message || 'Failed to email transcript.' };
  }
}

/**
 * Returns the count of DISTINCT support tickets that have unread responses from admin for the current user.
 */
export async function getUnreadTicketCount(): Promise<{ success: boolean; count: number }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return { success: true, count: 0 };
    }

    const userId = session.user.id;
    const userEmail = session.user.email?.toLowerCase() || '';

    const [result] = await db
      .select({
        count: sql<number>`count(distinct ${supportTickets.id})`,
      })
      .from(supportTickets)
      .innerJoin(supportTicketMessages, eq(supportTickets.id, supportTicketMessages.ticketId))
      .where(
        and(
          sql`(${supportTickets.userId} = ${userId} OR lower(${supportTickets.email}) = ${userEmail})`,
          eq(supportTicketMessages.senderType, 'admin'),
          isNull(supportTicketMessages.readAt),
          eq(supportTicketMessages.isInternal, false)
        )
      );

    return {
      success: true,
      count: Number(result?.count) || 0,
    };
  } catch (err) {
    console.error('Error fetching unread ticket count for user:', err);
    return { success: false, count: 0 };
  }
}
