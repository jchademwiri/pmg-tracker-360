/**
 * sanitize-project-numbers.ts
 *
 * Lowersees and sanitizes project numbers in the project table to match the
 * new lowercase-storage convention. The application code already handles
 * lowercase storage and uppercase display for project numbers — this script
 * migrates existing data to match.
 *
 * Run with: bun scripts/sanitize-project-numbers.ts [--dry-run]
 *
 * --dry-run : Preview changes without modifying anything.
 */
import "../src/load-env";
import postgres from "postgres";

// ---------------------------------------------------------------------------
// Sanitisation logic — mirrors apps/tracker/src/lib/tender-utils.ts
// ---------------------------------------------------------------------------
function sanitizeProjectNumber(pn: string): string {
  return pn
    .trim()
    .toLowerCase()
    .replace(/[\\/]/g, "-") // slashes → hyphen
    .replace(/\s+/g, "-") // whitespace → hyphen
    .replace(/[^a-z0-9._-]/g, "-") // remaining unsafe chars → hyphen
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  if (dryRun) {
    console.log("🧪 DRY-RUN mode — no changes will be made.\n");
  } else {
    console.log("⚠️  LIVE mode — changes WILL be applied.\n");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const sql = postgres(databaseUrl, { max: 1 });

  try {
    // ---- 1. Find all project numbers that are not already lowercase/sanitized
    const projects = await sql<{
      id: string;
      organization_id: string;
      project_number: string;
    }[]>`
      SELECT id, organization_id, project_number
      FROM project
      WHERE deleted_at IS NULL
      ORDER BY project_number
    `;

    // Determine which projects need updating
    const toUpdate = projects.filter((p) => {
      const sanitized = sanitizeProjectNumber(p.project_number);
      return sanitized !== p.project_number;
    });

    console.log(
      `Found ${projects.length} project(s), ${toUpdate.length} need(s) updating.\n`,
    );

    if (toUpdate.length === 0) {
      console.log("✅ All project numbers are already lowercased and sanitized.");
      return;
    }

    // ---- 2. Show preview ------------------------------------------------
    for (const p of toUpdate) {
      const sanitized = sanitizeProjectNumber(p.project_number);
      console.log(`  ✗  ${p.project_number}  →  ${sanitized}`);
    }
    console.log("");

    // ---- 3. Check for collisions ----------------------------------------
    const orgGroups = new Map<string, { id: string; old: string }[]>();
    for (const p of toUpdate) {
      const group = orgGroups.get(p.organization_id) || [];
      group.push({ id: p.id, old: p.project_number });
      orgGroups.set(p.organization_id, group);
    }

    // Fetch all existing project numbers for affected orgs (excluding to-update ones)
    const toUpdateIds = toUpdate.map((p) => p.id);
    const existingByOrg = new Map<string, string[]>();
    for (const [orgId] of orgGroups) {
      const existing = await sql<{ project_number: string }[]>`
        SELECT project_number
        FROM project
        WHERE organization_id = ${orgId}
          AND deleted_at IS NULL
          AND id != ALL(${toUpdateIds})
      `;
      existingByOrg.set(
        orgId,
        existing.map((r) => r.project_number),
      );
    }

    const updatedEntries: { old: string; new: string }[] = [];

    for (const [orgId, members] of orgGroups) {
      const existingNumbers = existingByOrg.get(orgId) ?? [];
      const seenWithinDirty = new Map<string, string[]>();

      for (const m of members) {
        const sanitized = sanitizeProjectNumber(m.old);

        // Check collision with clean projects
        if (existingNumbers.some((n) => n === sanitized)) {
          console.warn(
            `  ⚠️  COLLISION (org ${orgId.slice(0, 8)}...): "${m.old}" sanitises to "${sanitized}" which already exists. Skipping.`,
          );
          continue;
        }

        // Check collision among projects being updated
        const prev = seenWithinDirty.get(sanitized);
        if (prev) {
          console.warn(
            `  ⚠️  COLLISION (org ${orgId.slice(0, 8)}...): "${m.old}" and "${prev[0]}" both sanitise to "${sanitized}". Skipping both.`,
          );
          const prevIdx = updatedEntries.findIndex((e) => e.old === prev[0]);
          if (prevIdx !== -1) updatedEntries.splice(prevIdx, 1);
        }

        seenWithinDirty.set(sanitized, [...(prev || []), m.old]);
        if (!prev) {
          updatedEntries.push({ old: m.old, new: sanitized });
        }
      }
    }

    if (updatedEntries.length === 0) {
      console.log("No non-colliding project numbers to update.");
      return;
    }

    console.log(
      `${updatedEntries.length} project(s) will be updated (after collision check).`,
    );

    if (dryRun) {
      console.log(
        "\n🧪 Dry-run complete. Pass --dry-run to see preview, omit to apply.",
      );
      return;
    }

    // ---- 4. Confirm with user -------------------------------------------
    console.log(
      "\nType YES to apply these changes, or anything else to cancel:",
    );

    const input = await new Promise<string>((resolve) => {
      process.stdin.setRawMode?.(false);
      process.stdin.resume();
      process.stdin.once("data", (data) => {
        resolve((data as Buffer).toString().trim());
      });
    });
    process.stdin.pause();

    if (input !== "YES") {
      console.log("❌ Cancelled. No changes made.");
      return;
    }

    // ---- 5. Apply updates -----------------------------------------------
    let updates = 0;
    let skipped = 0;

    for (const { old, new: newNumber } of updatedEntries) {
      try {
        const result = await sql`
          UPDATE project
          SET project_number = ${newNumber}, updated_at = NOW()
          WHERE project_number = ${old}
            AND deleted_at IS NULL
        `;
        updates += result.count ?? 0;
      } catch (err: any) {
        if (err?.code === "23505") {
          console.warn(
            `  ⚠️  Skipping "${old}" → "${newNumber}" — value already exists (constraint violation).`,
          );
          skipped++;
        } else {
          throw err;
        }
      }
    }

    console.log(`\n✅ Done.`);
    console.log(`   Projects updated: ${updates}`);
    console.log(`   Skipped         : ${skipped}`);
  } finally {
    await sql.end();
  }
}

run().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
