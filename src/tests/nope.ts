import { test } from "vitest";
import { getMockDb } from "./db";
import { startApp } from "./server";

test("can start app in testcontainer", async () => {
	console.log("hehe");

	const { url } = await getMockDb();

	console.log("haha", url);

	await startApp(url);
});
