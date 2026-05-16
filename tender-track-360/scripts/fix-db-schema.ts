import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const client = postgres(connectionString);

async function main() {
  console.log('Fixing database schema issues...');

  // 1. Add missing 'role' column to 'user' table
  try {
    console.log("Checking for 'role' column in 'user' table...");
    await client`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user' NOT NULL;`;
    console.log("Added 'role' column (if it didn't exist).");
  } catch (err) {
    console.error("Error adding 'role' column:", err);
  }

  // 2. Remove duplicate members
  try {
    console.log('Removing duplicate members to satisfy unique constraint...');
    // Keep the most recently created member for each (organization_id, user_id) pair

    // First, let's identify how many duplicates there are
    const duplicates = await client`
      SELECT organization_id, user_id, COUNT(*) as count
      FROM "member"
      GROUP BY organization_id, user_id
      HAVING COUNT(*) > 1
    `;

    console.log(`Found ${duplicates.length} sets of duplicate members.`);

    if (duplicates.length > 0) {
      // Delete duplicates ensuring one remains (prioritize latest created_at)
      await client`
        DELETE FROM "member" a USING "member" b
        WHERE a.created_at < b.created_at
        AND a.organization_id = b.organization_id
        AND a.user_id = b.user_id
        AND a.id != b.id;
        `;

      // Handle identical timestamps if any
      await client`
        DELETE FROM "member" a USING "member" b
        WHERE a.created_at = b.created_at
        AND a.id < b.id
        AND a.organization_id = b.organization_id
        AND a.user_id = b.user_id
        AND a.id != b.id;
        `;
      console.log('Duplicates removed.');
    } else {
      console.log('No duplicates found.');
    }
  } catch (err) {
    console.error('Error removing duplicates:', err);
  }

  console.log('Database fix script completed.');
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
