import { db } from '../src/client';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Checking columns in support_ticket_messages...');
  
  const cols = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'support_ticket_messages';
  `);
  console.log('Current DB Columns:', cols);

  // Check if sender_id exists or user_id exists
  await db.execute(sql`
    DO $$ 
    BEGIN 
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'support_ticket_messages' AND column_name = 'user_id'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'support_ticket_messages' AND column_name = 'sender_id'
      ) THEN
        ALTER TABLE support_ticket_messages RENAME COLUMN user_id TO sender_id;
      ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'support_ticket_messages' AND column_name = 'sender_id'
      ) THEN
        ALTER TABLE support_ticket_messages ADD COLUMN sender_id text REFERENCES "user"(id) ON DELETE SET NULL;
      END IF;
    END $$;
  `);

  console.log('Schema fixed! Re-checking columns...');
  const updatedCols = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'support_ticket_messages';
  `);
  console.log('Updated DB Columns:', updatedCols);

  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
