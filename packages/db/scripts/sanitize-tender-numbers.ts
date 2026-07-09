/**
 * sanitize-tender-numbers.ts
 *
 * Finds existing tender numbers with forward slashes (/), backslashes (\), or
 * spaces and sanitizes them using the same logic as sanitizeTenderNumber().
 *
 * Also updates project.project_number for projects that inherited the old
 * tender number.
 *
 * Run with: bun scripts/sanitize-tender-numbers.ts [--dry-run]
 *
 * --dry-run : Preview changes without modifying anything.
 */
import "../src/load-env";
import postgres from "postgres";

// ---------------------------------------------------------------------------
// Sanitisation logic — mirrors apps/tracker/src/lib/tender-utils.ts
// ---------------------------------------------------------------------------
function sanitizeTenderNumber(tenderNumber: string): string {
  return tenderNumber
    .trim()
    .toLowerCase()
    .replace(/[\\/]/g, "-") // slashes → hyphen
    .replace(/\s+/g, "-") // whitespace → hyphen
    .replace(/[^a-z0-9._-]/g, "-") // remaining unsafe chars → hyphen
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function isDirty(t: string): boolean {
  return /[/\\ ]/.test(t);
}

function previewDiff(t: string): string {
  const s = sanitizeTenderNumber(t);
  return t === s ? `  ✓  ${t}  (no change)` : `  ✗  ${t}  →  ${s}`;
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
    // ---- 1. Find dirty tender numbers ------------------------------------
    const dirtyTenders = await sql<{
      id: string;
      organization_id: string;
      tender_number: string;
    }[]>`
      SELECT id, organization_id, tender_number
      FROM tender
      WHERE tender_number ~ '[/\\ ]'
        AND deleted_at IS NULL
      ORDER BY tender_number
    `;

    console.log(
      `Found ${dirtyTenders.length} tender(s) with slashes, backslashes, or spaces.\n`,
    );

    if (dirtyTenders.length === 0) {
      console.log("✅ No tender numbers need sanitisation.");
      return;
    }

    // ---- 2. Show preview ------------------------------------------------
    for (const t of dirtyTenders) {
      console.log(previewDiff(t.tender_number));
    }
    console.log("");

    // ---- 3. Check for potential unique-constraint collisions ------------
    // Group dirty tenders by organization since the unique constraint is
    // (organization_id, tender_number). Collisions only matter within the
    // same organisation — different orgs can safely have identical tender numbers.
    const orgGroups = new Map<string, { id: string; oldNumber: string }[]>();
    for (const t of dirtyTenders) {
      const group = orgGroups.get(t.organization_id) || [];
      group.push({ id: t.id, oldNumber: t.tender_number });
      orgGroups.set(t.organization_id, group);
    }

    // Also fetch ALL existing tender numbers per org so we can detect collisions
    // with clean (already-sanitized) tenders in the same organisation.
    // We exclude the dirty tenders' own IDs to avoid a tender falsely
    // detecting itself as a collision.
    const dirtyIds = dirtyTenders.map((t) => t.id);
    const existingByOrg = new Map<string, string[]>();
    for (const [orgId] of orgGroups) {
      const existing = await sql<{ tender_number: string }[]>`
        SELECT tender_number
        FROM tender
        WHERE organization_id = ${orgId}
          AND deleted_at IS NULL
          AND id != ALL(${dirtyIds})
      `;
      existingByOrg.set(orgId, existing.map((r) => r.tender_number));
    }

    const updatedEntries: { oldNumber: string; newNumber: string }[] = [];

    for (const [orgId, tenders] of orgGroups) {
      // Track sanitised → [original] within this org to detect collisions
      const seenWithinDirty = new Map<string, string[]>();
      const existingNumbers = existingByOrg.get(orgId) ?? [];

      for (const t of tenders) {
        const sanitized = sanitizeTenderNumber(t.oldNumber);

        // Check if this sanitized value already exists as a CLEAN tender
        // (not one of the dirty ones being updated)
        const alreadyExists = existingNumbers.some((n) => n === sanitized);
        if (alreadyExists) {
          console.warn(
            `  ⚠️  COLLISION (org ${orgId.slice(0, 8)}...): "${t.oldNumber}" sanitises to "${sanitized}" which already exists in this organisation. Skipping.`,
          );
          continue;
        }

        // Check for collisions among dirty tenders within the same org
        const prev = seenWithinDirty.get(sanitized);
        if (prev) {
          console.warn(
            `  ⚠️  COLLISION (org ${orgId.slice(0, 8)}...): "${t.oldNumber}" and "${prev[0]}" both sanitise to "${sanitized}". Skipping both.`,
          );
          // Remove the previously added entry (safe - only call splice if found)
          const prevIdx = updatedEntries.findIndex((e) => e.oldNumber === prev[0]);
          if (prevIdx !== -1) updatedEntries.splice(prevIdx, 1);
        }
        seenWithinDirty.set(sanitized, [...(prev || []), t.oldNumber]);
        if (!prev) {
          updatedEntries.push({ oldNumber: t.oldNumber, newNumber: sanitized });
        }
      }
    }

    if (updatedEntries.length === 0) {
      console.log("No non-colliding tender numbers to update.");
      return;
    }

    console.log(
      `\n${updatedEntries.length} tender(s) will be updated (after collision check).`,
    );

    if (dryRun) {
      console.log("\n🧪 Dry-run complete. Pass --dry-run to see preview, omit to apply.");
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
    let tenderUpdates = 0;
    let projectUpdates = 0;
    let skippedWithWarning = 0;

    for (const { oldNumber, newNumber } of updatedEntries) {
      // Pre-check: verify no unique constraint violation would occur
      const conflict = await sql`
        SELECT 1
        FROM tender
        WHERE tender_number = ${newNumber}
          AND tender_number != ${oldNumber}
          AND deleted_at IS NULL
        LIMIT 1
      `;
      if (conflict.length > 0) {
        console.warn(
          `  ⚠️  Skipping "${oldNumber}" → "${newNumber}" — value already exists in database.`,
        );
        skippedWithWarning++;
        continue;
      }

      // Update tender table
      const tenderResult = await sql`
        UPDATE tender
        SET tender_number = ${newNumber}, updated_at = NOW()
        WHERE tender_number = ${oldNumber}
          AND deleted_at IS NULL
      `;
      tenderUpdates += tenderResult.count ?? 0;

      // Update project table for projects that inherited the old tender number
      const projectResult = await sql`
        UPDATE project
        SET project_number = ${newNumber}, updated_at = NOW()
        WHERE project_number = ${oldNumber}
          AND deleted_at IS NULL
      `;
      projectUpdates += projectResult.count ?? 0;
    }

    console.log(`\n✅ Done.`);
    console.log(`   Tenders updated          : ${tenderUpdates}`);
    console.log(`   Projects updated         : ${projectUpdates}`);
    console.log(`   Skipped (collision warn) : ${skippedWithWarning}`);

    // ---- 6. Legacy data files (informational) ---------------------------
    console.log(`\n📁 Note: The following data files may also need updating:`);
    console.log(`   - data/tenders-2026-accounts-livhuandmusa.import-ready.json`);
    console.log(`   - data/tenders-2026-accounts-livhuandmusa.json`);
    console.log(`   - data/insert-livhu-musa-tenders.sql`);
    console.log(`   - data/insert-livhu-musa-tenders-with-client-ids.sql`);
  } finally {
    await sql.end();
  }
}

run().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
