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

	const firstOption = page.getByRole("option", {
		name: "list venue 0, city 0",
	});

	await expect(firstOption).toBeVisible();
	await expect(firstOption).not.toHaveAttribute("data-focused", "true");

	const secondOption = page.getByRole("option", {
		name: "list venue 1, city 1",
	});

	await expect(secondOption).toBeVisible();
	await expect(secondOption).not.toHaveAttribute("data-focused", "true");

	// First, check what's focused BEFORE pressing ArrowDown
	console.log("BEFORE pressing ArrowDown:");
	const allOptionsBefore = await page.getByRole("option").all();
	for (let i = 0; i < allOptionsBefore.length; i++) {
		const option = allOptionsBefore[i];
		const text = await option.textContent();
		const focused = await option.getAttribute("data-focused");
		const key = await option.getAttribute("data-key");
		const classes = await option.getAttribute("class");
		const ariaDisabled = await option.getAttribute("aria-disabled");
		const tabIndex = await option.getAttribute("tabindex");
		console.log(
			`  Option ${i}: key=${key}, focused=${focused}, aria-disabled=${ariaDisabled}, tabindex=${tabIndex}, text=${text}`,
		);
	}

	// First, let's debug what happens after first ArrowDown
	await page.keyboard.press("ArrowDown");

	// Log all options after first ArrowDown
	const allOptionsAfterFirst = await page.getByRole("option").all();
	console.log("After 1st ArrowDown:");
	for (let i = 0; i < allOptionsAfterFirst.length; i++) {
		const option = allOptionsAfterFirst[i];
		const text = await option.textContent();
		const focused = await option.getAttribute("data-focused");
		const key = await option.getAttribute("data-key");
		const classes = await option.getAttribute("class");
		const ariaDisabled = await option.getAttribute("aria-disabled");
		console.log(
			`  Option ${i}: key=${key}, focused=${focused}, aria-disabled=${ariaDisabled}, text=${text}, classes=${classes}`,
		);
	}

	// Temporarily comment out this check to see what happens after second ArrowDown
	// await expect(firstOption).toHaveAttribute("data-focused", "true");

	// Press ArrowDown again - should move to second item
	await page.keyboard.press("ArrowDown");

	// Log all options after second ArrowDown
	const allOptionsAfterSecond = await page.getByRole("option").all();
	console.log("After 2nd ArrowDown:");
	for (let i = 0; i < allOptionsAfterSecond.length; i++) {
		const option = allOptionsAfterSecond[i];
		const text = await option.textContent();
		const focused = await option.getAttribute("data-focused");
		const key = await option.getAttribute("data-key");
		const classes = await option.getAttribute("class");
		const ariaDisabled = await option.getAttribute("aria-disabled");
		console.log(
			`  Option ${i}: key=${key}, focused=${focused}, aria-disabled=${ariaDisabled}, text=${text}, classes=${classes}`,
		);
	}

	// Should be on second item, not third
	await expect(secondOption).toHaveAttribute("data-focused", "true");
	await expect(firstOption).toHaveAttribute("data-focused", "false");
});
