import { db } from '../src/client';
import { user } from '../src/schema';
import { eq } from 'drizzle-orm';

async function run() {
  console.log('Promoting hello@jacobc.co.za to admin...');
  await db
    .update(user)
    .set({ role: 'admin' })
    .where(eq(user.email, 'hello@jacobc.co.za'));
  console.log('✅ hello@jacobc.co.za promoted successfully.');
}

run()
  .catch(console.error)
  .finally(async () => {
    const { client } = await import('../src/client');
    await client.end();
    process.exit(0);
  });
