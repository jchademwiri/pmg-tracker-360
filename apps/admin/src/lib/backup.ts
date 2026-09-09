import "server-only";

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { createGzip, createGunzip } from "node:zlib";
import postgres from "postgres";

/* ------------------------------------------------------------------ */
/*  Database Connection                                                */
/* ------------------------------------------------------------------ */

// Create a dedicated postgres connection for backups with SSL enabled
let dbClient: ReturnType<typeof postgres> | null = null;

async function getDb() {
  if (dbClient) return dbClient;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  dbClient = postgres(url, {
    max: 1,
    ssl: "require",
    connect_timeout: 15,
    max_lifetime: 60 * 30,
  });
  return dbClient;
}

/* ------------------------------------------------------------------ */
/*  R2 Config                                                          */
/* ------------------------------------------------------------------ */

function cleanEnv(val?: string | null): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

const R2_ACCOUNT_ID = cleanEnv(process.env.R2_ACCOUNT_ID);
const R2_ACCESS_KEY_ID = cleanEnv(process.env.R2_ACCESS_KEY_ID);
const R2_SECRET_ACCESS_KEY = cleanEnv(process.env.R2_SECRET_ACCESS_KEY);
const R2_BUCKET_NAME = cleanEnv(process.env.R2_BUCKET_NAME);
const S3_API = cleanEnv(process.env.S3_API);
const BACKUP_PREFIX = "database-backup/";
const RETENTION_DAYS = 30;

