import "dotenv/config";

import { db } from "../connection";

import { pages } from "../schema";
import { seedCalCupPage, seedJuniorsPage, seedRatingsPage } from "./lexical";
import { seedVenues } from "./venues";

async function main() {
	await db
		.insert(pages)
		.values([
			{
				path: "cal-cup",
			},
			// {
			// 	path: "ratings",
			// },
			// {
			// 	path: "juniors",
			// },
			// {
			// 	path: "sanctioning",
			// },
		])
		.onConflictDoNothing();

	// await seedRatingsPage();
	// await seedJuniorsPage();
	await seedCalCupPage();
	// await seedVenues();
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
