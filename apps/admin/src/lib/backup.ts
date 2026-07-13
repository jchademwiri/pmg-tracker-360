import 'server-only';

import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { createGzip, createGunzip } from 'node:zlib';
import postgres from 'postgres';

/* ------------------------------------------------------------------ */
/*  Database Connection                                                */
/* ------------------------------------------------------------------ */

// Create a dedicated postgres connection for backups with SSL enabled
let dbClient: ReturnType<typeof postgres> | null = null;

async function getDb() {
  if (dbClient) return dbClient;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is required');
  dbClient = postgres(url, {
    max: 1,
    ssl: 'require',
    connect_timeout: 15,
    max_lifetime: 60 * 30,
  });
  return dbClient;
}

/* ------------------------------------------------------------------ */
/*  R2 Config                                                          */
/* ------------------------------------------------------------------ */

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const S3_API = process.env.S3_API;
const BACKUP_PREFIX = 'database-backup/';
const RETENTION_DAYS = 30;

function getS3Client(): S3Client | null {
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !(R2_ACCOUNT_ID || S3_API)) {
    return null;
  }
  return new S3Client({
    region: 'auto',
    endpoint: S3_API || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
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

const ALL_TABLES = [
  'user', 'session', 'account', 'verification',
  'organization', 'member', 'invitation',
  'notification_preferences', 'notification',
  'ownership_transfer', 'security_audit_log', 'session_tracking',
  'client', 'tender', 'tender_extension', 'tender_follow_up', 'tender_activity',
  'project', 'project_line_item', 'project_activity', 'project_risk',
  'purchase_order', 'purchase_order_line_item',
  'purchase_order_delivery_note', 'purchase_order_delivery_item',
  'document', 'waitlist', 'feedback', 'support_tickets',
];

const INSERT_ORDER = [
  'user', 'organization', 'account', 'session', 'verification',
  'member', 'invitation', 'notification_preferences', 'notification',
  'ownership_transfer', 'security_audit_log', 'session_tracking',
  'client', 'tender', 'tender_extension', 'tender_follow_up', 'tender_activity',
  'project', 'project_line_item', 'project_activity', 'project_risk',
  'purchase_order', 'purchase_order_line_item',
  'purchase_order_delivery_note', 'purchase_order_delivery_item',
  'document', 'waitlist', 'feedback', 'support_tickets',
];

const ORG_SCOPED_TABLES = new Set([
  'organization', 'member', 'invitation', 'client', 'tender',
  'tender_extension', 'tender_follow_up', 'tender_activity',
  'project', 'project_line_item', 'project_activity', 'project_risk',
  'purchase_order', 'purchase_order_line_item', 'purchase_order_delivery_note',
  'purchase_order_delivery_item', 'notification', 'notification_preferences',
  'session_tracking', 'security_audit_log', 'ownership_transfer', 'document',
]);

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function compressBuffer(data: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const gzip = createGzip();
    const chunks: Buffer[] = [];
    gzip.on('data', (chunk: Buffer) => chunks.push(chunk));
    gzip.on('end', () => resolve(Buffer.concat(chunks)));
    gzip.on('error', reject);
    gzip.end(data);
  });
}

function decompressBuffer(data: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const gunzip = createGunzip();
    const chunks: Buffer[] = [];
    gunzip.on('data', (chunk: Buffer) => chunks.push(chunk));
    gunzip.on('end', () => resolve(Buffer.concat(chunks)));
    gunzip.on('error', reject);
    gunzip.end(data);
  });
}

/* ------------------------------------------------------------------ */
/*  Insert helper using postgres.js unsafe()                           */
/* ------------------------------------------------------------------ */

async function insertRows(
  tableName: string,
  rows: Record<string, unknown>[]
): Promise<number> {
  if (rows.length === 0) return 0;

  const sql = await getDb();
  let inserted = 0;

  for (const row of rows) {
    try {
      const columns = Object.keys(row);
      const colNames = columns.map(c => `"${c.replace(/"/g, '""')}"`).join(', ');
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const values: unknown[] = columns.map(c => row[c]);
      const updateSet = columns.map(c => `"${c.replace(/"/g, '""')}" = EXCLUDED."${c.replace(/"/g, '""')}"`).join(', ');

      await (sql.unsafe as any)(
        `INSERT INTO "${tableName.replace(/"/g, '""')}" (${colNames}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updateSet}`,
        values
      );
      inserted++;
    } catch (err) {
      console.warn(`Could not insert row into ${tableName}:`, (err as Error).message);
    }
  }

  return inserted;
}

/* ------------------------------------------------------------------ */
/*  Core Backup Functions                                              */
/* ------------------------------------------------------------------ */

