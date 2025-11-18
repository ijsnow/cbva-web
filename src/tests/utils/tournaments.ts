import { inArray } from "drizzle-orm";
import { simulateMatchesFn } from "@/data/tournaments/matches";
import {
	completePoolsFn,
	createPoolMatchesFn,
	createPoolsFn,
} from "@/data/tournaments/pools";
import { calculateSeedsFn } from "@/data/tournaments/teams";
import {
	type CreateTeam,
	type Database,
	divisions,
	playerProfiles,
	teamPlayers,
	teams,
	tournamentDivisions,
	tournamentDivisionTeams,
	tournaments,
} from "@/db/schema";
import type { Gender } from "@/db/schema/shared";

export async function bootstrapTournament(
	db: Database,
	config: {
		venue: number;
		date: string;
		startTime: string;
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
	const [{ tournamentId }] = await db
		.insert(tournaments)
		.values({
			date: "2025-01-01",
			startTime: "09:00:00",
			venueId: config.venue,
		})
		.returning({
			tournamentId: tournaments.id,
		});

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

		const teamIds = await db
			.insert(teams)
			.values(
				Array.from({
					length: teamCount,
				}).map((_, i) => ({
					name: `team ${i}`,
				})),
			)
			.returning({
				id: teams.id,
			});

		for (const { id: teamId } of teamIds) {
			const profiles = await db
				.insert(playerProfiles)
				.values([
					{
						firstName: ["first", teamId, 1].join(":"),
						lastName: ["last", teamId, 1].join(":"),
						birthdate: "1999-01-01",
						gender,
					},
					{
						firstName: ["first", teamId, 2].join(":"),
						lastName: ["last", teamId, 2].join(":"),
						birthdate: "1999-01-01",
						gender,
					},
				])
				.returning({
					id: playerProfiles.id,
				});

			await db
				.insert(teamPlayers)
				.values(
					profiles.map(({ id: playerProfileId }) => ({
						teamId,
						playerProfileId,
					})),
				)
				.returning({
					id: playerProfiles.id,
				});
		}

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
