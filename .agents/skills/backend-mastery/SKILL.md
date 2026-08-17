---
name: backend-mastery
description: Comprehensive backend, API, database, and Next.js server architecture skill. Use when building or refactoring Next.js Server Actions, REST API route handlers, Drizzle database queries, Better Auth session/RBAC validation, S3 storage operations, and background jobs. Combines drizzle-orm-best-practices, better-auth-best-practices, s3-storage-best-practices, and resend.
---

# Backend & Server Architecture Mastery

This is the unified backend super-skill for full-stack Next.js and PostgreSQL systems. When building, modifying, or auditing server-side logic, you must adhere to the principles below.

---

## 1. Required Sub-Skills Reference
Before generating or modifying backend code, consult the specialized knowledge in these local skills:
* **Database & Migrations**: `.agents/skills/drizzle-orm-best-practices/SKILL.md` & `.agents/skills/postgres-best-practices/SKILL.md`
* **Authentication & RBAC**: `.agents/skills/better-auth-best-practices/SKILL.md` & `.agents/skills/organization-best-practices/SKILL.md`
* **File Storage & S3 Quotas**: `.agents/skills/s3-storage-best-practices/SKILL.md`
* **Transactional Emails**: `.agents/skills/resend/SKILL.md` & `.agents/skills/react-email/SKILL.md`

---

## 2. Next.js Server Actions Protocol

### A. Input Validation & Type Safety
* **Zod Schemas**: Every Server Action must validate inputs using a strict Zod schema before processing.
* **Standardized Return Types**: Actions must return discriminated union results:
  ```typescript
  type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string; code?: string; fieldErrors?: Record<string, string[]> };
  ```
* **Error Masking**: Never expose raw database errors, internal stack traces, or SQL messages to the client. Return clean, user-friendly error messages while logging details on the server.

### B. Authentication & Tenant Isolation (Multi-Tenancy)
* **Session Verification**: Always authenticate the caller at the top of the Server Action using `getServerSession()` or `validateSessionAndOrg()`.
* **Tenant Isolation**: Every database query must explicitly filter by the user's active `organizationId` or `tenantId`:
  ```typescript
  // ❌ Insecure:
  await db.query.tenders.findFirst({ where: eq(tenders.id, tenderId) });

  // ✅ Secure:
  await db.query.tenders.findFirst({
    where: and(eq(tenders.id, tenderId), eq(tenders.organizationId, orgId))
  });
  ```
* **RBAC Enforcement**: Check user role/permissions before executing mutations (e.g. creating/deleting records, updating settings, or inviting users).

### C. Cache Revalidation
* Call `revalidatePath("/path")` or `revalidateTag("tag")` after state-mutating actions so server components reflect fresh data immediately.

---

## 3. Database & Persistence (Drizzle ORM)

1. **Atomic Transactions**: Wrap multi-step mutations in `await db.transaction(async (tx) => { ... })` to prevent partial writes.
2. **Relational Queries**: Prefer `db.query.<table_name>.findMany()` with `with: { ... }` for eager loading related entities without manual joins.
3. **Select Projections**: Only select required columns for heavy queries using `columns: { ... }`.
4. **Indexes**: Ensure foreign keys (`organizationId`, `userId`, `tenderId`) and query filters (`status`, `createdAt`) are properly indexed.

---

## 4. API Route Handlers (`app/api/**/route.ts`)

* **HTTP Methods**: Export explicit standard functions: `export async function GET()`, `POST()`, `PATCH()`, `DELETE()`.
* **Status Codes**: Return appropriate HTTP status codes:
  - `200 OK` / `201 Created`
  - `400 Bad Request` (Zod validation failures)
  - `401 Unauthorized` (Missing/invalid session)
  - `403 Forbidden` (Insufficient tenant/role permissions)
  - `404 Not Found` (Resource does not exist or does not belong to tenant)
  - `429 Too Many Requests` (Rate limited)
  - `500 Internal Server Error` (Unhandled server exceptions)

---

## 5. Security & Bot Protection

1. **Bot Mitigation**: For public-facing actions (contact forms, feedback, inquiry submissions), use honeypot fields, timestamp speed checks, and Cloudflare/Turnstile verification.
2. **Rate Limiting**: Apply IP and user-based rate limiting on sensitive mutation endpoints (auth, emails, document uploads).
3. **Storage Security**: Never store raw uploaded files in web server memory; issue short-lived presigned S3 URLs directly to the client.