export async function createBackup(): Promise<BackupResult> {
  try {
    const sql = await getDb();
    const tables: Record<string, Record<string, unknown>[]> = {};
    let totalRows = 0;

    for (const tableName of ALL_TABLES) {
      try {
        const rows = await sql.unsafe(`SELECT * FROM "${tableName.replace(/"/g, '""')}"`);
        tables[tableName] = rows as Record<string, unknown>[];
        totalRows += rows.length;
      } catch (err) {
        console.warn(`Skipping table ${tableName}:`, (err as Error).message);
      }
    }

    const backupData: BackupData = {
      version: 1,
      createdAt: new Date().toISOString(),
      tables,
    };

    const jsonStr = JSON.stringify(backupData);
    const filename = `backup-${getTimestamp()}.json.gz`;
    const key = `${BACKUP_PREFIX}${filename}`;

    const s3 = getS3Client();
    if (!s3 || !R2_BUCKET_NAME) {
      return { success: false, message: 'R2 storage not configured.' };
    }

    const compressed = await compressBuffer(Buffer.from(jsonStr, 'utf-8'));

    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: compressed,
      ContentType: 'application/gzip',
      Metadata: {
        'created-at': new Date().toISOString(),
        'row-count': String(totalRows),
        'table-count': String(Object.keys(tables).length),
      },
    }));

    await deleteOldBackups(s3);

    const meta: BackupMeta = {
      key, filename, sizeBytes: compressed.length,
      createdAt: backupData.createdAt,
      tables: Object.keys(tables), rowCount: totalRows,
    };

    return {
      success: true,
      message: `Backup created: ${filename} (${formatBytes(compressed.length)}, ${totalRows} rows across ${Object.keys(tables).length} tables)`,
      key, meta,
    };
  } catch (err) {
    const msg = (err as Error).message || 'Unknown error';
    console.error('Backup failed:', err);
    return { success: false, message: `Backup failed: ${msg}` };
  }
}

export async function listBackups(): Promise<BackupMeta[]> {
  const s3 = getS3Client();
  if (!s3 || !R2_BUCKET_NAME) return [];

  try {
    const response = await s3.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: BACKUP_PREFIX,
    }));

    const backups: BackupMeta[] = [];

    for (const obj of (response.Contents || [])) {
      if (!obj.Key || !obj.Key.endsWith('.json.gz')) continue;

      const filename = obj.Key.replace(BACKUP_PREFIX, '');
      const sizeBytes = obj.Size || 0;

      const dateMatch = filename.match(/backup-(.+)\.json\.gz/);
      let createdAt = obj.LastModified?.toISOString() || '';
      if (dateMatch) {
        createdAt = dateMatch[1]
          .replace(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2})-(\d{2})$/, '$1T$2:$3:$4');
      }

      backups.push({ key: obj.Key, filename, sizeBytes, createdAt, tables: [], rowCount: 0 });
    }

    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return backups;
  } catch (err) {
    console.error('Failed to list backups:', err);
    return [];
  }
}

async function downloadBackup(key: string): Promise<BackupData | null> {
  const s3 = getS3Client();
  if (!s3 || !R2_BUCKET_NAME) return null;

  try {
    const response = await s3.send(new GetObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    const body = await response.Body?.transformToByteArray();
    if (!body) return null;

    const decompressed = await decompressBuffer(Buffer.from(body));
    return JSON.parse(decompressed.toString('utf-8')) as BackupData;
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
    return { success: false, message: 'Failed to create safety backup before restore. Aborting.' };
  }

  const backup = await downloadBackup(key);
  if (!backup) {
    return { success: false, message: 'Failed to download or parse backup file.' };
  }

  try {
    const sql = await getDb();

    const reversed = [...INSERT_ORDER].reverse();
    for (const tableName of reversed) {
      if (!backup.tables[tableName]) continue;
      try {
        await sql.unsafe(`DELETE FROM "${tableName.replace(/"/g, '""')}"`);
      } catch (err) {
        console.warn(`Could not clear table ${tableName}:`, (err as Error).message);
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
    const msg = (err as Error).message || 'Unknown error';
    return { success: false, message: `Restore failed: ${msg}` };
  }
}

export async function restoreOrganization(key: string, orgId: string): Promise<BackupResult> {
  const safetyBackup = await createBackup();
  if (!safetyBackup.success) {
    return { success: false, message: 'Failed to create safety backup before restore. Aborting.' };
  }

  const backup = await downloadBackup(key);
  if (!backup) {
    return { success: false, message: 'Failed to download or parse backup file.' };
  }

  try {
    let insertedRows = 0;
    let skippedTables = 0;

    for (const tableName of INSERT_ORDER) {
      if (!ORG_SCOPED_TABLES.has(tableName)) continue;

      const rows = backup.tables[tableName];
      if (!rows || rows.length === 0) continue;

      const orgRows = rows.filter((row: Record<string, unknown>) => {
        if (tableName === 'organization') return row.id === orgId;
        return row.organization_id === orgId;
      });

      if (orgRows.length === 0) { skippedTables++; continue; }
      insertedRows += await insertRows(tableName, orgRows);
    }

    return {
      success: true,
      message: `Org restore complete: ${insertedRows} rows restored (${skippedTables} tables had no matching data).`,
    };
  } catch (err) {
    const msg = (err as Error).message || 'Unknown error';
    return { success: false, message: `Org restore failed: ${msg}` };
  }
}

async function deleteOldBackups(s3: S3Client): Promise<void> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    const response = await s3.send(new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME!, Prefix: BACKUP_PREFIX,
    }));

    for (const obj of (response.Contents || [])) {
      if (!obj.Key || !obj.Key.endsWith('.json.gz')) continue;
      if (!obj.LastModified || obj.LastModified >= cutoff) continue;

      await s3.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME!, Key: obj.Key }));
      console.log(`Deleted old backup: ${obj.Key}`);
    }
  } catch (err) {
    console.error('Failed to clean up old backups:', err);
  }
}

export async function getOrganizationsForRestore(): Promise<Array<{ id: string; name: string; slug: string | null }>> {
  try {
    const sql = await getDb();
    const rows = await sql.unsafe('SELECT id, name, slug FROM organization ORDER BY name ASC');
    return rows as unknown as Array<{ id: string; name: string; slug: string | null }>;
  } catch {
    return [];
  }
}

export async function runAutomatedBackup(): Promise<BackupResult> {
  return createBackup();
}
