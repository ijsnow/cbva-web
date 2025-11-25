import { inArray } from "drizzle-orm";
import { simulateMatchesFn } from "@/data/tournaments/matches";
import {
	completePoolsFn,
	createPoolMatchesFn,
	createPoolsFn,
} from "@/data/tournaments/pools";
import { calculateSeedsFn } from "@/data/tournaments/teams";
import {
	type Database,
	divisions,
	playerProfiles,
	teamPlayers,
	teams,
	tournamentDirectors,
	tournamentDivisions,
	tournamentDivisionTeams,
	tournaments,
} from "@/db/schema";
import type { Gender } from "@/db/schema/shared";
import { getQualifiedLevels } from "./divisions";
import { createDirectors, createTeams } from "./users";
import { getDefaultVenue } from "./venues";

export async function bootstrapTournament(
	db: Database,
	config: {
		venue?: number;
		date: string;
		startTime: string;
		directors?: { id: number; order?: number }[];
		divisions: {
			division: string;
			gender: Gender;
			teams: number;
			pools: number;
		}[];
	} & (
		| { poolMatches: false; simulatePoolMatches: false }
		| { poolMatches: true; simulatePoolMatches: true }
	),
) {
	const venueId = config.venue ?? (await getDefaultVenue(db)).id;

	const [{ tournamentId }] = await db
		.insert(tournaments)
		.values({
			date: "2025-01-01",
			startTime: "09:00:00",
			venueId,
		})
		.returning({
			tournamentId: tournaments.id,
		});

	const directors =
		config.directors ??
		(await createDirectors(db, 1)).map(({ id }, i) => ({ id, order: i }));

	await db.insert(tournamentDirectors).values(
		directors.map(({ id, order }) => ({
			tournamentId,
			directorId: id,
			order,
		})),
	);

	const configDivisions = config.divisions.map(({ division }) => division);

	const divisionValues = await db
		.select()
		.from(divisions)
		.where(inArray(divisions.name, configDivisions));

	const divisionIds: number[] = [];

	for (const {
		division,
		gender,
		teams: teamCount,
		pools: poolCount,
	} of config.divisions) {
		const divisionId = divisionValues.find(({ name }) => name === division)?.id;

		if (!divisionId) {
			throw new Error(`no division with name: ${division}`);
		}

		const [{ id: tournamentDivisionId }] = await db
			.insert(tournamentDivisions)
			.values({
				tournamentId,
				divisionId,
				gender,
				teamSize: 2,
			})
			.returning({
				id: tournamentDivisions.id,
			});

		divisionIds.push(tournamentDivisionId);

		const levels = await getQualifiedLevels(db, division);

		const teamIds = await createTeams(db, {
			count: teamCount,
			levels: levels.map(({ name }) => name),
			gender,
		});

		await db.insert(tournamentDivisionTeams).values(
			teamIds.map(({ id: teamId }) => ({
				tournamentDivisionId,
				teamId,
				status: "confirmed" as const,
			})),
		);

		await calculateSeedsFn({
			data: { id: tournamentDivisionId, overwrite: false },
		});

		await createPoolsFn({
			data: { id: tournamentDivisionId, count: poolCount, overwrite: false },
		});
	}

	await createPoolMatchesFn({
		data: { tournamentId, overwrite: false },
	});

	if (config.simulatePoolMatches) {
		await simulateMatchesFn({ data: { tournamentId } });
	}

	for (const id of divisionIds) {
		await completePoolsFn({
			data: { id },
		});
	}

	return {
		id: tournamentId,
		divisions: divisionIds,
		// teams: teamIds,
		// pools: poolIds,
	};
}
