# PDF Generation Upgrade Specification

## 1. Normative Language and Development Process

The words **MUST**, **MUST NOT**, **SHOULD**, and **MAY** are normative requirements.

Every implementation change MUST follow this sequence:

1. Amend this specification when behavior or scope changes.
2. Add or update a failing characterization, contract, content, or visual test.
3. Implement only the behavior required to satisfy that test.
4. Run the affected package tests, application tests, type checks, and production build.
5. Review the generated PDF artifacts before enabling the new renderer for that document kind.

Golden visual snapshots MUST NOT be updated merely to make CI pass. A snapshot change requires an explicit review of every affected page and a short explanation in the change description.

## 2. Goals and Non-goals

### Goals

- Replace imperative jsPDF layout code with source-owned pdfcn React components rendered by Takumi.
- Centralize PDF primitives, themes, page furniture, tables, formatting contracts, and renderer tests.
- Preserve current user-facing routes, access control, organization isolation, filenames, and download behavior.
- Make page flow, repeated headers and footers, long tables, and future report development easier to maintain.
- Provide per-document rollout and immediate rollback during migration.
- Establish deterministic semantic, visual, performance, and security testing for PDFs.

### Non-goals

- Redesigning application pages or download buttons.
- Changing report queries, financial formulas, VAT calculation, tender status resolution, or business terminology.
- Changing Excel or CSV exports.
- Introducing client-side PDF generation.
- Adding fillable forms, signatures, archival PDF/A, or PDF/UA certification in this migration.
- Making generated PDFs pixel-identical to jsPDF. Information parity and approved visual quality are required; identical rendering is not.

## 3. Current-State Contract

The migration covers these document kinds:

| Document kind | Owning app | Existing generator | Public route |
| --- | --- | --- | --- |
| `purchase-order` | tracker | `src/lib/pdf/po-pdf.ts` | `/api/purchase-orders/[id]/pdf` |
| `tender-detail` | tracker | `src/lib/pdf/tender-pdf.ts` | `/api/tenders/[id]/pdf` |
| `tender-win-loss` | tracker | `src/lib/pdf/tender-winloss-pdf.ts` | `/api/reports/tenders/win-loss/pdf` |
| `tender-register` | tracker | `src/server/tender-register-pdf.ts` | `/api/reports/tenders/register/pdf` |
| `platform-executive` | admin | `src/lib/reports-pdf.ts` | `/api/reports/platform/pdf` |
| `storage-audit` | admin | `src/lib/reports-pdf.ts` | `/api/reports/storage/pdf` |
| `security-audit` | admin | `src/lib/reports-pdf.ts` | `/api/reports/security/pdf` |

Before migrating a document, Phase 0 MUST record its current filename, page orientation, required sections, empty-state behavior, representative page count, byte size, render time, and extracted text.

All route handlers MUST retain their current authentication, permission checks, organization scoping, not-found behavior, error status, `Content-Type: application/pdf`, attachment disposition, and `Cache-Control` behavior. Query parameters, including `clientId` for tender-register exports, MUST remain compatible.

## 4. Target Architecture

### 4.1 Package Boundary

A new private workspace package named `@pmg/pdf` MUST own:

- The Takumi adapter and initialization logic.
- Reviewed source copied from the pdfcn registry.
- Shared PDF component wrappers and primitive types.
- Tracker and admin PDF themes.
- Pure React document templates.
- Renderer-level fixtures and tests.

The package MUST NOT import `@pmg/db`, Better Auth, Next.js request APIs, application environment modules, storage services, or route handlers. It MUST accept fully resolved, serializable view models and return PDF bytes.

Application-owned generator modules MUST continue to:

- Load and authorize data.
- Enforce organization and soft-delete filters.
- Resolve and validate organization logos.
- Calculate existing business values without changing formulas.
- Map database results to `@pmg/pdf` view models.
- Choose the legacy or new renderer while migration flags exist.
- Construct filenames and route responses.

### 4.2 Renderer

The initial renderer MUST be Takumi using the supported Next.js/server entry point where required. The renderer adapter MUST be the only module that directly imports Takumi rendering APIs. Templates and application code MUST depend on the adapter interface rather than directly calling Takumi.

The adapter MUST return a `Uint8Array`, MUST NOT write to disk, and MUST produce deterministic output when provided identical input and a fixed `generatedAt` value.

Forme MAY be evaluated in a later architecture decision, but MUST NOT be introduced concurrently with this migration.

### 4.3 Core Interfaces

The shared package MUST expose equivalent interfaces to the following:

```ts
export type PdfDocumentKind =
  | "purchase-order"
  | "tender-detail"
  | "tender-win-loss"
  | "tender-register"
  | "platform-executive"
  | "storage-audit"
  | "security-audit";

export interface PdfRenderContext {
  generatedAt: Date;
  locale: "en-ZA";
  timeZone: "Africa/Johannesburg";
}

export interface PdfBranding {
  organizationName: string;
  logoDataUri?: string;
  phone?: string;
  address?: string;
  website?: string;
}

export interface PdfRenderResult {
  bytes: Uint8Array;
  pageCount?: number;
}

export interface PdfRenderer<TDocument> {
  render(document: TDocument, context: PdfRenderContext): Promise<PdfRenderResult>;
}
```

Each document kind MUST expose a named, strict view-model type. View models MUST contain display-ready values or domain values with explicitly shared formatters; they MUST NOT contain database row types, ORM objects, request/session objects, open streams, or remote URLs.

Existing application generators MAY continue returning `Buffer` during migration to avoid route churn, but conversion from `Uint8Array` MUST happen at the application boundary.

### 4.4 Component and Theme Rules

The package MUST initially install or derive only the pdfcn items required for migrated templates. At minimum the foundation is expected to use theme provider, text, heading, stack, section, key-value, table/data-table, image, page header, page footer, page number, divider, badge, and keep-together components.

Registry changes MUST be previewed with the shadcn CLI before files are added. Copied files MUST be reviewed for imports, dependency scope, server compatibility, and local conventions. Registry code becomes project-owned after installation and MUST be committed rather than fetched at runtime.

Two explicit themes MUST be defined:

- `trackerTheme`: the existing tracker navy/indigo visual identity and organization branding behavior.
- `adminTheme`: the existing admin navy/gold identity, with red reserved for security warnings.

PDF theme colors MUST be literal hex values. Application OKLCH CSS variables MUST NOT be passed to the renderer. Theme conversion MUST be recorded in tests so UI token changes do not silently alter PDF output.

Shared page furniture MUST support A4 portrait and landscape modes, organization identity, document title/subtitle, generated timestamp, optional confidentiality label, and `Page X of Y` numbering.

### 4.5 Asset and Security Rules

Templates MUST NOT fetch remote resources. Logos MUST be resolved before rendering using the existing application-side storage validation rules:

- HTTPS only.
- Configured storage host only.
- No followed redirects.
- Five-second timeout.
- Two-megabyte maximum.
- Missing, rejected, corrupt, or unsupported logos fall back to a text header.

User-controlled strings MUST be rendered as text and MUST NOT be interpreted as HTML or renderer markup. Document metadata MUST exclude secrets, internal object keys, session identifiers, and raw user-agent or IP data unless that field is explicitly part of the security report contract.

## 5. Document Requirements

### 5.1 Purchase Order Pilot

The purchase-order PDF MUST preserve organization branding, PO number, status, supplier, delivery address, PO date, expected delivery date, project reference, description, line-item order, units, quantities, unit prices, subtotals, VAT at the existing 15% calculation, and VAT-inclusive total.

The line-item header MUST repeat after a page break. A row MUST NOT overlap the footer or be split in a way that makes a value ambiguous. Long descriptions and addresses MUST wrap. Empty line items MUST render an explicit empty state. Currency and dates MUST retain current South African formatting.

### 5.2 Tender Detail

The tender-detail PDF MUST preserve organization branding, tender number, resolved status label, priority, client and contact details, submission/evaluation/validity dates, estimated and award values, briefing details, description, and loss reason/details when applicable.

Conditional sections MUST remain conditional. Long contact, briefing, description, and loss-detail text MUST wrap without overlap.

### 5.3 Tender Win/Loss

The win/loss PDF MUST preserve all current summary counts, ratios, values, and loss-reason rows. Zero-data reports MUST render a valid, understandable empty state and MUST NOT divide by zero or emit `NaN`/`Infinity`.

### 5.4 Tender Register and Client Report

Both tender-register variants MUST remain A4 landscape. The portfolio export MUST preserve its current columns and summary metrics. The client export MUST preserve client filtering, contact details, timing, dates, and empty/not-found behavior.

Table headers MUST repeat on every page. Rows MUST remain in query-defined order. Long cells MAY be capped at an explicitly tested number of lines only when the full value is otherwise represented in the document or the existing contract already truncates it.

### 5.5 Admin Reports

The platform executive, storage audit, and security audit reports MUST preserve their current section order, summary values, tables, chart data, severity labels, generated timestamp, and page-specific headings. Each logical tab/major section that currently begins on a new page MUST continue doing so.

Chart components MUST receive already calculated series. Charts MUST include readable labels or an adjacent data representation so information is not conveyed by color alone. Large tenant lists and security-event fixtures MUST paginate without missing or duplicated rows.

## 6. Rollout and Compatibility