function getS3Client(): S3Client | null {
  if (
    !R2_ACCESS_KEY_ID ||
    !R2_SECRET_ACCESS_KEY ||
    !(R2_ACCOUNT_ID || S3_API)
  ) {
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

/**
 * Resolved backup storage, or null when the R2 env vars are incomplete.
 * Exported for the startup/health checks so credential problems surface at
 * deploy time instead of as a 401 on the first backup or listing.
 */
export function getBackupStorage(): { s3: S3Client; bucket: string } | null {
  const s3 = getS3Client();
  if (!s3 || !R2_BUCKET_NAME) return null;
  return { s3, bucket: R2_BUCKET_NAME };
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BackupMeta {
  key: string;
  filename: string;
  sizeBytes: number;
  createdAt: string;
  tables: string[];
  rowCount: number;
}

export interface BackupResult {
  success: boolean;
  message: string;
  key?: string;
  meta?: BackupMeta;
}

export interface BackupData {
  version: number;
  createdAt: string;
  tables: Record<string, Record<string, unknown>[]>;
}

/* ------------------------------------------------------------------ */
/*  Table lists                                                        */
/* ------------------------------------------------------------------ */

/** Strictly validates a table name against an allowlist pattern before SQL interpolation. */
function assertSafeTableName(name: string): asserts name is string {
  if (!/^[a-z][a-z0-9_]*$/.test(name)) {
    throw new Error(`Unsafe table name rejected: ${name}`);
  }
}

const ALL_TABLES = [
  "user",
  "session",
  "account",
  "verification",
  "organization",
  "member",
  "invitation",
  "notification_preferences",
  "notification",
  "ownership_transfer",
  "security_audit_log",
  "session_tracking",
  "client",
  "tender",
  "tender_extension",
  "tender_follow_up",
  "tender_activity",
  "project",
  "project_line_item",
  "project_activity",
  "project_risk",
  "purchase_order",
  "purchase_order_line_item",
  "purchase_order_delivery_note",
  "purchase_order_delivery_item",
  "document",
  "waitlist",
  "feedback",
  "support_tickets",
];

const INSERT_ORDER = [
  "user",
  "organization",
  "account",
  "session",
  "verification",
  "member",
  "invitation",
  "notification_preferences",
  "notification",
  "ownership_transfer",
  "security_audit_log",
  "session_tracking",
  "client",
  "tender",
  "tender_extension",
  "tender_follow_up",
  "tender_activity",
  "project",
  "project_line_item",
  "project_activity",
  "project_risk",
  "purchase_order",
  "purchase_order_line_item",
  "purchase_order_delivery_note",
  "purchase_order_delivery_item",
  "document",
  "waitlist",
  "feedback",
  "support_tickets",
];

const ORG_SCOPED_TABLES = new Set([
  "organization",
  "member",
  "invitation",
  "client",
  "tender",
  "tender_extension",
  "tender_follow_up",
  "tender_activity",
  "project",
  "project_line_item",
  "project_activity",
  "project_risk",
  "purchase_order",
  "purchase_order_line_item",
  "purchase_order_delivery_note",
  "purchase_order_delivery_item",
  "notification",
  "session_tracking",
  "security_audit_log",
  "ownership_transfer",
  "document",
]);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function decompressBuffer(data: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const gunzip = createGunzip();
    const chunks: Buffer[] = [];
    gunzip.on("data", (chunk: Buffer) => chunks.push(chunk));
    gunzip.on("end", () => resolve(Buffer.concat(chunks)));
    gunzip.on("error", reject);
    gunzip.end(data);
  });
}

/* ------------------------------------------------------------------ */
/*  Streaming upload to R2                                             */
/* ------------------------------------------------------------------ */

// Comfortably above S3's 5 MB minimum for non-final multipart parts, small
// enough that pending compressed bytes never approach the function's memory.
const PART_SIZE = 8 * 1024 * 1024;
// Rows fetched per DB round-trip while streaming a table.
const ROW_BATCH_SIZE = 500;

/**
 * Buffers compressed output and uploads it to R2/S3 as multipart parts so a
 * backup of any size can be produced without holding it in memory.
 */
class MultipartGzipUploader {
  private parts: Array<{ PartNumber: number; ETag: string }> = [];
  private pending: Buffer[] = [];
  private pendingBytes = 0;
  private uploadedBytes = 0;
  private uploadId: string | null = null;
  private completed = false;

  constructor(
    private readonly s3: S3Client,
    private readonly bucket: string,
    private readonly key: string,
    private readonly metadata?: Record<string, string>,
  ) {}

  async start(): Promise<void> {
    const res = await this.s3.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: this.key,
        ContentType: "application/gzip",
        Metadata: this.metadata,
      }),
    );
    this.uploadId = res.UploadId ?? null;
    if (!this.uploadId) {
      throw new Error("Storage did not return an upload ID for multipart upload");
    }
  }

  /** Called from the gzip 'data' listener — only buffers, never awaits. */
  write(chunk: Buffer): void {
    this.pending.push(chunk);
    this.pendingBytes += chunk.length;
  }

  /**
   * Flushes buffered bytes to storage once they exceed PART_SIZE. Awaited
   * between row batches so memory stays bounded and upload errors propagate
   * into the backup's failure handling.
   */
  async drain(): Promise<void> {
    if (this.pendingBytes < PART_SIZE) return;
    await this.flush();
  }

  private async flush(): Promise<void> {
    if (this.pendingBytes === 0 || !this.uploadId) return;
    const body = Buffer.concat(this.pending);
    this.pending = [];
    this.pendingBytes = 0;

    const partNumber = this.parts.length + 1;
    const res = await this.s3.send(
      new UploadPartCommand({
        Bucket: this.bucket,
        Key: this.key,
        UploadId: this.uploadId,
        PartNumber: partNumber,
        Body: body,
      }),
    );
    this.uploadedBytes += body.length;
    this.parts.push({ PartNumber: partNumber, ETag: res.ETag ?? "" });
  }

  /**
   * Flushes the remaining bytes (the final part, exempt from the 5 MB
   * minimum) and completes the upload. Returns the total uploaded size.
   */
  async complete(): Promise<number> {
    if (this.completed) throw new Error("Uploader already completed");
    this.completed = true;

    await this.flush();

    if (this.parts.length === 0) {
      // Nothing was written (e.g. an empty input) — fall back to an empty object.
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: this.key,
          ContentType: "application/gzip",
          Metadata: this.metadata,
        }),
      );
      return 0;
    }

    await this.s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: this.key,
        UploadId: this.uploadId!,
        MultipartUpload: {
          Parts: [...this.parts].sort((a, b) => a.PartNumber - b.PartNumber),
        },
      }),
    );
    return this.uploadedBytes;
  }

  /** Best-effort cleanup so failed uploads don't leave orphaned parts in R2. */
  async abort(): Promise<void> {
    if (!this.uploadId || this.completed) return;
    try {
      await this.s3.send(
        new AbortMultipartUploadCommand({
          Bucket: this.bucket,
          Key: this.key,
          UploadId: this.uploadId,
        }),
      );
    } catch (err) {
      console.error(
        "Failed to abort multipart upload:",
        (err as Error).message,
      );
    }
  }
}

function endGzip(gzip: ReturnType<typeof createGzip>): Promise<void> {
  return new Promise((resolve, reject) => {
    gzip.end((err: Error | null) => (err ? reject(err) : resolve()));
  });
}

/* ------------------------------------------------------------------ */
/*  Insert helper using postgres.js unsafe()                           */
/* ------------------------------------------------------------------ */

