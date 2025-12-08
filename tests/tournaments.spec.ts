import { expect, test } from "@playwright/test";

test("locations ComboBox is navigable by keyboard", async ({ page }) => {
	await page.goto("/tournaments");

	const combobox = page.getByRole("combobox", {
		name: "Locations",
		exact: true,
	});

	await combobox.click();

	await combobox.fill("list");

	await expect(page.getByRole("listbox")).toBeVisible();

	// I have prepulated the database with 10 items so that result
	// in the list being as follows:
	//
	// - list venue 0, city 0
	// - list venue 1, city 1
	// - ...
	// - list venue 9, city 9

	const defaultOption = page.getByRole("option", {
		name: "list venue 0, city 0",
	});

	await expect(defaultOption).toBeVisible();
	await expect(defaultOption).not.toHaveAttribute("data-focused", "true");

	await page.keyboard.press("ArrowDown");

	await expect(defaultOption).toHaveAttribute("data-focused", "true");
	// TODO: add several venues and navigate by menu
});
