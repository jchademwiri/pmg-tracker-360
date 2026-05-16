# Tender Track 360 Project Context

This document provides context for the Tender Track 360 project, a web application designed to streamline and optimize the government tender management process.

## Project Overview

Tender Track 360 is a full-stack application built with [Next.js](https://nextjs.org/) and [React](https://react.dev/). It uses [TypeScript](https://www.typescriptlang.org/) for type safety. The backend is powered by Next.js Server Actions, and it interacts with a [PostgreSQL](https://www.postgresql.org/) database via the [Drizzle ORM](https://orm.drizzle.team/). Authentication is handled by [Better Auth](https://www.betterauth.dev/).

The application is designed to digitize the entire tender lifecycle, from discovery to award, enabling organizations to efficiently track, respond to, and analyze public procurement opportunities.

## Package Manager

The project uses [bun](https://bun.sh/) for package management. Always use `bun` for installing, removing, or updating dependencies.

- Install dependencies: `bun install`
- Add a dependency: `bun add <package-name>`
- Remove a dependency: `bun remove <package-name>`

## Key Commands

The following scripts are available in `package.json`:

- **`bun dev`**: Starts the development server.
- **`bun build`**: Creates a production-ready build of the application.
- **`bun start`**: Starts the production server.
- **`bun lint`**: Lints the codebase using ESLint.
- **`bun test`**: Runs tests using Jest.
- **`bun db:push`**: Pushes the Drizzle schema to the database.
- **`bun db:generate`**: Generates Drizzle migration files.
- **`bun db:migrate`**: Applies generated migrations to the database.
- **`bun db:studio`**: Opens the Drizzle Studio to view and manage data.

## Development Conventions

- **Styling**: The project uses [Tailwind CSS](https://tailwindcss.com/) for styling.
- **UI Components**: UI components are built using [Shadcn UI](https://ui.shadcn.com/).
- **Code Formatting**: [Prettier](https://prettier.io/) is used for code formatting and is configured in `.prettierrc.json`.
- **Linting**: [ESLint](https://eslint.org/) is used for linting and is configured in `eslint.config.mjs`.
- **Path Aliases**: The project uses the `@/*` alias for the `src` directory (e.g., `import { db } from '@/db'`).

## Database

- The database schema is defined in `src/db/schema.ts` and managed with Drizzle ORM. Use the `db:*` scripts to interact with the database schema and migrations. The Drizzle configuration is in `drizzle.config.ts`.
- always use postgresql for database with drizzle orm

## Standards

- always follow a test driven development approach
- we are using typescript, tailwindcss, shadcn ui, bun
- always run bun run build when you are done with code changes
- create a detailed commit message

## Authentication

- we are using better auth for authentication
