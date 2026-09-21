# UI Package (@pmg/ui)

## Overview

Shared design system and UI component library for PMG Tracker 360. Contains reusable React components, Tailwind styling primitives, and accessible dialogs.

## Stack

- **Framework**: React 19.2
- **Primitives**: Radix UI
- **Styling**: Tailwind CSS v4, Class Variance Authority, clsx, tailwind-merge
- **Icons**: Lucide React

## Key files

| File | Owns |
|---|---|
| `packages/ui/src/components/` | Reusable UI components (buttons, dialogs, inputs, tables) |
| `packages/ui/src/lib/utils.ts` | Styling and class merging utility functions |
| `packages/ui/src/styles/globals.css` | Core design tokens and CSS variables |

## Commands

```bash
# Typecheck UI package
bun --cwd packages/ui check-types

# Lint UI components
bun --cwd packages/ui lint
```

## Conventions

- Components follow shadcn and Radix patterns with full keyboard accessibility.
- Style variants use `class-variance-authority` (cva) for consistency.
- Components support light and dark theme classes smoothly.

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
