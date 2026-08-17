"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@pmg/db";
import {
  supportTickets,
  supportTicketMessages,
  securityAuditLog,
  user,
} from "@pmg/db/schema";
import { eq, inArray, isNull, and, asc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { PLATFORM_ORG_ID } from "@/lib/constants";
import { validateStatusTransition } from "./ticket-utils";
import { resend, SENDER, REPLY_TO } from "@/lib/email-config";

export async function updateTicketStatus(
  ticketId: string,
  newStatus: string,
): Promise<void> {
  // 1. Re-verify admin session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== "admin") {
    throw new Error("Unauthorized");
  }

  // 2. Fetch current status
  const [ticket] = await db
    .select({ status: supportTickets.status })
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId));
  if (!ticket) throw new Error("Ticket not found");

  // 3. Validate status transition
  if (!validateStatusTransition(ticket.status, newStatus)) {
    throw new Error("Invalid status transition");
  }

  // 4. Execute DB write
  await db
    .update(supportTickets)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId));

  // 5. Insert audit log
  try {
    await db.insert(securityAuditLog).values({
      id: crypto.randomUUID(),
      organizationId: PLATFORM_ORG_ID,
      userId: session.user.id,
      action: "admin.ticket.status_update",
      resourceType: "support_ticket",
      resourceId: ticketId,
      severity: "info",
      createdAt: new Date(),
    });
  } catch (err) {
    console.error(
      "[audit-log] Failed to insert for ticket status update:",
      err,
    );
  }

  revalidatePath("/support-tickets");
}

export async function updateTicketPriority(
  ticketId: string,
  newPriority: string,
): Promise<void> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== "admin") {
    throw new Error("Unauthorized");
  }

  await db
    .update(supportTickets)
    .set({ priority: newPriority, updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId));

  revalidatePath("/support-tickets");
}

/**
 * Bulk updates status for multiple tickets.
 */
export async function bulkUpdateTicketStatus(
  ticketIds: string[],
  newStatus: string,
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }
  if (!ticketIds || ticketIds.length === 0) {
    return { success: false, error: "No tickets selected." };
  }

  try {
    await db
      .update(supportTickets)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(inArray(supportTickets.id, ticketIds));

    revalidatePath("/support-tickets");
    return { success: true, message: `Updated ${ticketIds.length} ticket(s).` };
  } catch (err) {
    const e = err as Error;
    return { success: false, error: e.message || "Failed bulk status update." };
  }
}

/**
 * Bulk deletes multiple tickets.
 */
export async function bulkDeleteTickets(ticketIds: string[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }
  if (!ticketIds || ticketIds.length === 0) {
    return { success: false, error: "No tickets selected." };
  }

  try {
    await db
      .delete(supportTickets)
      .where(inArray(supportTickets.id, ticketIds));
    revalidatePath("/support-tickets");
    return { success: true, message: `Deleted ${ticketIds.length} ticket(s).` };
  } catch (err) {
    const e = err as Error;
    return {
      success: false,
      error: e.message || "Failed bulk ticket deletion.",
    };
  }
}

/**
 * Fetches the full conversational thread for a support ticket.
 * Also marks unread user messages as read by admin.
 */
export async function getTicketThreadAction(ticketId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const [ticket] = await db
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
        userId: supportTickets.userId,
        userName: user.name,
      })
      .from(supportTickets)
      .leftJoin(user, eq(supportTickets.userId, user.id))
      .where(eq(supportTickets.id, ticketId));

    if (!ticket) {
      return { success: false, error: "Ticket not found." };
    }

    const ticketCode = ticket.ticketNumber
      ? `TICK-${ticket.ticketNumber}`
      : `TICK-${ticket.id.slice(0, 8).toUpperCase()}`;

    const messages = await db
      .select()
      .from(supportTicketMessages)
      .where(eq(supportTicketMessages.ticketId, ticketId))
      .orderBy(asc(supportTicketMessages.createdAt));

    // Mark unread user messages as read
    await db
      .update(supportTicketMessages)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(supportTicketMessages.ticketId, ticketId),
          eq(supportTicketMessages.senderType, "user"),
          isNull(supportTicketMessages.readAt),
        ),
      );

    return {
      success: true,
      ticket: {
        ...ticket,
        ticketCode,
      },
      messages,
    };
  } catch (err: any) {
    console.error("Error fetching ticket thread:", err);
    return {
      success: false,
      error: err.message || "Failed to fetch ticket thread.",
    };
  }
}

