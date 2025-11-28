import { expect, test } from "@playwright/test";

test("can sign up", async ({ page }) => {
	await page.goto("/sign-up");

	const delay = (ms: number) =>
		new Promise((resolve) => setTimeout(resolve, ms));
	await delay(5000);

	await page.getByRole("textbox", { name: "Name*" }).fill("Test Name");
	// await page.getByLabel('Email').fill('test@example.com');
	await page
		.getByRole("textbox", { name: "Email*", exact: true })
		.fill("test@example.com");
	await page
		.getByRole("textbox", { name: "Phone*", exact: true })
		.fill("+15555555555");
	await page
		.getByRole("textbox", { name: "Password*", exact: true })
		.fill("Password1!");
	await page
		.getByRole("textbox", { name: "Confirm Password*", exact: true })
		.fill("Password1!");

	await delay(5000);
	await page.getByRole("button", { name: "Submit" }).click();

	await page.waitForURL("**/account/verify**");
});

test.describe.skip(() => {
  test.use({ storageState: 'playwright/.auth/unverifieduser.json' });

  test("is shown account verification page if either email or phone aren't verified", async ({ page, request }) => {
    // Authenticate
    page.goto('/')

    await page.waitForURL("**/account/verify**");
    // verify email
    // page.goto('/')
    // await page.waitForURL("**/account/verify**");
    // verify phone
    // page.goto('/')
    // expect some text in home page
  });
})

test("can log in", async ({ page }) => {
	await page.goto("/log-in");

	const delay = (ms: number) =>
		new Promise((resolve) => setTimeout(resolve, ms));
	await delay(5000);

	await page
		.getByRole("textbox", { name: "Email*", exact: true })
		.fill("verifieduser@example.com");
	await page
		.getByRole("textbox", { name: "Password*", exact: true })
		.fill("Password1!");

	await delay(5000);
	await page.getByRole("button", { name: "Log in" }).click();

	await page.waitForURL("**/account**");
});
