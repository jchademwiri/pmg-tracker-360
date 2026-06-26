# PDF Report Generator Security and Permissions Plan

Status: Draft  
Owner: PMG Tracker 360  
Created: 2026-06-25

## 1. Purpose

This document defines the security and permissions rules for PDF report generation in PMG Tracker 360.

Reports may expose sensitive tender, project, purchase order, delivery, client, supplier, organization, user, session, and platform administration data. PDF routes must therefore be treated as protected data export endpoints, not simple download links.

## 2. Security Principles

- Every report download must require authentication.
- Tracker reports must be scoped to the user's active organization or explicitly authorized organization.
- Admin reports must be restricted to admin users only.
- PDF generation must not bypass existing server-side permissions.
- Report routes must not leak data through error messages.
- Sensitive report responses should not be cached.
- The PDF renderer must not fetch unrestricted database data directly.

## 3. Data Sensitivity

### Tracker Sensitive Data

Tracker reports may include:

- Tender numbers and descriptions.
- Tender values and award values.
- Client names and contact details.
- Project numbers and descriptions.
- Contract values and dates.
- Purchase order numbers.
- Supplier names.
- PO totals and delivery quantities.
- Delivery notes and POD references.
- Project risks.
- Project activities.
- Internal notes.
- Uploaded document references.

### Admin Sensitive Data

Admin reports may include:

- User names and emails.
- Organization names and usage counts.
- Session information.
- Suspicious session flags.
- Support tickets.
- Feedback records.
- Waitlist records.
- Platform activity and audit logs.

## 4. Permission Boundary

The generic PDF renderer must not decide permissions.

Correct boundary:

```txt
API route / server action
        ↓
Auth + permission checks
        ↓
Data builder fetches scoped data
        ↓
PDF renderer receives safe report data
```

Incorrect boundary:

```txt
PDF renderer fetches database data directly
```

The renderer should receive already-authorized report data.

## 5. Tracker Authorization Requirements

Every tracker PDF report route must validate:

1. User session exists.
2. `organizationId` is present or resolved from active organization.
3. User is a member of the organization.
4. User has the required feature permission where applicable.
5. The requested record belongs to the same organization.

### 5.1 Organization Check

All tracker reports must be scoped by `organizationId`.

Examples:

```txt
Tender Register Report -> tender.orgId = organizationId
Project Status Report -> project.orgId = organizationId
Purchase Order Detail Report -> purchaseOrder.orgId = organizationId
Client Report -> client.orgId = organizationId
```

### 5.2 Record Ownership Check

Single-record reports must validate the record belongs to the organization before rendering.

Examples:

- A user from Org A must not download a PO from Org B.
- A user from Org A must not download a project status report for Org B.
- A user from Org A must not infer that Org B records exist through error differences.

Recommended approach:

- For missing or cross-org records, consider returning `404` to avoid revealing record existence.
- For known unauthorized organization access, return `403`.

## 6. Tracker Report Permission Matrix

| Report | Required Access |
|---|---|
| Tender Register | Organization membership + tender read access |
| Tender Pipeline | Organization membership + tender read access |
| Closing Soon Tenders | Organization membership + tender read access |
| Tender Briefing Schedule | Organization membership + tender read access |
| Tender Win/Loss | Organization membership + tender read access |
| Project Status | Organization membership + project read access |
| Active Projects | Organization membership + project read access |
| Project Risk Register | Organization membership + project read access |
| Project Activity | Organization membership + project read access |
| Purchase Order Register | Organization membership + purchase order read access |
| Purchase Order Detail | Organization membership + purchase order read access |
| Delivery Status | Organization membership + purchase order/project read access |
| Client Directory | Organization membership + client read access |
| Document Register | Organization membership + document read access |

If fine-grained permissions are not fully implemented for some modules yet, the minimum requirement is organization membership plus the same access rules used by the relevant page/server function.

## 7. Admin Authorization Requirements

Every admin PDF report route must validate:

1. User session exists.
2. User has admin role/access.
3. Report type is supported.
4. Requested filters are valid.

