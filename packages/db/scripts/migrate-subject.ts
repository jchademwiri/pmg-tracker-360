import { db } from '../src/client';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Adding subject column to support_tickets if not exists...');
  
  await db.execute(sql`
    ALTER TABLE support_tickets 
    ADD COLUMN IF NOT EXISTS subject text NOT NULL DEFAULT 'Support Request';
  `);

  // Update empty subjects from message preview
  await db.execute(sql`
    UPDATE support_tickets 
    SET subject = CASE 
      WHEN length(message) > 60 THEN substring(message from 1 for 60) || '...'
      WHEN length(message) > 0 THEN message
      ELSE 'Support Request'
    END
    WHERE subject = 'Support Request' OR subject IS NULL OR subject = '';
  `);

  console.log('Migration complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
