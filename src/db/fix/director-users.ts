import "dotenv/config";

import { eq } from "drizzle-orm";
import { db } from "../connection";
import { users } from "../schema";

async function main() {
	const directors = await db._query.directors.findMany({
		with: {
			profile: {
				with: {
					user: true,
				},
			},
		},
	});

	const userIds = directors.map(({ profile: { userId } }) => userId);

	await Promise.all(
		userIds.map((userId) =>
			db.update(users).set({ role: "td" }).where(eq(users.id, userId)),
		),
	);

	process.exit(0);
}

await main();
