import { createClient } from "gel";
import { drizzle } from "drizzle-orm/gel";
import { and, asc, eq, gte, lt } from "drizzle-orm";

import { tournaments, beaches } from "./schema/tables";

import * as tables from "./schema/tables";
import * as relationships from "./schema/relationships";

const gelClient = createClient({
	instanceName: "drizzle",
});

export const legacy = drizzle({
	client: gelClient,
	casing: "snake_case",
	schema: {
		...tables,
		...relationships,
	},
});

export async function getEarliestYear() {
	const earliest = await legacy
		.select()
		.from(tournaments)
		.orderBy(asc(tournaments.startAt))
		.limit(1);

	return earliest[0].startAt.getFullYear();
}

export async function getTournaments(year: number) {
	const groups = await legacy.query.tournaments.findMany({
		with: {
			beach: true,
		},
		where: and(
			gte(tournaments.startAt, new Date(`${year}-01-01`)),
			lt(tournaments.startAt, new Date(`${year + 1}-01-01`)),
		),
	});

	return groups;
}
