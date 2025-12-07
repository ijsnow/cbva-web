import { expect, test } from "@playwright/test";

test("locations ComboBox is navigable by keyboard", async ({ page }) => {
	await page.goto("/tournaments");

	const combobox = page.getByRole("combobox", {
		name: "Locations",
		exact: true,
	});

	await combobox.click();

	await combobox.fill("def");

	await expect(page.getByRole("listbox")).toBeVisible();

	await expect(
		page.getByRole("option", { name: "default venue, default city" }),
	).toBeVisible();

	// TODO: add several venues and navigate by menu
});
