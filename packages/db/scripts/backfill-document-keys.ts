/**
 * backfill-document-keys.ts
 *
 * Backfills existing document storage keys to include the tender number prefix.
 *
 * Background:
 *   When documents were first implemented, storage keys stored in `document.url` had the format:
 *     {organizationId}/{entityType}/{entityId}/{timestamp}-{fileName}
 *
 *   After the tender number prefix feature was added, new keys follow the format:
 *     {organizationId}/{entityType}/{tenderNumber}/{entityId}/{timestamp}-{fileName}
 *
 * This script:
 *   1. Finds all documents with a `tenderId` or `extensionId` set
 *   2. Checks if their current `url` already contains the tender number prefix
 *   3. Copies the file in R2 to the new key with the tender number prefix
 *   4. Updates the `document.url` in the database
 *   5. Deletes the old key from R2 (unless --copy-only is passed)
 *
 * Run from packages/db/: bun scripts/backfill-document-keys.ts [--dry-run] [--copy-only]
 *
 * Prerequisites:
 *   1. Install dependencies: bun install (from monorepo root or packages/db/)
 *   2. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME in .env.local
 *
 * Options:
 *   --dry-run   : Preview changes without modifying anything
 *   --copy-only : Copy files to new keys but don't delete old keys (safe rollback)
 */
import "../src/load-env";
import postgres from "postgres";
import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const S3_API = process.env.S3_API;

