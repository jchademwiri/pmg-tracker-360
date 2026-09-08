import { config } from "dotenv";
import path from "node:path";
import postgres from "postgres";

config({ path: path.resolve(import.meta.dirname, "../../../apps/tracker/.env.local") });

const applyChanges = process.argv.includes("--apply");
const preferredOwnerEmail = "meggiemtsweni@gmail.com";

async function fixDuplicateOwners() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const isLocal =
    databaseUrl.includes("localhost") ||
    databaseUrl.includes("127.0.0.1") ||
    databaseUrl.includes("sslmode=disable");
  const sql = postgres(databaseUrl, {
    max: 1,
    ssl: isLocal ? false : "require",
  });

  try {
    const duplicates = await sql<
      { organization_id: string; organization_name: string; owner_count: number }[]
    >`
      SELECT m.organization_id, o.name AS organization_name, count(*)::int AS owner_count
      FROM member m
      INNER JOIN organization o ON o.id = m.organization_id
      WHERE m.role = 'owner' AND m.deleted_at IS NULL
      GROUP BY m.organization_id, o.name
      HAVING count(*) > 1
      ORDER BY o.name;
    `;

    if (duplicates.length === 0) {
      console.log("No duplicate active owners found.");
      return;
    }

    console.table(duplicates);
    if (!applyChanges) {
      console.log("Dry run only. Re-run with --apply to demote secondary owners to admin.");
      return;
    }

    const demoted = await sql.begin(async (tx) =>
      tx<{ organization_id: string; user_id: string; email: string }[]>`
        WITH ranked_owners AS (
          SELECT
            m.id,
            m.organization_id,
            m.user_id,
            u.email,
            row_number() OVER (
              PARTITION BY m.organization_id
              ORDER BY
                CASE WHEN u.email = ${preferredOwnerEmail} THEN 0 ELSE 1 END,
                m.created_at ASC,
                m.id ASC
            ) AS owner_rank
          FROM member m
          INNER JOIN "user" u ON u.id = m.user_id
          WHERE m.role = 'owner' AND m.deleted_at IS NULL
        )
        UPDATE member m
        SET role = 'admin'
        FROM ranked_owners r
        WHERE m.id = r.id AND r.owner_rank > 1
        RETURNING m.organization_id, m.user_id, r.email;
      `,
    );

    console.table(demoted);
    console.log(`Demoted ${demoted.length} secondary owner(s) to admin.`);
  } finally {
    await sql.end();
  }
}

fixDuplicateOwners().catch((error) => {
  console.error("Failed to remediate duplicate owners:", error);
  process.exitCode = 1;
});