async function insertRows(
  tableName: string,
  rows: Record<string, unknown>[],
): Promise<number> {
  if (rows.length === 0) return 0;

  const sql = await getDb();
  let inserted = 0;

  for (const row of rows) {
    try {
      const columns = Object.keys(row);
      const colNames = columns
        .map((c) => `"${c.replace(/"/g, '""')}"`)
        .join(", ");
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
      const values: unknown[] = columns.map((c) => row[c]);
      const updateSet = columns
        .map(
          (c) =>
            `"${c.replace(/"/g, '""')}" = EXCLUDED."${c.replace(/"/g, '""')}"`,
        )
        .join(", ");

      await (sql.unsafe as any)(
        `INSERT INTO "${tableName.replace(/"/g, '""')}" (${colNames}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updateSet}`,
        values,
      );
      inserted++;
    } catch (err) {
      console.warn(
        `Could not insert row into ${tableName}:`,
        (err as Error).message,
      );
    }
  }

  return inserted;
}

/* ------------------------------------------------------------------ */
/*  Core Backup Functions                                              */
/* ------------------------------------------------------------------ */

/**
 * Creates a full backup and uploads it to R2 as gzip-compressed JSON.
 *
 * The previous implementation loaded every row of every table into memory,
 * then built the entire JSON document as a single string before compressing
 * and uploading — which pushed the daily cron invocation past its duration
 * and memory limits as the database grew. It now:
 *   1. starts a multipart upload up front,
 *   2. streams each table in row batches via postgres.js cursors,
 *   3. feeds row JSON through a gzip stream into 8 MB parts.
 *
 * The output format is byte-for-byte compatible with the old backups
 * ({ version, createdAt, tables }), so restore still works unchanged.
 */
export async function createBackup(): Promise<BackupResult> {
  const s3 = getS3Client();
  if (!s3 || !R2_BUCKET_NAME) {
    return { success: false, message: "R2 storage not configured." };
  }

  const createdAt = new Date().toISOString();
  const filename = `backup-${getTimestamp()}.json.gz`;
  const key = `${BACKUP_PREFIX}${filename}`;
  const uploader = new MultipartGzipUploader(s3, R2_BUCKET_NAME, key, {
    "created-at": createdAt,
  });

  try {
    const sql = await getDb();
    await uploader.start();

    const gzip = createGzip();
    let gzipError: Error | null = null;
    gzip.on("error", (err) => {
      gzipError = err;
    });
    gzip.on("data", (chunk: Buffer) => uploader.write(chunk));

    // Document header — restore parses this shape identically to old backups.
    gzip.write(
      `{"version":1,"createdAt":"${createdAt}","tables":{`,
      "utf-8",
    );

    const emittedTables: string[] = [];
    let totalRows = 0;
    let needsComma = false;

    for (const tableName of ALL_TABLES) {
      assertSafeTableName(tableName);

      let wroteTable = false;
      let wroteRow = false;
      try {
        await sql
          .unsafe(`SELECT * FROM "${tableName.replace(/"/g, '""')}"`)
          .cursor(ROW_BATCH_SIZE, async (rows: Record<string, unknown>[]) => {
            if (!wroteTable) {
              gzip.write(
                `${needsComma ? "," : ""}"${tableName}":`,
                "utf-8",
              );
              needsComma = true;
              wroteTable = true;
              emittedTables.push(tableName);
            }
            const batchJson = rows
              .map((row) => JSON.stringify(row))
              .join(",");
            gzip.write(`${wroteRow ? "," : ""}${batchJson}`, "utf-8");
            wroteRow = true;
            totalRows += rows.length;
            // Hand compressed bytes to storage between batches to bound memory.
            await uploader.drain();
          });

        if (!wroteTable) {
          // Empty table: still emit an empty array so the schema of the
          // backup matches the old format.
          gzip.write(`${needsComma ? "," : ""}"${tableName}":[]`, "utf-8");
          needsComma = true;
          emittedTables.push(tableName);
        } else {
          gzip.write("]", "utf-8");
        }
      } catch (err) {
        if (wroteTable) {
          // Partial table data already streamed — a silent partial backup is
          // worse than a failed one, so abort loudly.
          throw err;
        }
        console.warn(`Skipping table ${tableName}:`, (err as Error).message);
      }
    }

    gzip.write("}}", "utf-8");
    await endGzip(gzip);
    if (gzipError) throw gzipError;

    const sizeBytes = await uploader.complete();
    await deleteOldBackups(s3);

    const meta: BackupMeta = {
      key,
      filename,
      sizeBytes,
      createdAt,
      tables: emittedTables,
      rowCount: totalRows,
    };

    return {
      success: true,
      message: `Backup created: ${filename} (${formatBytes(sizeBytes)}, ${totalRows} rows across ${emittedTables.length} tables)`,
      key,
      meta,
    };
  } catch (err) {
    await uploader.abort();
    const msg = (err as Error).message || "Unknown error";
    console.error("Backup failed:", err);
    return { success: false, message: `Backup failed: ${msg}` };
  }
}

