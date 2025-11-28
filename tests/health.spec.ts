import { test, expect } from "@playwright/test";

test("is ok", async ({ page }) => {
	await page.goto("/health");

	await expect(page.getByText('"ok"')).toBeVisible();
});
