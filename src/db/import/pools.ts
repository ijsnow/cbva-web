import { chunk, groupBy } from "lodash-es";

import { db } from "../connection";
import { legacy } from "../legacy";
import { pools, teams } from "../schema";
import { mapDivision } from "./shared";

export async function importPoolsForYear(
	year: number,
	venues: Map<string, number>,
	divisions: Map<string, number>,
) {
	const tournaments = await legacy.query.tournaments.findMany({
		where: (t, { gte, lt, ne, and }) =>
			and(
				gte(t.startAt, new Date(`${year}-01-01`)),
				lt(t.startAt, new Date(`${year + 1}-01-01`)),
				ne(t.status, "Schedule"),
				ne(t.status, "Cancelled"),
			),
		with: {
			pools: true,
		},
	});

	const venuesRev = new Map(
		Array.from(venues.entries()).map(([uuid, id]) => [id, uuid]),
	);

	const divisionsRev = new Map(
		Array.from(divisions.entries()).map(([uuid, id]) => [id, uuid]),
	);

	const tournamentDivisions = (
		await db.query.tournaments.findMany({
			where: (t, { gte, lt, and }) =>
				and(gte(t.date, `${year}-01-01`), lt(t.date, `${year + 1}-01-01`)),
			with: {
				tournamentDivisions: true,
			},
		})
	).reduce<{ [key: string]: number }>((memo, t) => {
		for (const td of t.tournamentDivisions) {
			const key = [
				venuesRev.get(t.venueId),
				td.name,
				t.date,
				divisionsRev.get(td.divisionId),
				td.gender,
			].join(":");

			memo[key] = td.id;
		}

		return memo;
	}, {});

	const poolsToCreate: (typeof pools.$inferInsert)[] = tournaments.flatMap(
		({ id, name, startAt, beachId, pools, division, gender }) =>
			pools.map((p) => {
				const key = [
					beachId,
					name,
					startAt.toISOString().split("T")[0],
					mapDivision(division),
					gender.toLowerCase(),
				].join(":");

				return {
					tournamentDivisionId: tournamentDivisions[key] as number,
					name: p.name,
					court: p.court,
					done: p.done,
					externalRef: p.id,
				};
			}),
	);

	for (const batch of chunk(poolsToCreate, 500)) {
		console.log(`pools(${year}): inserting batch of size ${batch.length}`);

		await db.insert(pools).values(batch);
	}
}