### 6.1 Feature Selection

During migration both renderers MUST coexist. A server-only environment variable named `PDFCN_DOCUMENTS` MUST contain a comma-separated allowlist of `PdfDocumentKind` values.

- Missing or empty means all document kinds use jsPDF.
- A recognized value enables pdfcn only for that document kind.
- Unknown values MUST be reported once at startup or first use and ignored.
- `all` MAY be supported only after every document kind has passed its phase gate.

Renderer selection MUST occur after authorization and data loading but before rendering. An exception from the selected renderer MUST follow the existing route error path; the request MUST NOT silently fall back to jsPDF. Operational rollback is performed by changing the allowlist and redeploying.

### 6.2 Observability

Every render MUST emit structured telemetry containing document kind, selected renderer, success/failure, duration, byte size, and page count when available. It MUST NOT include document content, names, tender/PO numbers, organization IDs, or other tenant data.

Alerting SHOULD use existing application error monitoring. Rollout MUST stop for elevated PDF endpoint error rates, repeated WASM initialization failures, material latency regression, or confirmed corrupt/clipped output.

For this migration, a rollback trigger is any confirmed corrupt PDF, missing required content, authorization/isolation regression, three repeated WASM/render failures for the same document kind, an error rate above 1% over at least 20 requests in 30 minutes, or p95 render time above 150% of the Phase 0 baseline over at least 20 renders in 30 minutes. Low-volume document kinds MUST roll back after three repeated failures even when the percentage thresholds cannot be calculated.

### 6.3 Removal Conditions

jsPDF MUST remain installed until all document kinds have used pdfcn in production for seven consecutive calendar days and each document kind has completed at least ten successful renders from real or approved synthetic requests. Any rollback resets the seven-day window for the affected document kind. Removal includes the dependency, legacy renderer branches, migration flags, dead layout helpers, and obsolete tests. Contract and visual tests MUST remain.

## 7. Testing Specification

### 7.1 Deterministic Fixtures

Tests MUST use a fixed `generatedAt`, `en-ZA` locale, and `Africa/Johannesburg` time zone. Each document suite MUST include:

- Minimal/empty optional data.
- Typical production-like data.
- Long values and multi-page data.
- Unicode, punctuation, and South African currency/date values.
- Missing logo and valid logo.
- Corrupt/rejected logo behavior at the application boundary.

Tender-specific suites MUST include every meaningful status and lost-tender details. Purchase-order tests MUST cover zero, one, and many line items plus rounding-sensitive monetary values. Admin tests MUST cover zero totals and large tenant/security datasets.

### 7.2 Test Layers

1. **Unit tests:** mapping, formatting, totals, status labels, filename sanitization, theme tokens, feature-allowlist parsing, and renderer adapter behavior.
2. **Renderer contract tests:** output is `Uint8Array`, starts with `%PDF-`, has at least one page, contains no `NaN`/`Infinity`, and can be parsed by `pdfjs-dist`.
3. **Semantic content tests:** extracted text contains every required heading and fixture value exactly once where appropriate.
4. **Visual regression tests:** render pages to deterministic PNGs using `pdfjs-dist` plus a pinned canvas backend; compare with reviewed golden files using `pixelmatch`. Ignore only a documented metadata region if unavoidable.
5. **Route integration tests:** unchanged 401, 400, 403, 404, success headers, filename, organization isolation, and query behavior under both renderer selections.
6. **Build/runtime tests:** tracker and admin production builds, Node route execution, deployed preview smoke download, and WASM initialization.
7. **Performance tests:** warm each renderer, render the same fixture at least 20 times, and report p50/p95 duration, output bytes, and process memory delta.

### 7.3 Acceptance Thresholds

- Zero missing required semantic fields.
- Zero invalid/corrupt PDFs.
- Zero clipped or overlapping content in reviewed golden pages.
- Visual pixel difference at or below 0.5% for unchanged new-renderer goldens; intentional changes require approval.
- New-renderer p95 duration no more than 25% above the jsPDF baseline for the same fixture.
- New-renderer output no more than 25% larger than the jsPDF baseline unless an approved font or accessibility improvement explains the difference.
- No authorization, organization-isolation, SSRF, or cache-control regression.
- Tracker and admin type checks, tests, lint, and production builds pass.

If a numeric performance or size gate cannot be met, the phase MUST remain incomplete until the implementation is optimized or the exception is documented with measured evidence and explicitly accepted.

## 8. Phase Completion and Change Control

A phase is complete only when every task is checked, its tests are green, generated artifacts have been reviewed, and its exit gate is recorded in the pull request or implementation log. Later discoveries that alter interfaces, rollout behavior, required content, or thresholds MUST update this specification before implementation continues.
