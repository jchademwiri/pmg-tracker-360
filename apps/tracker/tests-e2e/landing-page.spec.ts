import { test, expect } from '@playwright/test';

test.describe('Landing Page E2E Tests', () => {
  test('should load the homepage with correct metadata and branding', async ({ page }) => {
    // 1. Visit the root landing page
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 2. Verify page title contains branding keywords
    await expect(page).toHaveTitle(/Tender/i);

    // 3. Verify that the logo images are present in the header
    const logo = page.locator('header img[alt="Tender Track 360"]').first();
    await expect(logo).toBeVisible({ timeout: 15000 });

    // 4. Verify that action button is loaded (Sign In or Start For Free or Dashboard if session exists)
    const authLink = page.locator('header').getByRole('link', { name: /Sign In|Start For Free|Dashboard|Docs/i }).first();
    await expect(authLink).toBeVisible({ timeout: 20000 });
  });
});
