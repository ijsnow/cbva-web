import { eq, inArray } from "drizzle-orm";
import { db } from "../connection";
import { tournamentDivisions } from "../schema";

async function main() {
	await db
		.update(tournamentDivisions)
		.set({
			displayDivision: true,
			displayGender: true,
		})
		.where(eq(tournamentDivisions.name, "Cal Cup Bid + AVP Bid Event"));

	await db
		.update(tournamentDivisions)
		.set({
			displayDivision: true,
			displayGender: false,
		})
		.where(
			inArray(tournamentDivisions.name, [
				"Mother/Son",
				"Mother/Daughter",
				"Father/Son",
				"Father/Daughter",
			]),
		);

	process.exit(0);
}

await main();
