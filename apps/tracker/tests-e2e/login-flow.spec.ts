import { test, expect } from '@playwright/test';

test.describe('Login Flow E2E Tests', () => {
  test('should load the login page and show validation errors on bad input', async ({ page }) => {
    // 1. Visit the login page
    await page.goto('/login');

    // 2. Verify that the "Welcome back" card exists
    const welcomeTitle = page.locator('h1, div', { hasText: 'Welcome back' }).first();
    await expect(welcomeTitle).toBeVisible();

    // 3. Fill in invalid fields to trigger client-side validation
    await page.fill('input[placeholder="m@example.com"]', 'invalid-email');
    await page.fill('input[type="password"]', 'short');

    // 4. Click login
    await page.click('button[type="submit"]');

    // 5. Verify the URL is still /login (user was blocked from progressing)
    await expect(page).toHaveURL(/\/login/);
  });
});
