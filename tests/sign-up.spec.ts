import { test, expect } from '@playwright/test';

test('can sign up', async ({ page }) => {
  await page.goto('/sign-up');

  await page.getByLabel('Name').fill('Test Name');
  // await page.getByLabel('Email').fill('test@example.com');
  await page.getByRole('textbox', { name: 'Email*', exact: true }).fill('test@example.com');
  await page.getByLabel('Phone').fill('+15555555555');
  await page.getByRole('textbox', { name: 'Password*', exact: true }).fill('password');
  await page.getByLabel('Confirm Password').fill('password');

  await page.getByRole('button', { name: 'Submit' }).click();

  await page.waitForURL('**/account/verify');
});
