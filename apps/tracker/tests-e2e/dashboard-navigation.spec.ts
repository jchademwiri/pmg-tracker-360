import { test, expect } from '@playwright/test';

test.describe('Dashboard Security E2E Tests', () => {
  test('should redirect unauthorized users from dashboard to login page', async ({ page }) => {
    // 1. Visit the dashboard route while unauthenticated
    await page.goto('/dashboard');

    // 2. Expect browser to be redirected to the /login page
    await expect(page).toHaveURL(/\/login/);
  });
});
