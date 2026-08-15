import { db } from '../src/client';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Running support ticket messages migration...');
  
  await db.execute(sql`
    ALTER TABLE support_tickets 
    ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'medium',
    ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS support_ticket_messages (
      id text PRIMARY KEY,
      ticket_id text NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
      user_id text REFERENCES "user"(id) ON DELETE SET NULL,
      sender_type text NOT NULL,
      sender_name text NOT NULL,
      sender_email text NOT NULL,
      message text NOT NULL,
      is_internal boolean NOT NULL DEFAULT false,
      read_at timestamp with time zone,
      created_at timestamp with time zone NOT NULL DEFAULT now()
    );
  `);

  // Create initial message for any existing tickets if not already migrated
  await db.execute(sql`
    INSERT INTO support_ticket_messages (id, ticket_id, user_id, sender_type, sender_name, sender_email, message, is_internal, created_at)
    SELECT 
      gen_random_uuid()::text,
      st.id,
      st.user_id,
      'user',
      st.name,
      st.email,
      st.message,
      false,
      st.created_at
    FROM support_tickets st
    WHERE NOT EXISTS (
      SELECT 1 FROM support_ticket_messages stm WHERE stm.ticket_id = st.id
    );
  `);

  console.log('Migration successful! Seeded initial messages for existing tickets.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
