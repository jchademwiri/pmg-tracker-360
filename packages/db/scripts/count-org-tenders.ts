import "../src/load-env";
import postgres from "postgres";


const organizationId = process.argv[2];

if (!organizationId) {
  throw new Error("Usage: bun scripts/count-org-tenders.ts <organization-id>");
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const sql = postgres(databaseUrl);

try {
  const [total] = await sql<{ count: string }[]>`
    SELECT count(*)::text AS count
    FROM tender
    WHERE organization_id = ${organizationId}
      AND deleted_at IS NULL
  `;

  const byStatus = await sql<{ status: string; count: string }[]>`
    SELECT status, count(*)::text AS count
    FROM tender
    WHERE organization_id = ${organizationId}
      AND deleted_at IS NULL
    GROUP BY status
    ORDER BY status ASC
  `;

  console.log(`Total tenders: ${total?.count ?? "0"}`);
  console.table(byStatus);
} finally {
  await sql.end();
}
