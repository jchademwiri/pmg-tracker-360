import { db } from "@pmg/db";
import { notificationPreferences } from "@pmg/db/schema";
import { eq } from "drizzle-orm";

export interface ReminderPreferences {
  emailNotifications: boolean;
  tenderReminders: boolean;
  projectUpdates: boolean;
  calendarReminders: boolean;
}

/** Column defaults from the schema — used when a user has no preferences row yet. */
const DEFAULT_PREFERENCES: ReminderPreferences = {
  emailNotifications: true,
  tenderReminders: true,
  projectUpdates: true,
  calendarReminders: true,
};

export async function getReminderPreferences(
  userId: string,
): Promise<ReminderPreferences> {
  const [row] = await db
    .select({
      emailNotifications: notificationPreferences.emailNotifications,
      tenderReminders: notificationPreferences.tenderReminders,
      projectUpdates: notificationPreferences.projectUpdates,
      calendarReminders: notificationPreferences.calendarReminders,
    })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  return row ?? DEFAULT_PREFERENCES;
}
