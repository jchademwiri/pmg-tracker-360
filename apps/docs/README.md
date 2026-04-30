# Docs App (`apps/docs`)

Product and technical documentation site powered by Astro Starlight.

## Environment

This app currently has no required database environment variables for local development.

## Run Locally

From repository root:

```bash
bun run --filter docs dev
```

Default URL: `http://localhost:3002`

## Build

```bash
bun run --filter docs build
```

## Content

- Documentation lives under `apps/docs/src/content/docs`
- Add pages as `.md` or `.mdx`
