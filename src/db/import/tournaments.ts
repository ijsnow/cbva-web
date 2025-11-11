import { groupBy, uniqBy } from "lodash";
import { db } from "../connection";
import { legacy } from "../legacy";
import * as legacyTables from "../legacy/schema/tables";
import {
	type Tournament,
	type TournamentDivision,
	tournamentDirectors,
	tournamentDivisions,
	tournaments,
} from "../schema";
import { getDirectorsCache, importDirectorsForYear } from "./directors";
import { importGames } from "./matches";
import { importPoolsForYear } from "./pools";
import { mapDivision } from "./shared";
import { importTeamsForYear } from "./teams";
import { createVenueFromBeach, createVenuesFromBeaches } from "./venues";

export function toKey(locationRef: string, date: Date) {
	return `${locationRef}:${date.toISOString().split("T")[0]}`;
}

export async function importTournamentsForYear(
	year: number,
	cache: Map<string, number>,
	venues: Map<string, number>,
	divisions: Map<string, number>,
	levels: Map<string, number>,
) {
	console.log(`Creating tournaments for ${year}`);

	const batch = await legacy.query.tournaments.findMany({
		where: (tournaments, { and, gte, lt, ne }) =>
			and(
				gte(tournaments.startAt, new Date(`${year}-01-01`)),
				lt(tournaments.startAt, new Date(`${year + 1}-01-01`)),
				ne(tournaments.status, "Schedule"),
				ne(tournaments.status, "Cancelled"),
			),
		orderBy: (t, { asc }) => asc(t.startAt),
		with: {
			beach: true,
			teams: {
				with: {
					players: {
						with: {
							user: true,
						},
					},
				},
			},
			tournamentDirectors: {
				with: {
					directorPreferences: {
						with: {
							user: true,
						},
					},
				},
			},
		},
	});

	console.log(`${batch.length} legacy tournaments`);

	if (batch.length === 0) {
		return;
	}

	venues = await createVenuesFromBeaches(
		batch.map((t) => t.beach),
		venues,
	);

	const directors = await getDirectorsCache();

	const toCreate: (typeof tournaments.$inferInsert & {
		directors: Omit<typeof tournamentDirectors.$inferInsert, "tournamentId">[];
	})[] = uniqBy(batch, (t) => toKey(t.beachId, t.startAt)).map((t) => ({
		// TODO: only set if all divisions this day are same name
		// name: tournament.name,
		date: t.startAt.toISOString().split("T")[0] as string,
		startTime: t.startAt.toTimeString().split(" ")[0] as string,
		venueId: venues.get(t.beachId) as Tournament["venueId"],
		externalRef: toKey(t.beachId, t.startAt),
		directors: t.tournamentDirectors.map((td) => ({
			directorId: directors.get(td.directorPreferences.userId) as number,
			order: td.rank || 0,
		})),
	}));

	const created = await db
		.insert(tournaments)
		.values(toCreate.map(({ directors, ...rest }) => rest))
		.returning({
			id: tournaments.id,
			venueId: tournaments.venueId,
			date: tournaments.date,
			externalRef: tournaments.externalRef,
		});

	const directorsToCreate: (typeof tournamentDirectors.$inferInsert)[] =
		toCreate.flatMap((t) =>
			t.directors.map(({ directorId, order }) => ({
				directorId,
				order,
				tournamentId: created.find(
					({ externalRef }) => externalRef === t.externalRef,
				)?.id as number,
			})),
		);

	await db.insert(tournamentDirectors).values(directorsToCreate);

	const venuesIdToRef = new Map(
		Array.from(venues.entries()).map(([key, value]) => [value, key]),
	);

	const createdMap = created.reduce((memo, t) => {
		memo.set(
			toKey(venuesIdToRef.get(t.venueId) as string, new Date(t.date)),
			t.id,
		);

		return memo;
	}, new Map<string, number>());

	const divisionsToCreate: (typeof tournamentDivisions.$inferInsert)[] =
		Array.from(
			Object.entries(groupBy(batch, (t) => toKey(t.beachId, t.startAt))),
		).flatMap(([key, t]) => {
			const tournamentId = createdMap.get(
				key,
			) as TournamentDivision["tournamentId"];

			if (!tournamentId) {
				throw new Error("no tournament id");
			}

			return t.map((t) => ({
				tournamentId,
				divisionId: divisions.get(
					mapDivision(t.division),
				) as TournamentDivision["divisionId"],
				gender: t.gender.toLowerCase() as TournamentDivision["gender"],
				name: t.name,
				teamSize: t.teamSize,
				externalRef: t.id,
			}));
		});

	const groups = groupBy(divisionsToCreate, (td) =>
		[td.tournamentId, td.divisionId, td.gender, td.name].join(":"),
	);

	try {
		console.log(`${divisionsToCreate.length} divisions to create`);

		const result = await db
			.insert(tournamentDivisions)
			.values(
				divisionsToCreate,
				// uniqBy(divisionsToCreate, (td) =>
				//   [td.tournamentId, td.divisionId, td.gender, td.name].join(":"),
				// ),
			)
			.onConflictDoNothing()
			.returning({ id: tournamentDivisions.id });

		console.log(
			`Created ${created.length} tournaments and ${result.length} divisions`,
		);
	} catch (e) {
		console.error("FAILURE: ", e);

		console.log(
			JSON.stringify(
				Array.from(Object.entries(groups)).filter(
					([, value]) => value.length > 1,
				),
				null,
				2,
			),
		);

		return process.exit(1);
	}

	// try {
	//   await importDirectorsForYear(year, createdMap);
	// } catch (e) {
	//   console.error(e);

	//   process.exit(1);
	// }

	try {
		await importPoolsForYear(year, venues, divisions);
	} catch (e) {
		console.error(e);

		process.exit(1);
	}

	try {
		await importTeamsForYear(year, venues, divisions, levels);
	} catch (e) {
		console.error(e);

		process.exit(1);
	}

	try {
		await importGames(year);
	} catch (e) {
		console.error(e);

		process.exit(1);
	}

	await new Promise((resolve) => setTimeout(resolve, 1000));
}
