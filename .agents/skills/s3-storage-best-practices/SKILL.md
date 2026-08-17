---
name: s3-storage-best-practices
description: Best practices for S3 and Cloudflare R2 object storage, presigned URLs, streaming downloads, quota management, and secure file uploads. Use when handling file attachments, tender documents, document storage, or S3 API integrations.
---

# S3 & Cloudflare R2 Storage Best Practices

Follow these guidelines when implementing file storage, uploads, presigned URLs, and quota management.

---

## 1. Upload Architecture & Presigned URLs
* **Direct Client Uploads**: Use presigned `PutObjectCommand` URLs for direct browser-to-bucket uploads to avoid buffering large files in Next.js Server Actions or API routes.
* **Content-Type & Checksum Validation**: Always lock down expected `ContentType` and size constraints during presigned URL generation.
* **Expiration**: Keep presigned upload and download URLs short-lived (5 to 15 minutes max).

## 2. Multi-Tenant Storage Quotas
* **Tenant Partitioning**: Always prefix S3 object keys with the tenant/organization ID: `${orgId}/tenders/${tenderId}/${fileId}-${fileName}`.
* **Pre-Upload Quota Verification**: Verify available organization storage quota in PostgreSQL *before* issuing presigned upload URLs.
* **Atomic Tracking**: Update used storage bytes in the database immediately upon upload completion or deletion.

## 3. Secure Downloads
* **Private Buckets**: Buckets must never have public read access enabled.
* **Access Control**: Always verify user organization membership and document permissions before generating a `GetObjectCommand` presigned URL.
