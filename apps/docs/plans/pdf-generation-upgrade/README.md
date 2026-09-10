# PDF Generation Upgrade Plan

**Status:** Proposed

**Target branch:** `dev`

**Last updated:** 2026-09-10

**Decision:** Adopt pdfcn components on the Takumi renderer through a phased, reversible migration from jsPDF.

## Purpose

PMG Tracker 360 currently generates PDFs successfully, but most layouts are implemented with imperative jsPDF drawing commands, manual coordinates, and document-specific pagination. This plan upgrades PDF generation to source-owned, composable React components while keeping every existing download endpoint and authorization rule stable.

This folder is the source of truth for the migration:

- [Technical specification](./specification.md) defines required behavior, architecture, interfaces, compatibility rules, and acceptance criteria.
- [Phased task list](./tasks.md) is the implementation checklist and contains the exit gate for every phase.

Implementation follows spec-driven development: update the specification first, add a failing contract or characterization test, implement the smallest change that makes it pass, verify the rendered document, and only then mark the corresponding task complete.

## Recommended Architecture

- Create a dedicated `@pmg/pdf` workspace package for renderer integration, pdfcn-derived components, themes, document templates, and renderer-focused tests.
- Use pdfcn's Takumi component family because Takumi provides a supported Next.js route-handler entry point, produces `Uint8Array` output, supports automatic pagination, and does not require a browser process.
- Keep database queries, authentication, organization scoping, permissions, filename decisions, and secure logo resolution inside the owning application.
- Convert application data into renderer-neutral view models before passing it to `@pmg/pdf`.
- Retain jsPDF during migration and select the renderer per document kind through `PDFCN_DOCUMENTS`; this provides deployment-time rollback without changing routes or client code.
- Migrate the purchase-order PDF first, followed by tracker documents, tracker reports, and finally the larger admin reports.

## Roadmap and Gates

| Phase | Outcome | Exit gate |
| --- | --- | --- |
| 0. Baseline and contracts | Current behavior and performance are captured | Baseline fixtures, PDFs, contract tests, and metrics are recorded |
| 1. Shared foundation | `@pmg/pdf` can render a deterministic branded test document | Package tests, type checks, Next.js smoke build, and WASM deployment check pass |
| 2. Purchase-order pilot | One production route can switch between jsPDF and pdfcn | Contract, content, visual, pagination, security, and performance gates pass |
| 3. Tracker transactional PDFs | Tender detail and win/loss PDFs use shared primitives | Both documents pass their acceptance suites and rollback checks |
| 4. Tracker register reports | Landscape portfolio and client reports are migrated | Dense-table, filtering, repeated-header, and multi-page tests pass |
| 5. Admin reports | Platform, storage, and security reports are migrated | Admin report parity and large-fixture tests pass |
| 6. Cutover and cleanup | pdfcn is the default and jsPDF is removed | Observation window completes with no material regression; docs and dependencies are clean |

## Success Measures

- All seven existing PDF route families preserve status codes, permissions, content disposition, MIME type, and filename behavior.
- Every generated file begins with `%PDF-`, contains selectable text, and renders without errors in Chromium, Firefox, and a desktop PDF reader.
- Required content is verified through text extraction; layout is verified through deterministic page-image snapshots.
- New-renderer p95 generation time is no more than 25% slower than the Phase 0 jsPDF baseline for the same fixture, and generated size is no more than 25% larger unless the phase review accepts a documented quality tradeoff.
- Multi-page tables do not clip rows, overlap headers or footers, or lose required content.
- The new package contains no database, authentication, environment, storage, or HTTP-route dependencies.
- Final cutover remains under observation for seven consecutive days, with each document kind exercised at least ten times.

## Reference Material

- [pdfcn installation](https://www.pdfcn.dev/docs/installation)
- [pdfcn component documentation](https://www.pdfcn.dev/docs/components)
- [pdfcn Takumi theming](https://www.pdfcn.dev/docs/theming/takumi)
- [Takumi PDF and Next.js runtime documentation](https://takumi.kane.tw/docs/pdf)
- [pdfcn source repository](https://github.com/shadcn-labs/pdfcn)
