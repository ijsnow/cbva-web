import { eq, inArray } from "drizzle-orm";
import { simulateMatchesFn } from "@/data/tournaments/matches";
import {
	type CreatePlayoffsParams,
	createPlayoffsFn,
} from "@/data/tournaments/playoffs";
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
	playoffMatches,
	teamPlayers,
	teams,
	tournamentDirectors,
	tournamentDivisions,
	tournamentDivisionTeams,
	tournaments,
	type UpdatePlayoffMatch,
} from "@/db/schema";
import type { Gender } from "@/db/schema/shared";
import { isNotNullOrUndefined } from "@/utils/types";
import { getQualifiedLevels } from "./divisions";
import { createDirectors, createTeams } from "./users";
import { getDefaultVenue } from "./venues";

async function getWildcardTeams(db: Database, divisionId: number) {
	const matches = await db.query.playoffMatches.findMany({
		columns: {
			teamAId: true,
			teamBId: true,
		},
		where: (t, { and, eq }) => and(eq(t.tournamentDivisionId, divisionId)),
	});

	const playoffTeamIds = matches.flatMap(({ teamAId, teamBId }) =>
		[teamAId, teamBId].filter(isNotNullOrUndefined),
	);

	return (
		await db.query.tournamentDivisionTeams.findMany({
			columns: { id: true },
			where: (t, { and, eq, notInArray }) =>
				and(
					eq(t.tournamentDivisionId, divisionId),
					notInArray(t.id, playoffTeamIds),
				),
		})
	).map(({ id }) => id);
}

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
		poolMatches?: boolean;
		simulatePoolMatches?: boolean;
		playoffConfig?: Omit<CreatePlayoffsParams, "id"> & {
			assignWildcards: boolean;
		};
		demo?: boolean;
		visible?: boolean;
	},
) {
	const venueId = config.venue ?? (await getDefaultVenue(db)).id;

	const [{ tournamentId }] = await db
		.insert(tournaments)
		.values({
			date: "2025-01-01",
			startTime: "09:00:00",
			venueId,
			visible: config.visible ?? true,
			demo: config.demo,
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
	}

	await calculateSeedsFn({
		data: { id: tournamentId, overwrite: false },
	});

	for (const [i, { pools: poolCount }] of config.divisions.entries()) {
		await createPoolsFn({
			data: { id: divisionIds[i], count: poolCount, overwrite: false },
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

		if (config.playoffConfig) {
			await createPlayoffsFn({
				data: { id, ...config.playoffConfig },
			});

			if (config.playoffConfig.assignWildcards) {
				const wildcardTeams = await getWildcardTeams(db, id);

				const matches = await db.query.playoffMatches.findMany({
					where: (t, { and, or, eq, isNull, isNotNull }) =>
						and(
							eq(t.tournamentDivisionId, id),
							eq(t.round, 0),
							or(
								and(isNull(t.teamAId), isNotNull(t.teamBId)),
								and(isNotNull(t.teamAId), isNull(t.teamBId)),
							),
						),
				});

				const updates: (Omit<UpdatePlayoffMatch, "id"> & { id: number })[] =
					matches.map(({ id, teamAId, teamBId }) => ({
						id,
						teamAId: isNotNullOrUndefined(teamAId)
							? teamAId
							: wildcardTeams.pop(),
						teamBId: isNotNullOrUndefined(teamBId)
							? teamBId
							: wildcardTeams.pop(),
					}));

				await Promise.all(
					updates.map(({ id, ...update }) =>
						db
							.update(playoffMatches)
							.set(update)
							.where(eq(playoffMatches.id, id)),
					),
				);
			}
		}
	}

	return {
		id: tournamentId,
		divisions: divisionIds,
		// teams: teamIds,
		// pools: poolIds,
	};
}
