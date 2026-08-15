import { db } from '../src/client';
import { supportTickets, supportTicketMessages } from '../src/schema';
import { desc, count, eq } from 'drizzle-orm';

async function main() {
  const rows = await db
    .select({
      id: supportTickets.id,
      ticketNumber: supportTickets.ticketNumber,
      name: supportTickets.name,
      email: supportTickets.email,
      subject: supportTickets.subject,
      status: supportTickets.status,
      priority: supportTickets.priority,
      createdAt: supportTickets.createdAt,
      messageCount: count(supportTicketMessages.id),
    })
    .from(supportTickets)
    .leftJoin(supportTicketMessages, eq(supportTickets.id, supportTicketMessages.ticketId))
    .groupBy(supportTickets.id)
    .orderBy(desc(supportTickets.ticketNumber));

  console.log('--- CURRENT SUPPORT TICKETS WITH SEQUENTIAL NUMBERING ---');
  console.log(
    rows.map((r) => ({
      ticketCode: `TICK-${r.ticketNumber}`,
      ticketNumber: r.ticketNumber,
      subject: r.subject,
      priority: r.priority,
      status: r.status,
      name: r.name,
      createdAt: r.createdAt,
    }))
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
