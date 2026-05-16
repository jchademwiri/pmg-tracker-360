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
  const email = 'hello@jacobc.co.za';
  console.log(`Updating role for user: ${email}...`);

  try {
    const result = await client`
      UPDATE "user"
      SET role = 'admin'
      WHERE email = ${email}
      RETURNING id, name, email, role;
    `;

    if (result.length > 0) {
      console.log('Success! Updated user:', result[0]);
    } else {
      console.log('User not found.');
    }
  } catch (err) {
    console.error('Error updating role:', err);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
