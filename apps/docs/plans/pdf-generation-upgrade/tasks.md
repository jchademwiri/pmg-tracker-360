# PDF Generation Upgrade Phased Task List

Each checkbox represents an independently verifiable deliverable. A phase MUST NOT be enabled in production until its exit gate is satisfied. Implementation PRs SHOULD stay within one phase, with smaller PRs preferred for templates and test infrastructure.

## Phase 0 — Baseline, Characterization, and Approval Fixtures

**Objective:** Freeze the current external behavior and create evidence against which migration changes can be judged.

- [ ] Inventory all seven `PdfDocumentKind` values against generators, routes, buttons, permissions, queries, filenames, orientations, and current tests.
- [ ] Create deterministic fixtures for minimal, typical, long/multi-page, Unicode, missing-logo, and valid-logo cases.
- [ ] Refactor current-date access behind an injectable `generatedAt` value where required for deterministic tests, without changing production output.
- [ ] Add route characterization tests for authentication, active organization, permissions, not found, successful headers, filenames, and `no-store` behavior.
- [ ] Add semantic extraction tooling and record required text for every baseline fixture.
- [ ] Generate and retain approved baseline PDFs and page images as CI artifacts; track only durable golden inputs/outputs needed by the chosen harness.
- [ ] Record page count, byte size, p50/p95 render duration, and memory delta for every typical and large fixture.
- [ ] Confirm existing logo SSRF, timeout, redirect, size-limit, and fallback behavior with tests.
- [ ] Document any current output defect that should be fixed rather than preserved.

**Exit gate:** The current contracts, fixtures, visual references, security behavior, and measured baselines are reproducible locally and in CI.

## Phase 1 — Shared pdfcn/Takumi Foundation

**Objective:** Establish an isolated, testable shared package before migrating a production document.

- [ ] Create private workspace package `@pmg/pdf` with TypeScript, lint, test, and explicit export configuration.
- [ ] Add a package-local shadcn configuration whose aliases place registry code under `src/components/pdf`, `src/lib`, and `src/types`.
- [ ] Preview required pdfcn/Takumi registry items with the Bun-based shadcn CLI and review the dry-run file/dependency list.
- [ ] Install only the foundation components listed in the specification; review every copied file and normalize imports.
- [ ] Add the Takumi renderer adapter using the supported Next.js/server import path and returning `Uint8Array`.
- [ ] Implement `PdfDocumentKind`, render context, branding, renderer result, and renderer interfaces.
- [ ] Create `trackerTheme` and `adminTheme` with fixed hex tokens and tests for the expected palette.
- [ ] Implement shared A4 page setup, headers, footers, page numbers, typography, table primitives, empty state, and keep-together behavior.
- [ ] Add deterministic renderer contract, text extraction, and PNG visual-regression harnesses with pinned versions.
- [ ] Add a fixture-only reference document that exercises portrait/landscape pages, branding, tables, wrapping, page breaks, and missing-logo fallback.
- [ ] Add structured render telemetry helpers without tenant/document content.
- [ ] Add `@pmg/pdf` to the tracker and admin workspace dependencies and required Next.js transpilation/runtime configuration.
- [ ] Verify tracker and admin production builds and a deployed preview route can initialize the WASM renderer.

**Exit gate:** The shared reference document passes unit, semantic, visual, production-build, and deployed WASM smoke tests in both applications.

## Phase 2 — Purchase-Order Pilot

**Objective:** Validate the architecture on a contained, representative transactional document.

- [ ] Define `PurchaseOrderPdfModel` with branding, metadata, project, ordered line items, and totals.
- [ ] Add mapping tests from existing purchase-order query results to the new view model.
- [ ] Add failing semantic tests for every required PO field, totals, and empty-state behavior.
- [ ] Add failing visual tests for typical, long-address, long-description, no-lines, single-page, and multi-page POs.
- [ ] Implement the pdfcn purchase-order template using shared header, key-value, table, totals, and footer components.
- [ ] Preserve the existing 15% VAT calculation and South African date/currency formatting.
- [ ] Ensure repeated table headers and row/footer separation across page breaks.
- [ ] Add `PDFCN_DOCUMENTS` parser and select the renderer for `purchase-order` only.
- [ ] Run the route contract suite with the allowlist disabled and enabled.
- [ ] Verify valid, missing, rejected, corrupt, oversized, and timed-out logo paths.
- [ ] Compare semantic content, visual output, page count, byte size, and p95 latency against Phase 0.
- [ ] Deploy to preview, download representative PDFs, and inspect them in browser and desktop readers.
- [ ] Enable `purchase-order` for an internal/canary environment and verify telemetry and rollback.

**Exit gate:** All PO requirements and thresholds pass, no route/security contract changes, and environment-only rollback is demonstrated.

## Phase 3 — Tracker Transactional and Summary PDFs

**Objective:** Reuse the foundation for tender detail and win/loss documents.

