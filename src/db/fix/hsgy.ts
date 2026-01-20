import "dotenv/config";

import { eq } from "drizzle-orm";
import { createClient } from "gel";
import { db } from "../connection";
import { playerProfiles } from "../schema";

async function main() {
	console.log("connecting to legacy db...");

	const legacy = createClient({
		instanceName: "legacy",
	});

	console.log("connected");

	const legacyUsers = await legacy.query<{
		id: string;
		high_school_grad_year: number | null;
	}>(`
    select User {
      id,
      high_school_grad_year
    }
    filter exists .high_school_grad_year
  `);

	console.log(`found ${legacyUsers.length} users with high_school_grad_year`);

	let updated = 0;
	let notFound = 0;

	for (const user of legacyUsers) {
		const result = await db
			.update(playerProfiles)
			.set({
				highSchoolGraduationYear: user.high_school_grad_year,
			})
			.where(eq(playerProfiles.externalRef, user.id))
			.returning({ id: playerProfiles.id });

		if (result.length > 0) {
			updated += 1;
		} else {
			notFound += 1;
			console.log(`profile not found for user ${user.id}`);
		}
	}

	console.log(`updated ${updated} profiles`);
	console.log(`not found ${notFound} profiles`);
}

await main();

process.exit(0);
