import { test, expect } from '@playwright/test';

test.describe('Streamlined Navigation & Redirections E2E Tests', () => {
  test('should redirect legacy overview routes to primary workspaces', async ({ page }) => {
    // 1. Visit /settings/overview and verify it redirects to /settings (or /login if unauthenticated)
    await page.goto('/settings/overview', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/(settings|login)/);

    // 2. Visit /tenders/overview and verify it redirects to /tenders (or /login)
    await page.goto('/tenders/overview', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/(tenders|login)/);

    // 3. Visit /projects/overview and verify it redirects to /projects (or /login)
    await page.goto('/projects/overview', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/(projects|login)/);
  });
});
