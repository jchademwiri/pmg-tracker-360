import { db } from '../src/client';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('🔄 Creating incremental sequence for support ticket numbers...');

  // 1. Create sequence if not exists
  await db.execute(sql`
    CREATE SEQUENCE IF NOT EXISTS support_ticket_number_seq START WITH 1001 INCREMENT BY 1;
  `);

  // 2. Add ticket_number column if not exists
  await db.execute(sql`
    ALTER TABLE support_tickets 
    ADD COLUMN IF NOT EXISTS ticket_number integer;
  `);

  // 3. Set default to nextval
  await db.execute(sql`
    ALTER TABLE support_tickets 
    ALTER COLUMN ticket_number SET DEFAULT nextval('support_ticket_number_seq');
  `);

  // 4. Backfill existing tickets in chronological order (oldest first)
  await db.execute(sql`
    WITH numbered AS (
      SELECT id, 1000 + ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_num
      FROM support_tickets
    )
    UPDATE support_tickets 
    SET ticket_number = numbered.new_num
    FROM numbered
    WHERE support_tickets.id = numbered.id AND (support_tickets.ticket_number IS NULL OR support_tickets.ticket_number = 0);
  `);

  // 5. Update sequence to continue from max + 1
  await db.execute(sql`
    SELECT setval('support_ticket_number_seq', COALESCE((SELECT MAX(ticket_number) FROM support_tickets), 1000) + 1, false);
  `);

  console.log('✅ Ticket numbers backfilled and sequence configured!');

  // Verify
  const rows = await db.execute(sql`
    SELECT id, ticket_number, subject, created_at FROM support_tickets ORDER BY ticket_number ASC;
  `);
  console.log('Ticket numbering verification:', rows);

  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