/**
 * Lists backups in R2, newest first.
 *
 * Storage failures are rethrown, not swallowed: an unreadable bucket must
 * surface as "Failed to load backups" in the console, never as a fake empty
 * list (which previously masked credential/bucket misconfiguration as
 * "No backups yet").
 */
export async function listBackups(): Promise<BackupMeta[]> {
  const s3 = getS3Client();
  if (!s3 || !R2_BUCKET_NAME) {
    throw new Error(
      "R2 storage is not configured (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME).",
    );
  }

  try {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: BACKUP_PREFIX,
      }),
    );

    const backups: BackupMeta[] = [];

    for (const obj of response.Contents || []) {
      if (!obj.Key || !obj.Key.endsWith(".json.gz")) continue;

      const filename = obj.Key.replace(BACKUP_PREFIX, "");
      const sizeBytes = obj.Size || 0;

      const dateMatch = filename.match(/backup-(.+)\.json\.gz/);
      let createdAt = obj.LastModified?.toISOString() || "";
      if (dateMatch) {
        createdAt = dateMatch[1].replace(
          /^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})$/,
          "$1T$2:$3:$4",
        );
      }

      backups.push({
        key: obj.Key,
        filename,
        sizeBytes,
        createdAt,
        tables: [],
        rowCount: 0,
      });
    }

    backups.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return backups;
  } catch (err) {
    console.error("Failed to list backups:", err);
    throw err instanceof Error
      ? err
      : new Error("Failed to list backups in storage.");
  }
}