export type SendAdminMessageInput = {
  ticketId: string;
  message: string;
  isInternal?: boolean;
  sendEmailNotification?: boolean;
};

/**
 * Sends a message from admin into the ticket conversation thread.
 */
export async function sendAdminTicketMessageAction(
  input: SendAdminMessageInput,
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const {
    ticketId,
    message,
    isInternal = false,
    sendEmailNotification = true,
  } = input;

  if (!message || !message.trim()) {
    return { success: false, error: "Message cannot be empty." };
  }

  try {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId));

    if (!ticket) {
      return { success: false, error: "Ticket not found." };
    }

    const adminName = session.user.name || "System Support";
    const adminEmail =
      session.user.email || "support@contact.tendertrack360.co.za";

    // 1. Insert message
    const messageId = crypto.randomUUID();
    await db.insert(supportTicketMessages).values({
      id: messageId,
      ticketId,
      senderId: session.user.id,
      senderType: "admin",
      senderName: adminName,
      senderEmail: adminEmail,
      message: message.trim(),
      isInternal,
      createdAt: new Date(),
    });

    // 2. Update ticket updated_at and advance status if currently 'open'
    const newStatus = ticket.status === "open" ? "in_progress" : ticket.status;
    await db
      .update(supportTickets)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticketId));

    // 3. Send email notification to user if requested and not internal note
    if (sendEmailNotification && !isInternal && ticket.email) {
      try {
        const escapeHtml = (str: string) =>
          str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

        const safeMessage = escapeHtml(message.trim()).replace(/\n/g, "<br>");
        const appUrl = process.env.APP_URL || "https://tendertrack360.co.za";

        const ticketCode = ticket.ticketNumber
          ? `TICK-${ticket.ticketNumber}`
          : `TICK-${ticket.id.slice(0, 8).toUpperCase()}`;

        await resend.emails.send({
          from: SENDER,
          replyTo: REPLY_TO,
          to: [ticket.email],
          subject: `[Update on Ticket #${ticketCode}] New message from Support`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 20px;">
                <span style="background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase;">
                  Ticket #${ticketCode}
                </span>
                <h2 style="color: #0f172a; margin: 12px 0 4px 0; font-size: 20px;">New Reply on Your Support Ticket</h2>
                <p style="color: #64748b; margin: 0; font-size: 13px;">Tender Track 360 Support Team</p>
              </div>

              <p style="font-size: 14px; line-height: 1.5; color: #334155; margin-bottom: 16px;">
                Hi ${escapeHtml(ticket.name)},
              </p>

              <p style="font-size: 14px; line-height: 1.5; color: #334155; margin-bottom: 16px;">
                Our support team has replied to your request:
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #d4af37; padding: 16px; margin-bottom: 24px; border-radius: 4px; font-size: 14px; line-height: 1.6; color: #1e293b;">
                ${safeMessage}
              </div>

              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${appUrl}" style="display: inline-block; background-color: #1a3a52; color: #ffffff; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 13px; font-weight: 600;">
                  Open In-App Chat & Reply &rarr;
                </a>
              </div>

              <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} Tender Track 360</p>
              </div>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error("Failed to send email alert for ticket reply:", emailErr);
      }
    }

    // 4. Audit Log
    try {
      await db.insert(securityAuditLog).values({
        id: crypto.randomUUID(),
        organizationId: PLATFORM_ORG_ID,
        userId: session.user.id,
        action: isInternal
          ? "admin.ticket.internal_note"
          : "admin.ticket.reply",
        resourceType: "support_ticket",
        resourceId: ticketId,
        severity: "info",
        createdAt: new Date(),
      });
    } catch (auditErr) {
      console.error("Audit log failure for ticket reply:", auditErr);
    }

    revalidatePath("/support-tickets");
    return { success: true, messageId };
  } catch (err: any) {
    console.error("Error sending admin ticket message:", err);
    return { success: false, error: err.message || "Failed to send message." };
  }
}

