import { test, expect } from '@playwright/test';

test.describe('Landing Page E2E Tests', () => {
  test('should load the homepage with correct metadata and branding', async ({ page }) => {
    // 1. Visit the root landing page
    await page.goto('/');

    // 2. Verify page title contains branding keywords
    await expect(page).toHaveTitle(/Tender/i);

    // 3. Verify that the logo images are present in the header
    const logo = page.locator('header img[alt="Tender Track 360"]').first();
    await expect(logo).toBeVisible();

    // 4. Verify that the action buttons in header are loaded
    const signInButton = page.locator('header').getByRole('link', { name: 'Sign In' });
    const signUpButton = page.locator('header').getByRole('link', { name: 'Sign Up' });

    await expect(signInButton).toBeVisible();
    await expect(signUpButton).toBeVisible();
  });
});
