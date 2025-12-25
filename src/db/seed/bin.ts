import "dotenv/config";

import { db } from "../connection";

import { pages } from "../schema";
import { seedRatingsPage } from "./lexical";
import { seedVenues } from "./venues";

async function main() {
	await db
		.insert(pages)
		.values([
			{
				path: "ratings",
			},
			{
				path: "juniors",
			},
			{
				path: "sanctioning",
			},
		])
		.onConflictDoNothing();

	await seedRatingsPage();
	await seedVenues();
}

main()
	.then(() => {
		console.log("success");

		process.exit(0);
	})
	.catch((err) => {
		console.error(err);

		process.exit(1);
	});
