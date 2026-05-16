# Monorepo Conversion Plan for Tender Track 360

## Current Structure Analysis

The current project is a single Next.js application with:
- User-facing dashboard at `(dashboard)` route
- Admin interface at `(admin)` route
- Shared components, hooks, lib, and types
- Database schema and migrations in `/db` and `/migrations`
- Authentication routes in `(auth)`
- API routes in `/app/api`

## Monorepo Structure

We'll convert to a Bun workspace monorepo with the following structure:

```
tender-track-360/
├── packages/
│   ├── shared-db/          # Database schema, migrations, types
│   ├── shared-types/       # Shared TypeScript types
│   ├── shared-utils/       # Utility functions
│   ├── shared-ui/          # Shared UI components (shadcn/ui)
│   ├── shared-hooks/       # Shared React hooks
│   ├── shared-lib/         # Shared library code
│   ├── app-user/           # User-facing Next.js app
│   └── app-admin/          # Admin-facing Next.js app
├── apps/
│   └── (optional for Vercel deployment)
├── .turbo/
├── bun.lockb
├── package.json
└── turbo.json
```

## Step-by-Step Implementation

### Phase 1: Setup Monorepo Infrastructure

1. **Initialize Bun workspace**
   - Create `bun.workspace.toml` or update `package.json` with workspaces configuration
   - Set up `turbo.json` for task running (optional but recommended)

2. **Create shared packages**
   - `packages/shared-db`: Database schema, migrations, Drizzle configuration
   - `packages/shared-types`: Shared TypeScript interfaces and types
   - `packages/shared-utils`: Utility functions (date helpers, formatters, etc.)
   - `packages/shared-ui`: Shadcn/UI components with shared Tailwind config
   - `packages/shared-hooks`: Custom React hooks used in both apps
   - `packages/shared-lib`: Library code (API clients, auth helpers, etc.)

3. **Create app packages**
   - `packages/app-user`: User-facing Next.js application
   - `packages/app-admin`: Admin-facing Next.js application

### Phase 2: Migration of Code

1. **Move database-related code**
   - Move `/drizzle.config.ts` to `packages/shared-db/`
   - Move `/migrations/` to `packages/shared-db/migrations/`
   - Move `/src/db/` to `packages/shared-db/src/`
   - Update imports throughout codebase

2. **Move shared types**
   - Move `/src/types/` to `packages/shared-types/src/`
   - Identify and move type definitions from other files
   - Update imports

3. **Move utilities**
   - Move `/src/lib/` to `packages/shared-lib/src/`
   - Move `/src/hooks/` to `packages/shared-hooks/src/`
   - Move utility functions from components to appropriate packages
   - Update imports

4. **Move UI components**
   - Extract shared components to `packages/shared-ui/src/components/`
   - Keep app-specific components in respective apps
   - Update shadcn configuration
   - Update imports

5. **Separate app code**
   - Move user-specific pages/components to `packages/app-user/`
   - Move admin-specific pages/components to `packages/app-admin/`
   - Keep shared layout/context in shared packages where appropriate

### Phase 3: Configuration Updates

1. **Update package.json files**
   - Root package.json: Workspace configuration
   - Each package: Proper name, version, dependencies
   - Update dependencies to use workspace references where appropriate

2. **Update build scripts**
   - Create dev scripts for each app
   - Create build scripts
   - Update database migration scripts to work from shared-db

3. **Update configuration files**
   - Tailwind config: May need to be shared or duplicated
   - TypeScript config: Base tsconfig with extends for each package
   - ESLint config: Shared configuration
   - Next.js config: Separate for each app

### Phase 4: Testing and Validation

1. **Test local development**
   - Ensure both apps can run concurrently
   - Verify database migrations work from shared package
   - Test shared component usage

2. **Test deployment readiness**
   - Verify Vercel/Netlify build works
   - Test environment variable handling
   - Check bundle sizes

## Specific Considerations

### Database Package
- Should contain only schema, migrations, and types
- No Next.js-specific code
- Export Drizzle client factory function
- Migrations should be runnable from root or shared-db directory

### Shared UI Package
- Need to handle Tailwind CSS properly
- May need to duplicate tailwind.config or use postcss imports
- Consider using `@turbo/gen` for component generation

### Apps
- Each app should have its own:
  - next.config.ts
  - Tailwind CSS setup
  - Environment variables
  - Routing (app router)
  - Layouts and shared components specific to that app

## Commands to Execute

### Initial Setup
```bash
# Create workspace structure
mkdir -p packages/{shared-db,shared-types,shared-utils,shared-ui,shared-hooks,shared-lib}
mkdir -p packages/{app-user,app-admin}

# Initialize packages
cd packages/shared-db && bun init -y
cd ../shared-types && bun init -y
# ... repeat for all packages
```

### Dependency Management
```bash
# Add shared dependencies to apps
cd packages/app-user && bun add ../shared-db ../shared-types ../shared-utils
# ... etc

# Add Next.js and React to apps
cd packages/app-user && bun add next react react-dom
cd packages/app-admin && bun add next react react-dom
```

## Risks and Mitigations

1. **Circular dependencies**: Use linting rules to detect and prevent
2. **Version conflicts**: Use workspace protocol to ensure consistent versions
3. **Build complexity**: Use TurboRepo for caching and parallel execution
4. **Environment variable management**: Use dotenv-cli or similar for loading env vars

## Estimated Timeline
- Phase 1: 2-3 hours
- Phase 2: 4-6 hours
- Phase 3: 2-3 hours
- Phase 4: 2-3 hours for testing