async function downloadBackup(key: string): Promise<BackupData | null> {
  const s3 = getS3Client();
  if (!s3 || !R2_BUCKET_NAME) return null;

  try {
    const response = await s3.send(
      new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }),
    );
    const body = await response.Body?.transformToByteArray();
    if (!body) return null;

    const decompressed = await decompressBuffer(Buffer.from(body));
    return JSON.parse(decompressed.toString("utf-8")) as BackupData;
  } catch (err) {
    console.error(`Failed to download backup ${key}:`, err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Restore Functions                                                  */
/* ------------------------------------------------------------------ */

export async function restoreFull(key: string): Promise<BackupResult> {
  const safetyBackup = await createBackup();
  if (!safetyBackup.success) {
    return {
      success: false,
      message: "Failed to create safety backup before restore. Aborting.",
    };
  }

  const backup = await downloadBackup(key);
  if (!backup) {
    return {
      success: false,
      message: "Failed to download or parse backup file.",
    };
  }

  try {
    const sql = await getDb();

    const reversed = [...INSERT_ORDER].reverse();
    for (const tableName of reversed) {
      if (!backup.tables[tableName]) continue;
      try {
        assertSafeTableName(tableName);
        await sql.unsafe(`DELETE FROM "${tableName.replace(/"/g, '""')}"`);
      } catch (err) {
        console.warn(
          `Could not clear table ${tableName}:`,
          (err as Error).message,
        );
      }
    }

    let insertedRows = 0;
    for (const tableName of INSERT_ORDER) {
      const rows = backup.tables[tableName];
      if (!rows || rows.length === 0) continue;
      insertedRows += await insertRows(tableName, rows);
    }

    return {
      success: true,
      message: `Full restore complete: ${insertedRows} rows restored across ${Object.keys(backup.tables).length} tables.`,
    };
  } catch (err) {
    const msg = (err as Error).message || "Unknown error";
    return { success: false, message: `Restore failed: ${msg}` };
  }
}

export async function restoreOrganization(
  key: string,
  orgId: string,
): Promise<BackupResult> {
  const safetyBackup = await createBackup();
  if (!safetyBackup.success) {
    return {
      success: false,
      message: "Failed to create safety backup before restore. Aborting.",
    };
  }

  const backup = await downloadBackup(key);
  if (!backup) {
    return {
      success: false,
      message: "Failed to download or parse backup file.",
    };
  }

  try {
    const sql = await getDb();

    // Phase 1: Delete existing data for this organization in reverse dependency order
    const reversed = [...INSERT_ORDER].reverse();
    for (const tableName of reversed) {
      if (!ORG_SCOPED_TABLES.has(tableName)) continue;
      assertSafeTableName(tableName);

      try {
        if (tableName === "organization") {
          await sql.unsafe(`DELETE FROM "organization" WHERE id = $1`, [orgId]);
        } else if (tableName === "purchase_order_delivery_item") {
          await sql.unsafe(
            `
             DELETE FROM "purchase_order_delivery_item" 
             WHERE delivery_note_id IN (
               SELECT id FROM "purchase_order_delivery_note" WHERE purchase_order_id IN (
                 SELECT id FROM "purchase_order" WHERE organization_id = $1
               )
             )
           `,
            [orgId],
          );
        } else if (
          tableName === "purchase_order_line_item" ||
          tableName === "purchase_order_delivery_note"
        ) {
          await sql.unsafe(
            `
             DELETE FROM "${tableName.replace(/"/g, '""')}" 
             WHERE purchase_order_id IN (
               SELECT id FROM "purchase_order" WHERE organization_id = $1
             )
           `,
            [orgId],
          );
        } else {
          await sql.unsafe(
            `DELETE FROM "${tableName.replace(/"/g, '""')}" WHERE organization_id = $1`,
            [orgId],
          );
        }
      } catch (err) {
        console.warn(
          `Could not clear table ${tableName} for org ${orgId}:`,
          (err as Error).message,
        );
      }
    }

    // Phase 2: Re-insert data from backup
    let insertedRows = 0;
    let skippedTables = 0;

    for (const tableName of INSERT_ORDER) {
      if (!ORG_SCOPED_TABLES.has(tableName)) continue;

      const rows = backup.tables[tableName];
      if (!rows || rows.length === 0) continue;

      let orgRows: Record<string, unknown>[] = [];

      if (tableName === "organization") {
        orgRows = rows.filter((row) => row.id === orgId);
      } else if (
        tableName === "purchase_order_line_item" ||
        tableName === "purchase_order_delivery_note"
      ) {
        const poTable = backup.tables["purchase_order"] || [];
        const orgPoIds = new Set(
          poTable
            .filter((po) => po.organization_id === orgId)
            .map((po) => po.id),
        );
        orgRows = rows.filter((row) =>
          orgPoIds.has(row.purchase_order_id as string),
        );
      } else if (tableName === "purchase_order_delivery_item") {
        const poTable = backup.tables["purchase_order"] || [];
        const orgPoIds = new Set(
          poTable
            .filter((po) => po.organization_id === orgId)
            .map((po) => po.id),
        );

        const dnTable = backup.tables["purchase_order_delivery_note"] || [];
        const orgDnIds = new Set(
          dnTable
            .filter((dn) => orgPoIds.has(dn.purchase_order_id as string))
            .map((dn) => dn.id),
        );

        orgRows = rows.filter((row) =>
          orgDnIds.has(row.delivery_note_id as string),
        );
      } else {
        orgRows = rows.filter((row) => row.organization_id === orgId);
      }

      if (orgRows.length === 0) {
        skippedTables++;
        continue;
      }
      insertedRows += await insertRows(tableName, orgRows);
    }

    return {
      success: true,
      message: `Org restore complete: ${insertedRows} rows restored (${skippedTables} tables had no matching data).`,
    };
  } catch (err) {
    const msg = (err as Error).message || "Unknown error";
    return { success: false, message: `Org restore failed: ${msg}` };
  }
}

async function deleteOldBackups(s3: S3Client): Promise<void> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME!,
        Prefix: BACKUP_PREFIX,
      }),
    );

    for (const obj of response.Contents || []) {
      if (!obj.Key || !obj.Key.endsWith(".json.gz")) continue;
      if (!obj.LastModified || obj.LastModified >= cutoff) continue;

      await s3.send(
        new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME!, Key: obj.Key }),
      );
      console.log(`Deleted old backup: ${obj.Key}`);
    }
  } catch (err) {
    console.error("Failed to clean up old backups:", err);
  }
}

export async function getOrganizationsForRestore(): Promise<
  Array<{ id: string; name: string; slug: string | null }>
> {
  try {
    const sql = await getDb();
    const rows = await sql.unsafe(
      "SELECT id, name, slug FROM organization ORDER BY name ASC",
    );
    return rows as unknown as Array<{
      id: string;
      name: string;
      slug: string | null;
    }>;
  } catch {
    return [];
  }
}

export async function runAutomatedBackup(): Promise<BackupResult> {
  return createBackup();
}
