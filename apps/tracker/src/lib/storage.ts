import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

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

function getStorageConfig() {
  const accountId = cleanEnv(process.env.R2_ACCOUNT_ID);
  const accessKeyId = cleanEnv(process.env.R2_ACCESS_KEY_ID);
  const secretAccessKey = cleanEnv(process.env.R2_SECRET_ACCESS_KEY);
  const bucketName = cleanEnv(process.env.R2_BUCKET_NAME);
  const s3Api = cleanEnv(process.env.S3_API);

  const client =
    accessKeyId && secretAccessKey && (accountId || s3Api)
      ? new S3Client({
          region: "auto",
          endpoint: s3Api || `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        })
      : null;

  return {
    client,
    bucketName,
    accountId,
    accessKeyId,
    s3Api,
  };
}

export class StorageService {
  /**
   * Uploads a file to R2 storage
   * @param fileBuffer The file content as Buffer
   * @param key The path/key where the file will be stored
   * @param contentType The MIME type of the file
   * @returns The public URL or key of the uploaded file
   */
  static async uploadFile(
    fileBuffer: Buffer | Uint8Array,
    key: string,
    contentType: string,
  ): Promise<string> {
    const { client, bucketName, accessKeyId, accountId } = getStorageConfig();

    if (!client || !bucketName) {
      const missing = [
        !process.env.R2_ACCOUNT_ID && "R2_ACCOUNT_ID",
        !process.env.R2_ACCESS_KEY_ID && "R2_ACCESS_KEY_ID",
        !process.env.R2_SECRET_ACCESS_KEY && "R2_SECRET_ACCESS_KEY",
        !process.env.R2_BUCKET_NAME && "R2_BUCKET_NAME",
      ]
        .filter(Boolean)
        .join(", ");
      console.warn(
        `Storage not configured: Missing [${missing || "credentials"}]`,
      );
      throw new Error(
        `Storage configuration missing (${missing || "Check R2 environment variables"})`,
      );
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    try {
      await client.send(command);
      // Construct public URL if bucket is public, or R2 dev URL
      // For now, returning the Key which can be used to generate signed URLs or constructed if public
      // If using a custom domain: https://files.tendertracker.com/${key}
      // For now we'll assume we need to generate signed URLs for access or it is public.
      // Let's return the key so we can store it.
      return key;
    } catch (error) {
      // Surface the real AWS error (status code + code + message) so callers
      // can tell 403 (token permissions) from 404 (wrong bucket) from a
      // network failure instead of guessing from a generic message.
      const e = error as {
        name?: string;
        message?: string;
        $metadata?: { httpStatusCode?: number };
      };
      const detail = [
        e?.$metadata?.httpStatusCode
          ? `status ${e.$metadata.httpStatusCode}`
          : null,
        e?.name,
        e?.message,
      ]
        .filter(Boolean)
        .join(" - ");
      console.error("Error uploading file to storage:", detail || error);
      throw new Error(`Failed to upload file${detail ? ` (${detail})` : ""}`);
    }
  }

  /**
   * True when `url` is a transient signed URL pointing at our own storage
   * endpoint (R2 or the custom S3 endpoint). Signed URLs expire (1h) and
   * must never be persisted — they are display-only representations of a
   * storage key.
   */
  static isOwnSignedUrl(url: string): boolean {
    if (!/^https?:\/\//i.test(url)) return false;
    try {
      const { s3Api, accountId } = getStorageConfig();
      const host = new URL(url).hostname;
      const endpoint =
        s3Api ||
        (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : null);
      if (!endpoint) return false;
      const allowedHost = new URL(endpoint).hostname;
      return host === allowedHost || host.endsWith(`.${allowedHost}`);
    } catch {
      return false;
    }
  }

  /**
   * Deletes a file from R2 storage
   * @param key The path/key of the file to delete
   */
  static async deleteFile(key: string): Promise<void> {
    const { client, bucketName } = getStorageConfig();
    if (!client || !bucketName) {
      console.warn("Storage not configured: R2 credentials missing");
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    try {
      await client.send(command);
    } catch (error) {
      console.error("Error deleting file from storage:", error);
      // We don't throw here to avoid blocking DB cleanup if storage fails (soft delete logic usually)
    }
  }

  /**
   * Generates a signed URL for reading a file (valid for 1 hour)
   * @param key The path/key of the file
   */
  static async getSignedUrl(key: string): Promise<string> {
    const { client, bucketName } = getStorageConfig();
    if (!client || !bucketName) {
      return "#storage-not-configured";
    }

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    try {
      return await getSignedUrl(client as any, command as any, {
        expiresIn: 3600,
      });
    } catch (error) {
      console.error("Error generating signed URL:", error);
      return "#error-generating-url";
    }
  }
}
