# PDF Package (@pmg/pdf)

## Overview

High performance PDF generation package for PMG Tracker 360. Renders branded tender registers, compliance sheets, purchase orders, and executive summaries using Takumi PDF.

## Stack

- **Renderer**: Takumi PDF 0.14 (`takumi-pdf`, `@takumi-rs/helpers`)
- **Templates**: React 19 components
- **Language**: TypeScript

## Key files

| File | Owns |
|---|---|
| `packages/pdf/src/renderer/` | Document compilation and Takumi PDF rendering pipeline |
| `packages/pdf/src/components/` | PDF layout components (headers, tables, badges, footers) |
| `packages/pdf/src/themes/` | Color schemes, typography, and page sizing |

## Commands

```bash
# Typecheck PDF package
bun --cwd packages/pdf check-types

# Run tests
bun --cwd packages/pdf test
```

## Conventions

- Build PDF templates with explicit page sizing, paging headers, and print safe typography.
- Keep Takumi components decoupled from browser DOM dependencies.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
