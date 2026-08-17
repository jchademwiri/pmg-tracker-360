---
name: playwright-e2e-testing
description: Best practices for writing robust, non-flaky end-to-end browser tests using Playwright. Use when writing, debugging, or running tests in apps/tracker/e2e or updating CI e2e test suites.
---

# Playwright E2E Testing Best Practices

Follow these guidelines when creating or modifying Playwright end-to-end tests.

---

## 1. Locators & Selectors
* **User-Facing Roles**: Prioritize `page.getByRole()`, `page.getByText()`, `page.getByLabel()`, and `page.getByPlaceholder()`.
* **Test IDs**: Use `page.getByTestId()` as a secondary fallback for complex interactive components.
* **Avoid Fragile Selectors**: Never use strict XPath or deep CSS class chains (e.g. `div > span.font-bold:nth-child(2)`).

## 2. Asynchronous Assertions
* **Auto-Waiting**: Always use web-first assertions like `await expect(locator).toBeVisible()`, `await expect(locator).toHaveText()`, or `await expect(locator).toBeEnabled()`.
* **No Arbitrary Sleep**: Never use hardcoded timeouts like `page.waitForTimeout(3000)`. Wait for specific network responses (`page.waitForResponse`) or element states.

## 3. Test Isolation & Data Management
* **Clean State**: Each test file must be independent and capable of running in isolation or in parallel.
* **Dynamic Fixtures**: Generate unique test data (e.g. unique tender titles or timestamps with `@faker-js/faker` or nanoid) to avoid collision when tests run concurrently.
* **Auth Fixtures**: Reuse authenticated browser state or mock sessions where appropriate to accelerate test runs.
