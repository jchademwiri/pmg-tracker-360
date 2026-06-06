import { config } from "dotenv";
import postgres from "postgres";
import * as path from "path";

config({ path: path.resolve(__dirname, "../../../.env.local") });

const organizationId = process.argv[2];
const outputPath = process.argv[3];

if (!organizationId) {
  throw new Error("Usage: bun scripts/list-org-clients.ts <organization-id> [output-json-path]");
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const sql = postgres(databaseUrl);

try {
  const clients = await sql<{
    id: string;
    organization_id: string;
    name: string;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
  }[]>`
    SELECT
      id,
      organization_id,
      name,
      contact_name,
      contact_email,
      contact_phone
    FROM client
    WHERE organization_id = ${organizationId}
      AND deleted_at IS NULL
    ORDER BY name ASC
  `;

  if (outputPath) {
    const fs = await import("fs/promises");
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(clients, null, 2));
  }

  console.table(clients);
  console.log(`Found ${clients.length} clients for org ${organizationId}`);
} finally {
  await sql.end();
}
