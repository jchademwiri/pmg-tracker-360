import { db } from '../src/client';
import { supportTickets, supportTicketMessages, user } from '../src/schema';
import { eq, and, sql, desc, asc, isNull } from 'drizzle-orm';

function formatTicketCode(ticketNumber?: number | null, fallbackId?: string): string {
  if (ticketNumber) return `TICK-${ticketNumber}`;
  if (fallbackId) return `TICK-${fallbackId.slice(0, 8).toUpperCase()}`;
  return 'TICK-NEW';
}

async function runComprehensiveE2E() {
  console.log('🚀 ==========================================');
  console.log('🧪 RUNNING COMPREHENSIVE END-TO-END VERIFICATION');
  console.log('==========================================\n');

  // Step 1: Find test user
  const [testUser] = await db.select().from(user).limit(1);
  if (!testUser) {
    throw new Error('No user found in database for test.');
  }
  console.log(`👤 User Identity: ${testUser.name} (${testUser.email})`);

  // Step 2: Create Support Ticket via systematic sequence
  console.log('\n1️⃣ Creating new support ticket...');
  const ticketId = crypto.randomUUID();
  const now = new Date();

  const [createdTicket] = await db
    .insert(supportTickets)
    .values({
      id: ticketId,
      userId: testUser.id,
      name: testUser.name,
      email: testUser.email,
      subject: 'E2E Validation: Eskom Compliance Document Review',
      message: 'Hello Support, I need @Admin to review tender pack #ESK-990.',
      status: 'open',
      priority: 'urgent',
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  const ticketCode = formatTicketCode(createdTicket.ticketNumber, createdTicket.id);
  console.log(`   ✅ Created Ticket: #${ticketCode} (ID: ${createdTicket.id})`);
  console.log(`   🏷️  Subject: "${createdTicket.subject}"`);
  console.log(`   🔴 Priority: ${createdTicket.priority} | Status: ${createdTicket.status}`);

  if (!createdTicket.ticketNumber || createdTicket.ticketNumber < 1000) {
    throw new Error(`Invalid ticketNumber generated: ${createdTicket.ticketNumber}`);
  }

  // Step 3: Insert initial user message
  console.log('\n2️⃣ Creating initial thread message...');
  await db.insert(supportTicketMessages).values({
    id: crypto.randomUUID(),
    ticketId,
    senderId: testUser.id,
    senderType: 'user',
    senderName: testUser.name,
    senderEmail: testUser.email,
    message: createdTicket.message,
    isInternal: false,
    createdAt: now,
  });
  console.log('   ✅ Initial user message added to message stream.');

  // Step 4: Admin views ticket in roster
  console.log('\n3️⃣ Admin queries tickets table...');
  const [adminViewTicket] = await db
    .select({
      id: supportTickets.id,
      ticketNumber: supportTickets.ticketNumber,
      subject: supportTickets.subject,
      priority: supportTickets.priority,
      status: supportTickets.status,
    })
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId));

  console.log(`   ✅ Admin sees Ticket #${formatTicketCode(adminViewTicket.ticketNumber, adminViewTicket.id)} [${adminViewTicket.priority}]`);

  // Step 5: Admin posts response with formatting
  console.log('\n4️⃣ Admin replies in live concierge thread...');
  const adminMsgId = crypto.randomUUID();
  await db.insert(supportTicketMessages).values({
    id: adminMsgId,
    ticketId,
    senderId: null,
    senderType: 'admin',
    senderName: 'Senior Concierge Admin',
    senderEmail: 'admin@tendertrack360.co.za',
    message: 'Hello @' + testUser.name + '! We verified `pack #ESK-990`. Please see https://tendertrack360.co.za/tenders',
    isInternal: false,
    createdAt: new Date(),
  });
  await db.update(supportTickets).set({ status: 'in_progress', updatedAt: new Date() }).where(eq(supportTickets.id, ticketId));
  console.log('   ✅ Admin message sent. Status changed to "in_progress".');

  // Step 6: User reads thread and replies
  console.log('\n5️⃣ User opens thread (marking admin messages as read)...');
  await db
    .update(supportTicketMessages)
    .set({ readAt: new Date() })
    .where(and(eq(supportTicketMessages.ticketId, ticketId), eq(supportTicketMessages.senderType, 'admin')));

  const userReplyId = crypto.randomUUID();
  await db.insert(supportTicketMessages).values({
    id: userReplyId,
    ticketId,
    senderId: testUser.id,
    senderType: 'user',
    senderName: testUser.name,
    senderEmail: testUser.email,
    message: 'Thanks for the quick turnaround! Everything is resolved.',
    isInternal: false,
    createdAt: new Date(),
  });
  console.log('   ✅ User reply posted.');

  // Step 7: Admin updates priority and marks resolved
  console.log('\n6️⃣ Admin updates priority and resolves ticket...');
  await db
    .update(supportTickets)
    .set({ priority: 'high', status: 'resolved', updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId));

  // Step 8: Verify full thread history
  console.log('\n7️⃣ Verifying complete chronological transcript...');
  const thread = await db
    .select()
    .from(supportTicketMessages)
    .where(eq(supportTicketMessages.ticketId, ticketId))
    .orderBy(asc(supportTicketMessages.createdAt));

  console.log(`   ✅ Retrieved ${thread.length} messages in thread:`);
  for (const msg of thread) {
    console.log(`      • [${msg.senderType.toUpperCase()}] ${msg.senderName}: "${msg.message.slice(0, 45)}..."`);
  }

  if (thread.length !== 3) {
    throw new Error(`Expected 3 messages, got ${thread.length}`);
  }

  // Step 9: Cleanup
  console.log('\n8️⃣ Cleaning up test ticket and verifying CASCADE constraints...');
  await db.delete(supportTickets).where(eq(supportTickets.id, ticketId));
  const remainingMsgs = await db
    .select()
    .from(supportTicketMessages)
    .where(eq(supportTicketMessages.ticketId, ticketId));

  if (remainingMsgs.length > 0) {
    throw new Error('CASCADE delete failed for support_ticket_messages.');
  }
  console.log('   ✅ Cleaned up successfully.');

  console.log('\n🎉 ==========================================');
  console.log('💯 ALL END-TO-END STACK VERIFICATIONS PASSED!');
  console.log('==========================================\n');
  process.exit(0);
}

runComprehensiveE2E().catch((err) => {
  console.error('\n❌ E2E Test Failure:', err);
  process.exit(1);
});
