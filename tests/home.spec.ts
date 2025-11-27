import { test, expect } from '@playwright/test';

test('has sign up link', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/CBVA/);
  await expect(page.getByText('Sign Up')).toBeVisible();
});

test('default venue link', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('default venue, default city')).toBeVisible();
});
