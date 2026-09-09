import { and, inArray, isNull, type SQL } from "drizzle-orm";
import { QueryBuilder } from "drizzle-orm/pg-core";
import { member, user } from "./schema";

/** Active membership requires both the membership and its user to be live.
 * A subquery also works in relational queries, where Drizzle aliases member.
 */
export function activeMemberWhere(...conditions: (SQL | undefined)[]) {
  return and(
    ...conditions,
    isNull(member.deletedAt),
    inArray(
      member.userId,
      new QueryBuilder()
        .select({ id: user.id })
        .from(user)
        .where(isNull(user.deletedAt)),
    ),
  );
}
