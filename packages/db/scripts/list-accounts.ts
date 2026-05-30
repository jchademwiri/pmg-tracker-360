import { db } from '../src/client';
import { account, user } from '../src/schema';
import { eq } from 'drizzle-orm';

async function run() {
  console.log('--- REGISTERED ACCOUNTS IN DATABASE ---');
  const accounts = await db.select().from(account);
  console.log(JSON.stringify(accounts, null, 2));
}

run()
  .catch(console.error)
  .finally(async () => {
    const { client } = await import('../src/client');
    await client.end();
    process.exit(0);
  });
