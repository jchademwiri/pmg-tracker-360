/**
 * Seed script: Platform sentinel organisation
 *
 * Inserts the `org_platform_admin` record used by platform-level admin audit
 * log entries (ticket status updates, session revocations). The row is
 * permanently soft-deleted (deletedAt = 2000-01-01) so it never appears in
 * the Organizations page active-org filter.
 *
 * This script is idempotent — safe to run multiple times.
 *
 * Usage:
 *   pnpm --filter db tsx scripts/seed-platform-org.ts
 */

import '../src/load-env';
import { db } from '../src/client';
import { organization } from '../src/schema';

const PLATFORM_ORG_ID = 'org_platform_admin';

async function main() {
  console.log('Seeding platform sentinel organisation...');

  await db
    .insert(organization)
    .values({
      id: PLATFORM_ORG_ID,
      name: '[Platform]',
      slug: 'platform-admin',
      createdAt: new Date(),
      // Permanently soft-deleted — excluded from all active org filters
      deletedAt: new Date('2000-01-01'),
      deletionReason: 'Platform sentinel record — do not restore',
    })
    .onConflictDoNothing();

  console.log(
    `Done. Sentinel org '${PLATFORM_ORG_ID}' is present in the database.`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to seed platform org:', err);
  process.exit(1);
});
