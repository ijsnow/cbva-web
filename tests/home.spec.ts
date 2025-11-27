import { test, expect } from '@playwright/test';

test('has two sign up links when not authenticated', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/CBVA/);

  await expect(
    page
      .getByRole('link', { name: 'Sign Up' })
  ).toHaveCount(2);
});

test('default venue link', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('DEFAULT VENUE,DEFAULT CITY')).toBeVisible();
});