### Admin Report Permission Matrix

| Report | Required Access |
|---|---|
| Platform Overview | Admin only |
| Organization Usage | Admin only |
| User Register | Admin only |
| Support Tickets | Admin only |
| Feedback | Admin only |
| Active Sessions | Admin only |
| Suspicious Sessions | Admin only |
| Security Audit Log | Admin only |
| Waitlist | Admin only |
| Pending Invitations | Admin only |
| Ownership Transfer | Admin only |

## 8. Route Security Rules

PDF routes must:

- Reject unauthenticated users with `401`.
- Reject authenticated but unauthorized users with `403`.
- Reject unsupported report types with `400`.
- Reject invalid filters with `400`.
- Return `404` for missing records.
- Return `Cache-Control: no-store`.
- Avoid detailed stack traces in client responses.
- Log server errors internally.

Recommended response headers:

```txt
Content-Type: application/pdf
Content-Disposition: attachment; filename="Report-Name.pdf"
Cache-Control: no-store
```

## 9. Input Validation

All report routes must validate query parameters.

| Parameter | Validation |
|---|---|
| `organizationId` | Required for tracker unless active org is resolved; must be valid ID format |
| `projectId` | Required for project detail reports; must be valid ID format |
| `purchaseOrderId` | Required for PO detail reports; must be valid ID format |
| `clientId` | Optional; must be valid ID format if provided |
| `status` | Must be one of known allowed statuses |
| `dateFrom` | Must be valid date if provided |
| `dateTo` | Must be valid date if provided |
| `search` | Trim and limit length |

Recommended search length limit:

```txt
100 characters
```

## 10. Output Safety

PDF output should:

- Avoid injecting raw HTML into PDFs.
- Avoid exposing signed URLs directly unless required.
- Display document availability instead of raw private storage URLs where possible.
- Truncate extremely long values where necessary.
- Use safe fallbacks for missing optional values.

## 11. Caching Policy

PDF report responses should use:

```txt
Cache-Control: no-store
```

Rationale:

- Reports may include sensitive data.
- Reports reflect current operational state.
- Browser/proxy caching can expose old or unauthorized content.

## 12. Audit Logging

MVP may skip audit logging, but a future phase should record report downloads.

Suggested audit fields:

| Field | Description |
|---|---|
| User ID | Who downloaded the report |
| Organization ID | Tenant context, if applicable |
| Report type | Which report was downloaded |
| Filters | Selected filters, sanitized |
| Record ID | Project/PO/client/tender ID where applicable |
| Timestamp | When report was generated |
| IP/device | Optional security context |

## 13. Email Attachment Security

If email delivery is added later:

- Validate recipient email.
- Validate PDF size before sending.
- Confirm user has permission to email the report.
- Log delivery attempt.
- Do not allow arbitrary file attachments from user input.
- Use generated report buffers only.

Recommended size limit:

```txt
8 MB
```

## 14. Cross-Organization Data Leak Scenarios

Test specifically against:

```txt
[ ] User modifies organizationId in URL
[ ] User modifies projectId to another organization's project
[ ] User modifies purchaseOrderId to another organization's PO
[ ] User downloads report after being removed from organization
[ ] User without PO permission tries PO report
[ ] Admin-only route accessed by normal user
```

## 15. Safe Error Messages

| Internal Issue | Client Message |
|---|---|
| DB connection error | `Failed to generate report.` |
| Record belongs to another org | `Report not found.` or `Forbidden.` depending on route design |
| Unsupported type | `Unsupported report type.` |
| Invalid filter | `Invalid report filter.` |
| Missing session | `Unauthorized.` |

## 16. Definition of Secure Enough for MVP

The PDF report feature is secure enough for MVP when:

- All routes require authentication.
- Tracker routes validate organization membership.
- Single-record reports validate record organization ownership.
- Admin routes validate admin access.
- Sensitive responses use `Cache-Control: no-store`.
- Invalid input is rejected.
- No raw stack traces are returned to the client.
- Cross-organization manual tests pass.
