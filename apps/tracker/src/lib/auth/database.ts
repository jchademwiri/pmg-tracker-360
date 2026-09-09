import { and, isNull, isNotNull, type SQL } from "drizzle-orm";
import { member, user } from "@pmg/db/schema";
import { activeMemberWhere } from "@pmg/db/membership";
import type { db } from "@pmg/db";

/**
 * Apply the same live-row policy to Better Auth's SQL adapter as application
 * queries. This runs below the adapter so its member counts, pagination and
 * fallback joins are filtered before execution, including inside transactions.
 * The auth configuration must keep experimental relational joins disabled.
 */
export function withActiveAuthRows(database: typeof db): typeof db {
  function filterBuilder<T extends object>(builder: T, condition: SQL): T {
    return new Proxy(builder, {
      get(target, key, receiver) {
        const value = Reflect.get(target, key, receiver);
        if (typeof value !== "function") return value;
        if (key === "where") {
          return (where?: SQL) =>
            filterBuilder(value.call(target, and(where, condition)), condition);
        }
        // Keep the policy when the adapter applies limit/offset/orderBy before where.
        if (
          [
            "limit",
            "offset",
            "orderBy",
            "returning",
            "set",
            "$dynamic",
          ].includes(String(key))
        ) {
          return (...args: unknown[]) =>
            filterBuilder(value.apply(target, args), condition);
        }
        return value.bind(target);
      },
    });
  }

  return new Proxy(database, {
    get(target, key, receiver) {
      if (key === "insert") {
        return (table: Parameters<typeof database.insert>[0]) => {
          if (table !== member) return target.insert(table);
          return {
            values: (data: typeof member.$inferInsert) =>
              target
                .insert(member)
                .values(data)
                .onConflictDoUpdate({
                  target: [member.organizationId, member.userId],
                  set: { role: data.role ?? "member", deletedAt: null },
                  setWhere: isNotNull(member.deletedAt),
                }),
          };
        };
      }
      if (key === "update") {
        return (table: Parameters<typeof database.update>[0]) =>
          table === member
            ? filterBuilder(target.update(member), activeMemberWhere()!)
            : target.update(table);
      }
      if (key === "select") {
        return (...args: Parameters<typeof database.select>) => {
          const selection = target.select(...args);
          return new Proxy(selection, {
            get(select, property, selectReceiver) {
              if (property === "from") {
                return (table: Parameters<typeof selection.from>[0]) => {
                  const query = select.from(table);
                  const condition =
                    table === member
                      ? activeMemberWhere()
                      : table === user
                        ? isNull(user.deletedAt)
                        : undefined;
                  return condition
                    ? filterBuilder(query.where(condition), condition)
                    : query;
                };
              }
              const value = Reflect.get(select, property, selectReceiver);
              return typeof value === "function" ? value.bind(select) : value;
            },
          });
        };
      }
      if (key === "delete") {
        return (table: Parameters<typeof database.delete>[0]) => {
          if (table !== member) return target.delete(table);
          const condition = activeMemberWhere()!;
          // Returning rows preserves the adapter's deleteMany affected-row count.
          return filterBuilder(
            target
              .update(member)
              .set({ deletedAt: new Date() })
              .where(condition)
              .returning(),
            condition,
          );
        };
      }
      if (key === "transaction") {
        return (callback: (tx: typeof db) => Promise<unknown>) =>
          target.transaction((tx) =>
            callback(withActiveAuthRows(tx as unknown as typeof db)),
          );
      }
      const value = Reflect.get(target, key, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