/**
 * Sends full conversation transcript to a designated email address.
 */
export async function sendTicketTranscriptEmailAction(
  ticketId: string,
  toEmail: string,
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user as any).role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  if (!toEmail || !toEmail.includes("@")) {
    return { success: false, error: "Invalid recipient email address." };
  }

  try {
    const [ticket] = await db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.id, ticketId));

    if (!ticket) return { success: false, error: "Ticket not found." };

    const messages = await db
      .select()
      .from(supportTicketMessages)
      .where(
        and(
          eq(supportTicketMessages.ticketId, ticketId),
          eq(supportTicketMessages.isInternal, false),
        ),
      )
      .orderBy(asc(supportTicketMessages.createdAt));

    const escapeHtml = (str: string) =>
      str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const messagesHtml = messages
      .map((m) => {
        const isAdmin = m.senderType === "admin";
        const bg = isAdmin ? "#f0fdf4" : "#f8fafc";
        const borderColor = isAdmin ? "#16a34a" : "#0284c7";
        const senderBadge = isAdmin ? "Support Team" : "User";
        const dateStr = new Date(m.createdAt).toLocaleString("en-GB");

        return `
          <div style="background-color: ${bg}; border-left: 4px solid ${borderColor}; padding: 12px 16px; margin-bottom: 12px; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; color: #64748b;">
              <strong>${escapeHtml(m.senderName)} (${senderBadge})</strong>
              <span>${dateStr}</span>
            </div>
            <div style="font-size: 14px; line-height: 1.5; color: #1e293b;">
              ${escapeHtml(m.message).replace(/\n/g, "<br>")}
            </div>
          </div>
        `;
      })
      .join("");

    await resend.emails.send({
      from: SENDER,
      replyTo: REPLY_TO,
      to: [toEmail],
      subject: `Support Conversation Transcript — Ticket #${ticket.id.slice(0, 8)}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="border-bottom: 2px solid #d4af37; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #0f172a; margin: 0; font-size: 20px;">Support Conversation Transcript</h2>
            <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Ticket Reference: #${ticket.id.slice(0, 8)} | Status: ${ticket.status.toUpperCase()}</p>
          </div>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 20px; font-size: 13px;">
            <p style="margin: 0 0 4px 0;"><strong>Submitter:</strong> ${escapeHtml(ticket.name)} &lt;${escapeHtml(ticket.email)}&gt;</p>
            <p style="margin: 0;"><strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleString("en-GB")}</p>
          </div>

          <h3 style="font-size: 14px; font-weight: 600; color: #334155; margin-bottom: 12px;">Full Message History:</h3>
          ${messagesHtml}

          <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px; font-size: 12px; color: #94a3b8; text-align: center;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} Tender Track 360 Support System</p>
          </div>
        </div>
      `,
    });

    return { success: true, message: `Transcript sent to ${toEmail}!` };
  } catch (err: any) {
    console.error("Error sending transcript email:", err);
    return {
      success: false,
      error: err.message || "Failed to send transcript.",
    };
  }
}

/**
 * Returns count of DISTINCT tickets with unread user messages for admin.
 */
export async function getUnreadTicketsCountForAdminAction(): Promise<{
  success: boolean;
  count: number;
}> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user as any).role !== "admin") {
      return { success: true, count: 0 };
    }

    const [result] = await db
      .select({
        count: sql<number>`count(distinct ${supportTickets.id})`,
      })
      .from(supportTickets)
      .innerJoin(
        supportTicketMessages,
        eq(supportTickets.id, supportTicketMessages.ticketId),
      )
      .where(
        and(
          eq(supportTicketMessages.senderType, "user"),
          isNull(supportTicketMessages.readAt),
        ),
      );

    return {
      success: true,
      count: Number(result?.count) || 0,
    };
  } catch (err: any) {
    console.error("Error getting unread count for admin:", err);
    return { success: false, count: 0 };
  }
}
