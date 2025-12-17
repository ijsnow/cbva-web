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
		.where(
			inArray(tournamentDivisions.name, [
				"Cal Cup Bid + AVP Bid Event",
				"Surf City Days",
				"Surf City Days $2,000",
				"Coed Junior Championships",
				"CBVA Fall Championship Bid + AVP Bid Event",
				"Mich Ultra Premier Tour: $2,000",
				"Mich Ultra Premier Tour: $4,000 Gene Selznick",
			]),
		);

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
				"Mike Cook Marine Street Father/Daughter",
				"Mike Cook Marine Street Mixed",
			]),
		);

	await db
		.update(tournamentDivisions)
		.set({
			name: "AVP Bid Event",
		})
		.where(
			eq(
				tournamentDivisions.name,
				"CBVA Fall Championship Bid + AVP Bid Event",
			),
		);

	process.exit(0);
}

await main();
