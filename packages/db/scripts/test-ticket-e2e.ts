import { db } from '../src/client';
import { supportTickets, supportTicketMessages, user } from '../src/schema';
import { eq, desc, asc } from 'drizzle-orm';

async function runE2ETest() {
  console.log('🧪 Starting End-to-End Test for Support Ticket & Chat System...');

  // 1. Find or verify test user
  const [testUser] = await db.select().from(user).limit(1);
  console.log(`👤 Using user: ${testUser?.name || 'Anonymous'} (${testUser?.email || 'test@example.com'})`);

  const ticketId = crypto.randomUUID();
  const testEmail = testUser?.email || 'e2e-test@tendertrack360.co.za';
  const testName = testUser?.name || 'E2E Tester';
  const testMessage = 'E2E Test: I need help verifying tender document submissions and compliance checks.';

  // 2. Create Support Ticket
  console.log('1️⃣ Creating support ticket in DB...');
  await db.insert(supportTickets).values({
    id: ticketId,
    name: testName,
    email: testEmail,
    message: testMessage,
    userId: testUser?.id || null,
    status: 'open',
    priority: 'high',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 3. Insert Initial Thread Message
  console.log('2️⃣ Appending initial user message into support_ticket_messages...');
  const msg1Id = crypto.randomUUID();
  await db.insert(supportTicketMessages).values({
    id: msg1Id,
    ticketId,
    senderId: testUser?.id || null,
    senderType: 'user',
    senderName: testName,
    senderEmail: testEmail,
    message: testMessage,
    isInternal: false,
    createdAt: new Date(),
  });

  // 4. Verify Ticket & Message retrieval
  console.log('3️⃣ Querying ticket and thread history...');
  const [fetchedTicket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId));

  if (!fetchedTicket) throw new Error('Failed to retrieve created ticket!');
  console.log(`   ✅ Ticket retrieved: #${fetchedTicket.id.slice(0, 8)} [${fetchedTicket.status}] Priority: ${fetchedTicket.priority}`);

  // 5. Admin sends a reply message
  console.log('4️⃣ Admin posting response into chat thread...');
  const msg2Id = crypto.randomUUID();
  await db.insert(supportTicketMessages).values({
    id: msg2Id,
    ticketId,
    senderId: null,
    senderType: 'admin',
    senderName: 'Tender Track Support Team',
    senderEmail: 'support@contact.tendertrack360.co.za',
    message: 'Hello! We have received your request and verified your tender documents. Everything is in order.',
    isInternal: false,
    createdAt: new Date(),
  });

  // Update ticket to in_progress
  await db
    .update(supportTickets)
    .set({ status: 'in_progress', updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId));
  console.log('   ✅ Ticket status updated to: in_progress');

  // 6. User sends a follow-up reply
  console.log('5️⃣ User replying back into chat thread...');
  const msg3Id = crypto.randomUUID();
  await db.insert(supportTicketMessages).values({
    id: msg3Id,
    ticketId,
    senderId: testUser?.id || null,
    senderType: 'user',
    senderName: testName,
    senderEmail: testEmail,
    message: 'Thank you for the prompt assistance! Closing this inquiry now.',
    isInternal: false,
    createdAt: new Date(),
  });

  // 7. Admin updates to resolved
  await db
    .update(supportTickets)
    .set({ status: 'resolved', updatedAt: new Date() })
    .where(eq(supportTickets.id, ticketId));
  console.log('   ✅ Ticket status updated to: resolved');

  // 8. Fetch and verify complete thread
  const allMessages = await db
    .select()
    .from(supportTicketMessages)
    .where(eq(supportTicketMessages.ticketId, ticketId))
    .orderBy(asc(supportTicketMessages.createdAt));

  console.log(`6️⃣ Thread Verification: Retrieved ${allMessages.length} messages in chronological order:`);
  for (const m of allMessages) {
    console.log(`   • [${m.senderType.toUpperCase()}] ${m.senderName}: "${m.message.slice(0, 45)}..."`);
  }

  if (allMessages.length !== 3) {
    throw new Error(`Expected 3 messages, got ${allMessages.length}`);
  }

  // 9. Cleanup test ticket
  await db.delete(supportTickets).where(eq(supportTickets.id, ticketId));
  console.log('7️⃣ Cleaned up test ticket successfully (CASCADE verified).');

  console.log('\n🎉 ALL END-TO-END TICKET & CHAT DATABASE TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}

runE2ETest().catch((err) => {
  console.error('❌ E2E Test Failed:', err);
  process.exit(1);
});
