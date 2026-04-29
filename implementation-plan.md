# Monorepo Implementation Plan

## Recommendations

### Documentation App (/docs)
- Astro Starlight is recommended for the /docs app if you want a modern, feature-rich documentation site with built-in navigation, search, and markdown support. It is ideal for user guides and technical documentation.
- If you prefer a minimal setup, plain Astro or Next.js can be used, but Starlight is purpose-built for documentation and offers a better out-of-the-box experience.

### Web App (tracker)
- If you want to preserve any code or history from the current `web` app, rename it to `tracker` and refactor as needed.
- If you want a clean slate, delete the `web` app and scaffold a new `tracker` app from scratch.

## Goals
- Restructure apps: remove/rename `web`, add `admin` and `tracker`, keep `docs`.
- `docs`: Documentation for tracker users (consider Starlight or Astro).
- `admin`: Admin dashboard for system owners.
- `tracker`: Public-facing app for tender and PO management (migrate https://www.tendertrack360.co.za/).
- Packages: add `db` and update `ui` to use shadcn components as shared UI; consider shared or per-app `auth`.

## Steps

### 1. App Structure
- Remove or rename `web` app.
- Create new apps: `admin` and `tracker` under `apps/`.
- Ensure `apps/docs` remains for documentation.

### 2. Packages
- Add `db` package for shared database logic.
- Update `ui` package to use shadcn components; add shadcn components as needed.
- Consider if `auth` should be a shared package or per-app (pending decision).

### 3. Docs App
- Decide between Starlight or Astro for documentation.
- Scaffold and configure chosen framework in `apps/docs`.

### 4. Tracker App
- Scaffold Next.js app in `apps/tracker`.
- Migrate code and features from https://www.tendertrack360.co.za/.
- Integrate shared `ui` and `db` packages.
- Implement or integrate authentication (shared or per-app).

### 5. Admin App
- Scaffold Next.js app in `apps/admin`.
- Build admin features for system owners.
- Integrate shared `ui` and `db` packages.
- Implement or integrate authentication (shared or per-app).

### 6. Monorepo Config
- Update `turbo.json` to include new apps and packages.
- Ensure all apps use shared TypeScript and ESLint configs from `packages/`.

### 7. Shadcn Integration
- Set up shadcn in `packages/ui` for shared components.
- Document usage for all apps.

### 8. Auth Strategy
- Decide on shared vs per-app auth implementation.
- Implement accordingly and document the approach.

### 9. Documentation
- Use `apps/docs` to document usage, setup, and architecture for all apps and packages.

---

**Next Steps:**
1. Remove/rename `web` app.
2. Scaffold `admin` and `tracker` apps.
3. Add `db` package.
4. Update `ui` package for shadcn.
5. Decide on docs framework and auth strategy.
6. Migrate tracker app code.
7. Build admin features.
8. Update monorepo configs.
9. Document everything in `docs`.
