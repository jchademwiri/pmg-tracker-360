/** @jest-environment node */
import { drizzle } from "drizzle-orm/postgres-js";
import { count, eq } from "drizzle-orm";
import { schema, member, user, session } from "@pmg/db/schema";
import { activeMemberWhere } from "@pmg/db/membership";
import { withActiveAuthRows } from "@/lib/auth/database";
import type { db } from "@pmg/db";

const database = drizzle.mock({ schema });

describe("active membership queries", () => {
  it("filters both deleted rows before relational pagination and preserves user subquery aliases", () => {
    const query = database.query.member
      .findMany({
        where: activeMemberWhere(eq(member.organizationId, "org-1")),
        with: { user: true },
        limit: 10,
      })
      .toSQL();
    expect(query.sql).toContain('"member"."deleted_at" is null');
    expect(query.sql).toContain(
      'select "id" from "user" where "user"."deleted_at" is null',
    );
    expect(query.params).toContain("org-1");
  });

  it("filters nested organization member lists with the correct aliases", () => {
    const query = database.query.organization
      .findMany({
        with: { members: { where: activeMemberWhere(), with: { user: true } } },
      })
      .toSQL();
    expect(query.sql).toContain('"organization_members"."deleted_at" is null');
    expect(query.sql).toContain(
      '"organization_members"."user_id" in (select "id" from "user"',
    );
  });
});

describe("Better Auth database policy", () => {
  const authDb = withActiveAuthRows(database as unknown as typeof db);

  it("keeps the filter when the adapter replaces where after pagination", () => {
    const query = authDb
      .select()
      .from(member)
      .limit(5)
      .offset(2)
      .where(eq(member.organizationId, "org-1"))
      .toSQL();
    expect(query.sql).toContain('"member"."deleted_at" is null');
    expect(query.sql).toContain('"user"."deleted_at" is null');
    expect(query.params).toEqual(["org-1", 5, 2]);
  });

  it("filters counts and users without requiring caller-supplied where", () => {
    expect(
      authDb.select({ count: count() }).from(member).toSQL().sql,
    ).toContain('"user"."deleted_at" is null');
    expect(authDb.select().from(user).toSQL().sql).toContain(
      '"user"."deleted_at" is null',
    );
  });

  it("soft-deletes memberships but retains real session revocation", () => {
    const query = authDb
      .delete(member)
      .where(eq(member.id, "member-1"))
      .toSQL();
    expect(query.sql).toMatch(/^update "member" set "deleted_at"/);
    expect(query.sql).toContain('"member"."id" =');
    expect(query.sql).toContain('"member"."deleted_at" is null');
    expect(query.params[1]).toBe("member-1");
    expect(
      authDb.delete(session).where(eq(session.id, "session-1")).toSQL().sql,
    ).toMatch(/^delete from "session"/);
  });

  it("reactivates a removed membership on re-invitation without replacing its identity", () => {
    const query = authDb
      .insert(member)
      .values({
        id: "new-id",
        userId: "user-1",
        organizationId: "org-1",
        role: "member",
        createdAt: new Date(),
      })
      .returning()
      .toSQL();
    expect(query.sql).toContain(
      'on conflict ("organization_id","user_id") do update',
    );
    expect(query.sql).toContain('"member"."deleted_at" is not null');
    expect(query.sql.split("do update")[1]).not.toContain('"id" =');
  });
});
