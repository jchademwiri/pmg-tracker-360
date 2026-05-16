# Cloudflare R2 Storage Integration

This plan outlines the steps to integrate Cloudflare R2 for file storage, replacing the planned UploadThing implementation. R2 provides an S3-compatible API, so we will use the AWS SDK.

## User Review Required

> [!IMPORTANT]
> **Environment Variables**: You will need to obtain the following from your Cloudflare R2 dashboard:
>
> - `CF_R2_ACCOUNT_ID`: Your Cloudflare Account ID (found in R2 dashboard).
> - `CF_R2_ACCESS_KEY_ID`: Created in R2 API Tokens (ensure permissions: Object Read/Write).
> - `CF_R2_SECRET_ACCESS_KEY`: The secret for the token.
> - `CF_R2_BUCKET`: The name of your R2 bucket.
> - `CF_R2_PUBLIC_URL`: (Optional) Custom domain if public access is needed.
> - `DOWNLOAD_TTL_SECONDS`: (Optional) TTL for presigned URLs (default 60s).

## Architecture: Secure Downloads (Recommended)

To ensure files (like tender documents) are only accessible to authorized users, we will **not** make the bucket public. Instead, we will use a **Secure Download API** pattern:

1.  **Client** requests a download link for a file (via file ID/Key).
2.  **Server** (API Route) verifies user authentication and entitlement (e.g., membership in the organization).
3.  **Server** generates a short-lived **Presigned URL** (e.g., valid for 60 seconds).
4.  **Server** redirects the browser (HTTP 302) to this R2 URL.
5.  **User** downloads the file directly from Cloudflare's edge.

This ensures:

- **Security**: No permanent public URLs.
- **Performance**: Downloads served from Cloudflare's global network.
- **Control**: Access logic remains in your application.

## Proposed Changes

### Database Schema

#### [MODIFY] `src/db/schema.ts`

- **Tender**: Add `documents` (jsonb) to store array of `{ id, name, key, size, type, uploadedAt }`.
- **Project**: Add `appointmentLetters` (jsonb) to store array of appointment letter files.
- **Purchase Order**: Add `documents` (jsonb) to store PO-related files.
- **Organization**: `logo` field already exists.
- **User**: `image` field already exists.

```typescript
// Example JSONB structure for documents
type StoredFile = {
  id: string;
  name: string;
  key: string; // R2 object key
  size: number;
  type: string;
  uploadedAt: string;
};
```

### Dependencies

#### [NEW] `package.json`

- Install `@aws-sdk/client-s3` (Use `pnpm add`)
- Install `@aws-sdk/s3-request-presigner` (Use `pnpm add`)

### Infrastructure

### Infrastructure

#### [NEW] `src/lib/r2.ts`

- Initialize `S3Client`.
- **File Key Strategy**:
  - Organization Logo: `organizations/${orgId}/logo-${timestamp}.${ext}`
  - User Avatar: `users/${userId}/avatar-${timestamp}.${ext}`
  - Tender Docs: `organizations/${orgId}/tenders/${tenderId}/docs/${fileId}-${filename}`
  - Project Letters: `organizations/${orgId}/projects/${projectId}/appointment-letters/${fileId}-${filename}`
  - PO Docs: `organizations/${orgId}/purchase-orders/${poId}/${fileId}-${filename}`

### Server Actions & API Routes

#### [NEW] `src/server/storage.ts`

- `getPresignedUploadUrl(...)`:
  - Validates file type and size.
  - Enforces organization-level isolation in key generation.
- `deleteFile(...)`:
  - Verifies permissions before deletion.

#### [NEW] `src/app/api/downloads/[...fileKey]/route.ts`

- Handles secure downloads for all the above file types.
- Checks `organizationId` matching for the user.

### UI Components

#### [NEW] `src/components/ui/file-upload.tsx`

- Generic component accepting `onUploadComplete(fileInfo: StoredFile)`.
- Supports drag-and-drop, progress bar, and file validation.

#### Integration Points

- **Tender Details**: Add "Documents" card with file list and upload button.
- **Project Details**: Add "Appointment Letters" section.
- **Purchase Order**: Add "Attachments" section.
- **Organization Settings**: Avatar cropper/uploader for logo.
- **User Profile**: Avatar cropper/uploader for profile picture.

## Verification Plan

### Manual Verification

- Create a test page (or use an existing one) to render the `FileUpload` component.
- Upload a file and verify it appears in the R2 bucket dashboard.
- Verify the returned public URL is accessible.
