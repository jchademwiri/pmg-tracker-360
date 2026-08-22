import { db } from "@pmg/db";
import { member, user } from "@pmg/db/schema";
import { eq } from "drizzle-orm";

export interface ReminderRecipient {
  userId: string;
  name: string;
  email: string;
}

/**
 * All members of an organization, for reminder fan-out.
 *
 * Deliberately NOT exported from a "use server" module and has no session
 * check — it's only ever called from the cron sweep (`sweep.ts`), which has
 * no logged-in user. Never import this into a client-reachable Server Action.
 */
export async function getReminderRecipients(
  organizationId: string,
): Promise<ReminderRecipient[]> {
  const rows = await db
    .select({
      userId: user.id,
      name: user.name,
      email: user.email,
    })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, organizationId));

  return rows;
}