function createS3Client() {
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !(R2_ACCOUNT_ID || S3_API)) {
    return null;
  }
  return new S3Client({
    region: "auto",
    endpoint: S3_API || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
}

// ---------------------------------------------------------------------------
// Storage key computation — mirrors apps/tracker/src/server/documents.ts
// ---------------------------------------------------------------------------

/**
 * Sanitizes a tender number for use as a storage key prefix.
 */
function sanitizePrefix(tenderNumber: string): string {
  return tenderNumber.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
}

/**
 * Computes the new storage key with the tender number prefix.
 */
function computeNewKey(
  oldKey: string,
  tenderNumber: string,
  entityPrefix: "tenders" | "extensions"
): string | null {
  const prefix = sanitizePrefix(tenderNumber);

  // The old format is: {orgId}/{entityPrefix}/{entityId}/{timestamp}-{fileName}
  // The new format is: {orgId}/{entityPrefix}/{tenderPrefix}/{entityId}/{timestamp}-{fileName}
  // So we need to insert the {tenderPrefix}/ after the entity prefix.

  // Old format: {orgId}/{entityPrefix}/{entityId}/{timestamp}-{fileName}
  // We need to capture everything up to {entityPrefix}/ then insert the tender prefix after it.
  const pattern = new RegExp(
    `^(.+?/${escapeRegex(entityPrefix)}/)(.+)$`
  );

  const match = oldKey.match(pattern);
  if (!match) {
    // Key doesn't match the expected format — skip
    return null;
  }

  // match[1] = "{orgId}/{entityPrefix}/"
  // match[2] = "{entityId}/{timestamp}-{fileName}"
  return `${match[1]}${prefix}/${match[2]}`;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Checks if a key already has the tender number prefix.
 * The new format has a 3rd path segment between entityPrefix and entityId:
 *   {orgId}/{entityPrefix}/{tenderPrefix}/{entityId}/{timestamp}-{fileName}
 * vs old:
 *   {orgId}/{entityPrefix}/{entityId}/{timestamp}-{fileName}
 *
 * We can detect this by checking if the key has at least 4 segments after
 * stripping the first segment (orgId), and the 3rd segment matches the
 * sanitized tender number pattern.
 */
function hasTenderNumberPrefix(key: string, tenderNumber: string): boolean {
  const prefix = sanitizePrefix(tenderNumber);
  // In the new format, the key contains: .../{entityPrefix}/{prefix}/{entityId}/...
  return key.includes(`/${prefix}/`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
interface DocumentRow {
  id: string;
  organization_id: string;
  url: string;
  tender_id: string | null;
  extension_id: string | null;
}

interface TenderRow {
  id: string;
  tender_number: string;
}

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const copyOnly = args.includes("--copy-only");

  if (dryRun) {
    console.log("🧪 DRY-RUN mode — no changes will be made.\n");
  } else {
    console.log("⚠️  LIVE mode — changes WILL be applied.\n");
    if (copyOnly) {
      console.log("📋 Copy-only mode — old keys will NOT be deleted.\n");
    }
  }

  // ---- Validate config ---------------------------------------------------
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

  const s3 = createS3Client();
  if (!s3 || !R2_BUCKET_NAME) {
    console.warn(
      "⚠️  R2 storage not configured (missing credentials or bucket name).\n" +
        "   Document URLs will be updated in the database but files will NOT be copied/moved in R2.\n"
    );
  }

  const sql = postgres(databaseUrl, { max: 1 });

  try {
    // ---- 1. Find documents needing backfill ------------------------------
    const docs = await sql<DocumentRow[]>`
      SELECT id, organization_id, url, tender_id, extension_id
      FROM document
      WHERE (tender_id IS NOT NULL OR extension_id IS NOT NULL)
      ORDER BY created_at ASC
    `;

    console.log(`Found ${docs.length} document(s) linked to tenders or extensions.\n`);

    if (docs.length === 0) {
      console.log("✅ No documents to backfill.");
      return;
    }

    // ---- 2. Build a tenderNumber lookup ----------------------------------
    // Collect all unique tender IDs (direct + via extensions)
    const tenderIds = new Set<string>();
    const extensionIds = new Set<string>();

    for (const doc of docs) {
      if (doc.tender_id) tenderIds.add(doc.tender_id);
      if (doc.extension_id) extensionIds.add(doc.extension_id);
    }

    // Fetch tender numbers for direct tender documents
    const tenderNumberMap = new Map<string, string>();
    if (tenderIds.size > 0) {
      const tenders = await sql<TenderRow[]>`
        SELECT id, tender_number
        FROM tender
        WHERE id = ANY(${[...tenderIds]})
      `;
      for (const t of tenders) {
        tenderNumberMap.set(t.id, t.tender_number);
      }
    }

    // Fetch tender numbers for extension documents (via tender join)
    const extensionTenderMap = new Map<string, string>();
    if (extensionIds.size > 0) {
      const extensions = await sql<{ id: string; tender_number: string }[]>`
        SELECT te.id, t.tender_number
        FROM tender_extension te
        JOIN tender t ON t.id = te.tender_id
        WHERE te.id = ANY(${[...extensionIds]})
      `;
      for (const ext of extensions) {
        extensionTenderMap.set(ext.id, ext.tender_number);
      }
    }

    // ---- 3. Process each document ----------------------------------------
    let toBackfill = 0;
    let alreadyPrefixed = 0;
    let skippedMissingTender = 0;
    let processed = 0;

    for (const doc of docs) {
      let tenderNumber: string | undefined;
      let entityPrefix: "tenders" | "extensions" | null = null;

      if (doc.tender_id) {
        tenderNumber = tenderNumberMap.get(doc.tender_id);
        entityPrefix = "tenders";
      } else if (doc.extension_id) {
        tenderNumber = extensionTenderMap.get(doc.extension_id);
        entityPrefix = "extensions";
      }

      if (!tenderNumber || !entityPrefix) {
        console.log(
          `  ⚠️  Doc ${doc.id.slice(0, 8)}...: linked ${doc.tender_id ? "tender" : "extension"} not found, skipping.`
        );
        skippedMissingTender++;
        continue;
      }

      // Check if already has the prefix
      if (hasTenderNumberPrefix(doc.url, tenderNumber)) {
        alreadyPrefixed++;
        continue;
      }

      // Compute new key
      const newKey = computeNewKey(doc.url, tenderNumber, entityPrefix);
      if (!newKey) {
        console.log(
          `  ⚠️  Doc ${doc.id.slice(0, 8)}...: cannot compute new key for URL "${doc.url}", skipping.`
        );
        continue;
      }

      toBackfill++;
      console.log(
        `  📄 Doc ${doc.id.slice(0, 8)}... (${entityPrefix}): ${doc.url.split("/").pop()}`
      );
      console.log(`     Old key : ${doc.url}`);
      console.log(`     New key : ${newKey}`);
    }

    console.log(`\nSummary:`);
    console.log(`   Already prefixed : ${alreadyPrefixed}`);
    console.log(`   To backfill      : ${toBackfill}`);
    console.log(`   Skipped (orphan) : ${skippedMissingTender}`);

    if (toBackfill === 0) {
      console.log("\n✅ No documents need backfilling.");
      return;
    }

    if (dryRun) {
      console.log("\n🧪 Dry-run complete. Omit --dry-run to apply changes.");
      return;
    }

    // ---- 4. Confirm with user -------------------------------------------
    console.log("\nType YES to apply these changes, or anything else to cancel:");
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

    // ---- 5. Apply updates ------------------------------------------------
    let copied = 0;
    let deleted = 0;
    let dbUpdated = 0;
    let errors = 0;

    for (const doc of docs) {
      let tenderNumber: string | undefined;
      let entityPrefix: "tenders" | "extensions" | null = null;

      if (doc.tender_id) {
        tenderNumber = tenderNumberMap.get(doc.tender_id);
        entityPrefix = "tenders";
      } else if (doc.extension_id) {
        tenderNumber = extensionTenderMap.get(doc.extension_id);
        entityPrefix = "extensions";
      }

      if (!tenderNumber || !entityPrefix) continue;
      if (hasTenderNumberPrefix(doc.url, tenderNumber)) continue;

      const newKey = computeNewKey(doc.url, tenderNumber, entityPrefix);
      if (!newKey) continue;

      try {
        // Copy file in R2 to new key
        if (s3 && R2_BUCKET_NAME) {
          const fullOldKey = doc.url;
          const fullNewKey = newKey;

          // CopySource uses "bucket/key" format — keys only contain safe chars (alphanumeric, dots,
          // underscores, hyphens, forward slashes), so no URL-encoding is needed.
          await s3.send(
            new CopyObjectCommand({
              Bucket: R2_BUCKET_NAME,
              CopySource: `${R2_BUCKET_NAME}/${fullOldKey}`,
              Key: fullNewKey,
            })
          );
          copied++;

          // Delete old key (unless copy-only mode)
          if (!copyOnly) {
            await s3.send(
              new DeleteObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: fullOldKey,
              })
            );
            deleted++;
          }
        }

        // Update database record
        await sql`
          UPDATE document
          SET url = ${newKey}
          WHERE id = ${doc.id}
        `;
        dbUpdated++;

        processed++;
        if (processed % 10 === 0) {
          console.log(`   Progress: ${processed}/${toBackfill}`);
        }
      } catch (err: any) {
        console.error(
          `  ❌ Error processing doc ${doc.id.slice(0, 8)}...: ${err.message}`
        );
        errors++;
      }
    }

    console.log(`\n✅ Backfill complete.`);
    console.log(`   Files copied      : ${copied}`);
    console.log(`   Old keys deleted  : ${deleted}`);
    console.log(`   DB records updated: ${dbUpdated}`);
    console.log(`   Errors            : ${errors}`);

    if (copyOnly) {
      console.log(`\n📋 Copy-only mode was used. Old keys are still in R2.`);
      console.log(`   Run without --copy-only to clean up old keys, or delete them manually.`);
    }
  } finally {
    await sql.end();
  }
}

run().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
