import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Ensure environment variables are checked (or updated in env.ts)
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

// Initialize S3 Client for Cloudflare R2
// https://developers.cloudflare.com/r2/examples/aws-sdk-js-v3/
const s3Client =
  R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
    ? new S3Client({
        region: 'auto',
        endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: R2_ACCESS_KEY_ID,
          secretAccessKey: R2_SECRET_ACCESS_KEY,
        },
      })
    : null;

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
    contentType: string
  ): Promise<string> {
    if (!s3Client || !R2_BUCKET_NAME) {
      console.warn('Storage not configured: R2 credentials missing');
      // For local dev without R2, we might just return a mock URL or throw
      // But for MVP if no creds, we should probably throw
      throw new Error('Storage configuration missing');
    }

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    try {
      await s3Client.send(command);
      // Construct public URL if bucket is public, or R2 dev URL
      // For now, returning the Key which can be used to generate signed URLs or constructed if public
      // If using a custom domain: https://files.tendertracker.com/${key}
      // For now we'll assume we need to generate signed URLs for access or it is public.
      // Let's return the key so we can store it.
      return key;
    } catch (error) {
      console.error('Error uploading file to storage:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Deletes a file from R2 storage
   * @param key The path/key of the file to delete
   */
  static async deleteFile(key: string): Promise<void> {
    if (!s3Client || !R2_BUCKET_NAME) {
      console.warn('Storage not configured: R2 credentials missing');
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    try {
      await s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file from storage:', error);
      // We don't throw here to avoid blocking DB cleanup if storage fails (soft delete logic usually)
    }
  }

  /**
   * Generates a signed URL for reading a file (valid for 1 hour)
   * @param key The path/key of the file
   */
  static async getSignedUrl(key: string): Promise<string> {
    if (!s3Client || !R2_BUCKET_NAME) {
      return '#storage-not-configured';
    }

    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    try {
      return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return '#error-generating-url';
    }
  }
}
