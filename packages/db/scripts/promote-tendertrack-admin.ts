import { db } from '../src/client';
import { user } from '../src/schema';
import { eq } from 'drizzle-orm';

async function run() {
  console.log('Promoting info@tendertrack360.co.za to admin...');
  await db
    .update(user)
    .set({ role: 'admin' })
    .where(eq(user.email, 'info@tendertrack360.co.za'));
  console.log('✅ info@tendertrack360.co.za promoted successfully.');
}

run()
  .catch(console.error)
  .finally(async () => {
    const { client } = await import('../src/client');
    await client.end();
    process.exit(0);
  });
