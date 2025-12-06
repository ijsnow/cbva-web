import test from "@playwright/test";

test("venues ComboBox is navigable by keyboard", async ({ page }) => {
	await page.goto("/tournaments");

	// // Expect a title "to contain" a substring.
	// await expect(page).toHaveTitle(/CBVA/);

	// await expect(page.getByRole("link", { name: "Sign Up" })).toHaveCount(2);
});