- [ ] Define and test `TenderDetailPdfModel` and `TenderWinLossPdfModel`.
- [ ] Add fixtures for all tender statuses, priorities, optional dates, award values, briefing details, and loss details.
- [ ] Add zero-data, one-reason, and many-reason win/loss fixtures.
- [ ] Add failing semantic and visual tests for tender detail.
- [ ] Implement the tender-detail template with conditional sections and long-text pagination.
- [ ] Add failing semantic and visual tests for win/loss.
- [ ] Implement the win/loss template with summary components and a loss-reason table.
- [ ] Verify status resolution, ratios, totals, and no `NaN`/`Infinity` output.
- [ ] Run both route contract suites with each renderer selection.
- [ ] Compare output size and performance to baselines and resolve or document regressions.
- [ ] Enable `tender-detail` and `tender-win-loss` incrementally; observe telemetry and verify rollback after each enablement.

**Exit gate:** Tender detail and win/loss requirements pass independently and both document kinds complete the observation period without material regressions.

## Phase 4 — Tracker Tender Register and Client Report

**Objective:** Migrate the densest tracker layout and prove robust landscape table pagination.

- [ ] Define `TenderRegisterPdfModel` with explicit portfolio/client variants and ordered row types.
- [ ] Preserve current client filtering and the existing no-client/no-tenders error contract.
- [ ] Add fixtures for no rows, one row, multiple pages, long client/contact/description values, and submission timing states.
- [ ] Add failing tests for portfolio metrics, client metrics, column presence, row order, and filename generation.
- [ ] Implement the shared A4 landscape register template.
- [ ] Implement variant-specific headings, metrics, and column definitions without duplicating page furniture.
- [ ] Ensure table headers repeat, rows do not disappear or duplicate, and footers remain clear on every page.
- [ ] Verify intentional truncation/wrapping against the semantic-content contract.
- [ ] Run route tests with and without `clientId`, including cross-organization and missing-client cases.
- [ ] Compare large-fixture page count, output size, p95 latency, and memory to baseline.
- [ ] Enable `tender-register`, observe telemetry, and verify rollback.

**Exit gate:** Portfolio and client variants pass semantic, visual, filtering, pagination, route, and performance gates.

## Phase 5 — Admin Platform, Storage, and Security Reports

**Objective:** Migrate the large multi-section admin reports after shared components are proven.

- [ ] Split current admin report data into strict `PlatformExecutivePdfModel`, `StorageAuditPdfModel`, and `SecurityAuditPdfModel` mappings.
- [ ] Characterize every current section, heading, metric, table, chart series, severity label, and forced page break.
- [ ] Add zero-state, normal, and large-volume fixtures for all three reports.
- [ ] Add semantic and visual tests for platform executive output; then implement its template.
- [ ] Add semantic and visual tests for storage audit output; then implement its template.
- [ ] Add semantic and visual tests for security audit output; then implement its template.
- [ ] Ensure chart values have labels or adjacent tabular/text equivalents and are not color-only.
- [ ] Verify large tenant and security-event tables for stable ordering, complete pagination, and repeated headers.
- [ ] Run existing admin generator tests plus new route contract suites under both renderer selections.
- [ ] Compare output size, p95 latency, and memory to all admin baselines.
- [ ] Enable the three admin document kinds one at a time with observation and rollback checks between them.

**Exit gate:** All admin report content, visuals, accessibility basics, routes, builds, and performance thresholds pass, with each kind proven independently in production.

## Phase 6 — Default Cutover, Cleanup, and Operational Handoff

**Objective:** Remove migration scaffolding only after the new path is proven for every document.

- [ ] Enable all seven pdfcn document kinds in production and start the seven-day observation window, exercising each kind at least ten times through real or approved synthetic requests.
- [ ] Monitor PDF endpoint failure rate, render duration, output size, WASM failures, and user-reported rendering issues.
- [ ] Exercise an operational rollback during a controlled window and re-enable the new renderer.
- [ ] Confirm generated output in current Chromium, Firefox, Edge, Adobe Acrobat Reader, and the platform-supported mobile viewer.
- [ ] Confirm all semantic, visual, security, route, type-check, lint, test, and production-build suites pass from a clean checkout.
- [ ] Remove legacy jsPDF renderer branches only after the observation window completes.
- [ ] Remove jsPDF from tracker and admin dependencies when no imports remain.
- [ ] Remove obsolete coordinate/page-layout helpers and legacy-only tests.
- [ ] Remove `PDFCN_DOCUMENTS` and renderer-selection code, making pdfcn the single path.
- [ ] Retain contract, semantic, visual, security, and performance regression coverage.
- [ ] Update user-facing documentation only if visible PDF presentation or supported content changed.
- [ ] Add maintainer guidance for adding a document, changing a theme, reviewing goldens, and updating pdfcn registry sources.
- [ ] Record final before/after render metrics and close any accepted exceptions with rationale.

**Exit gate:** pdfcn is the only production renderer, jsPDF and migration flags are absent, clean CI passes, operational documentation is complete, and no material regression occurred during the observation window.
