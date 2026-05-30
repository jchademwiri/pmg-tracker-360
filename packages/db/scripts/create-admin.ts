import { auth } from '../../apps/admin/src/lib/auth';
import { db } from '../src/client';
import { user } from '../src/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const email = 'admin@tendertrack360.co.za';
  const password = 'SecureAdmin2026!';
  const name = 'System Administrator';

  console.log(`Registering user ${email} via Better Auth...`);

  try {
    const res = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    console.log('Account registered in database. User ID:', res.user.id);

    console.log('Promoting user to admin role...');
    await db
      .update(user)
      .set({ role: 'admin' })
      .where(eq(user.email, email));

    console.log(`✅ Success! ${email} is now a platform admin.`);
    console.log(`Login Email: ${email}`);
    console.log(`Login Password: ${password}`);
  } catch (error) {
    console.error('Failed to create admin:', error);
  }
}

run()
  .catch(console.error)
  .finally(async () => {
    const { client } = await import('../src/client');
    await client.end();
    process.exit(0);
  });
