# Documentation App

## Overview

Public technical and product documentation site for PMG Tracker 360, built with Astro Starlight.

## Stack

- **Framework**: Astro 6.1, Starlight 0.38
- **Image optimization**: Sharp 0.34
- **Language**: TypeScript

## Key files

| File | Owns |
|---|---|
| `apps/docs/astro.config.mjs` | Astro and Starlight configuration |
| `apps/docs/src/content/docs/` | Documentation markdown and MDX pages |

## Commands

```bash
# Run docs site in dev mode on port 3002
bun --filter docs dev

# Build docs site
bun --filter docs build
```

## Conventions

- Write documentation in clear markdown or MDX following Starlight content collection schemas.
- Organize articles hierarchically by feature domain.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
