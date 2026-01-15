import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import orderBy from "lodash-es/orderBy";
import z from "zod";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	type CreateMatchRefTeam,
	type CreateMatchSet,
	matchRefTeams,
	matchSets,
	type PlayoffMatch,
	type PoolTeam,
	playoffMatches,
	selectTournamentDivisionSchema,
	tournamentDivisionTeams,
	selectMatchSetSchema,
} from "@/db/schema";
import { draftPlayoffs, getFinishForRound, seedPlayoffs } from "@/lib/playoffs";
import { isNotNull, isNotNullOrUndefined } from "@/utils/types";

export const createSetSchema = selectMatchSetSchema.pick({
	winScore: true,
	switchScore: true,
});

export const createPlayoffsSchema = selectTournamentDivisionSchema
	.pick({
		id: true,
	})
	.extend({
		teamCount: z.number(),
		wildcardCount: z.number(),
		assignCourts: z.boolean(),
		overwrite: z.boolean(),
		sets: z.array(createSetSchema),
	});

export type CreatePlayoffsParams = z.infer<typeof createPlayoffsSchema>;

export async function createPlayoffsHandler({
	data: {
		id: tournamentDivisionId,
		teamCount,
		wildcardCount,
		sets,
		assignCourts,
		overwrite,
	},
}: {
	data: CreatePlayoffsParams;
}) {
	const pools = await db.query.pools.findMany({
		with: {
			teams: {
				where: {
					finish: { isNotNull: true },
				},
			},
		},
		where: { tournamentDivisionId },
	});

	const teams = orderBy(
		pools.flatMap(({ name, teams }) =>
			teams.map((team) => ({
				id: team.id,
				finish: team.finish,
				pool: name,
			})),
		),
		["finish", "pool"],
		["asc", "asc"],
	);

	const seededTeams = seedPlayoffs(teams.length, pools.length).map(
		({ pool, seed }) => pools[pool].teams.find(({ finish }) => finish === seed),
	);

	if (overwrite) {
		// Delete existing playoff matches if overwrite is true
		await db
			.delete(playoffMatches)
			.where(eq(playoffMatches.tournamentDivisionId, tournamentDivisionId));
	}

	const bracket = draftPlayoffs(teamCount + wildcardCount);

	await db.transaction(async (txn) => {
		const roundIds: (number | null)[][] = [];

		let matchNumber = 1;

		await Promise.all(
			seededTeams
				.map((team, i) =>
					team
						? txn
								.update(tournamentDivisionTeams)
								.set({
									playoffsSeed: i + 1 <= teamCount ? i + 1 : null,
								})
								.where(eq(tournamentDivisionTeams.id, team.teamId))
						: null,
				)
				.filter(isNotNull),
		);

		const createdMatches: Pick<
			PlayoffMatch,
			| "id"
			| "round"
			| "teamAId"
			| "teamBId"
			| "teamAPreviousMatchId"
			| "teamBPreviousMatchId"
		>[] = [];

		const refTeamsToCreate: CreateMatchRefTeam[] = [];

		// Track courts for each match to propagate through the bracket
		const matchCourts: Map<number, string | null> = new Map();
		// Track the highest seed (lowest number) on each match's track for court determination
		const matchTrackSeed: Map<number, number> = new Map();

		// Helper: find the bye team seed that a match at (roundIndex, matchIndex) feeds into
		// by tracing forward through the bracket
		const findByeTeamForTrack = (
			roundIndex: number,
			matchIndex: number,
		): number | null => {
			let currentRound = roundIndex;
			let currentMatchIdx = matchIndex;

			while (currentRound < bracket.length - 1) {
				const nextRound = bracket[currentRound + 1];

				// Find which match in next round this feeds into
				const nextMatchIdx = nextRound.findIndex(
					(m) =>
						m && (m.aFrom === currentMatchIdx || m.bFrom === currentMatchIdx),
				);

				if (nextMatchIdx === -1) break;

				const nextMatch = nextRound[nextMatchIdx];
				if (!nextMatch) break;

				// Check if the opponent side has a bye (direct seed)
				const comesFromA = nextMatch.aFrom === currentMatchIdx;

				if (comesFromA && isNotNullOrUndefined(nextMatch.bSeed)) {
					// The B side has a bye - return that seed
					return nextMatch.bSeed;
				}

				if (!comesFromA && isNotNullOrUndefined(nextMatch.aSeed)) {
					// The A side has a bye - return that seed
					return nextMatch.aSeed;
				}

				// No bye at this level, continue tracing forward
				currentRound++;
				currentMatchIdx = nextMatchIdx;
			}

			return null; // No bye found on this track
		};

		for (const [i, round] of bracket.entries()) {
			roundIds[i] = [];

			const loserFinish = getFinishForRound(bracket.length - 1 - i);

			for (const [matchIndex, match] of round.entries()) {
				if (match) {
					const teamA: PoolTeam | null | undefined =
						isNotNullOrUndefined(match.aSeed) && match.aSeed <= teamCount
							? seededTeams[match.aSeed - 1]
							: null;

					const teamB: PoolTeam | null | undefined =
						isNotNullOrUndefined(match.bSeed) && match.bSeed <= teamCount
							? seededTeams[match.bSeed - 1]
							: null;

					// Determine court based on the highest seed in this "track" of the bracket
					// For first round, look forward to find the bye team this match feeds into
					// For later rounds, propagate court from the previous match on the higher seed's path
					let court: string | null = null;
					let trackSeed: number = Number.POSITIVE_INFINITY;

					if (assignCourts) {
						if (i === 0) {
							// First round: find the bye team this track leads to and use their pool's court
							const byeTeamSeed = findByeTeamForTrack(i, matchIndex);

							if (
								byeTeamSeed &&
								byeTeamSeed <= teamCount &&
								seededTeams[byeTeamSeed - 1]
							) {
								const byeTeam = seededTeams[byeTeamSeed - 1];
								const pool = pools.find((p) => p.id === byeTeam?.poolId);
								court = pool?.court ?? null;
								trackSeed = byeTeamSeed;
							}

							// Fallback: if no bye team found, use the higher seed's pool
							if (!court) {
								const higherSeed = Math.min(
									match.aSeed ?? Number.POSITIVE_INFINITY,
									match.bSeed ?? Number.POSITIVE_INFINITY,
								);
								const higherSeedTeam =
									match.aSeed === higherSeed ? teamA : teamB;
								if (higherSeedTeam) {
									const pool = pools.find(
										(p) => p.id === higherSeedTeam.poolId,
									);
									court = pool?.court ?? null;
									trackSeed = higherSeed;
								}
							}
						} else {
							// Later rounds: determine higher seed path by comparing track seeds
							const aFromMatchId = isNotNullOrUndefined(match.aFrom)
								? roundIds[i - 1][match.aFrom]
								: null;
							const bFromMatchId = isNotNullOrUndefined(match.bFrom)
								? roundIds[i - 1][match.bFrom]
								: null;

							const aTrackSeed = aFromMatchId
								? (matchTrackSeed.get(aFromMatchId) ?? Number.POSITIVE_INFINITY)
								: (match.aSeed ?? Number.POSITIVE_INFINITY);
							const bTrackSeed = bFromMatchId
								? (matchTrackSeed.get(bFromMatchId) ?? Number.POSITIVE_INFINITY)
								: (match.bSeed ?? Number.POSITIVE_INFINITY);

							const higherSeedIsA = aTrackSeed <= bTrackSeed;
							trackSeed = Math.min(aTrackSeed, bTrackSeed);

							const previousMatchId = higherSeedIsA
								? aFromMatchId
								: bFromMatchId;

							if (previousMatchId) {
								court = matchCourts.get(previousMatchId) ?? null;
							} else {
								// Bye case: higher seed has no previous match
								// Use the bye team's pool court
								const higherSeedTeam = higherSeedIsA ? teamA : teamB;
								if (higherSeedTeam) {
									const pool = pools.find(
										(p) => p.id === higherSeedTeam.poolId,
									);
									court = pool?.court ?? null;
								}
							}
						}
					}

					const [
						{
							id,
							round: roundIndex,
							teamAId,
							teamBId,
							teamAPreviousMatchId,
							teamBPreviousMatchId,
						},
					] = await txn
						.insert(playoffMatches)
						.values({
							tournamentDivisionId,
							round: i,
							matchNumber,
							teamAId: teamA?.teamId,
							teamAPoolId: teamA?.poolId,
							teamAPreviousMatchId:
								isNotNullOrUndefined(match.aFrom) && i > 0
									? roundIds[i - 1][match.aFrom]
									: null,
							teamBId: teamB?.teamId,
							teamBPoolId: teamB?.poolId,
							teamBPreviousMatchId:
								isNotNullOrUndefined(match.bFrom) && i > 0
									? roundIds[i - 1][match.bFrom]
									: null,
							loserFinish,
							court,
						})
						.returning({
							id: playoffMatches.id,
							round: playoffMatches.round,
							teamAId: playoffMatches.teamAId,
							teamBId: playoffMatches.teamBId,
							teamAPreviousMatchId: playoffMatches.teamAPreviousMatchId,
							teamBPreviousMatchId: playoffMatches.teamBPreviousMatchId,
						});

					roundIds[i].push(id);
					matchCourts.set(id, court);
					matchTrackSeed.set(id, trackSeed);

					createdMatches.push({
						id,
						round: roundIndex,
						teamAId,
						teamBId,
						teamAPreviousMatchId,
						teamBPreviousMatchId,
					});

					if (roundIndex === 1 && isNotNull(teamAId) && !isNotNull(teamBId)) {
						refTeamsToCreate.push({
							teamId: teamAId,
							playoffMatchId: teamBPreviousMatchId,
						});
					} else if (
						roundIndex === 1 &&
						!isNotNull(teamAId) &&
						isNotNull(teamBId)
					) {
						refTeamsToCreate.push({
							teamId: teamBId,
							playoffMatchId: teamAPreviousMatchId,
						});
					}

					matchNumber += 1;
				} else {
					roundIds[i].push(null);
				}
			}
		}

		if (refTeamsToCreate.length) {
			await txn.insert(matchRefTeams).values(refTeamsToCreate);
		}

		// Set nextMatchId for all playoff matches
		for (let i = 0; i < bracket.length - 1; i++) {
			const currentRound = bracket[i];
			const nextRound = bracket[i + 1];

			for (let j = 0; j < currentRound.length; j++) {
				const currentMatch = currentRound[j];
				const currentMatchId = roundIds[i][j];

				if (currentMatch && currentMatchId) {
					// Find which match in the next round this match feeds into
					const nextMatchIndex = nextRound.findIndex(
						(nextMatch) =>
							nextMatch && (nextMatch.aFrom === j || nextMatch.bFrom === j),
					);

					if (nextMatchIndex !== -1) {
						const nextMatchId = roundIds[i + 1][nextMatchIndex];

						if (nextMatchId) {
							await txn
								.update(playoffMatches)
								.set({ nextMatchId })
								.where(eq(playoffMatches.id, currentMatchId));
						}
					}
				}
			}
		}

		const matchSetValues: CreateMatchSet[] = roundIds
			.flatMap((ids) => ids.filter(isNotNull))
			.map((id) => id)
			.flatMap((playoffMatchId) =>
				sets.map((set, i) => ({ ...set, playoffMatchId, setNumber: i + 1 })),
			);

		await txn.insert(matchSets).values(matchSetValues);
	});

	return { success: true };
}

export const createPlayoffsFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(createPlayoffsSchema)
	.handler(createPlayoffsHandler);

export const createPlayoffsMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof createPlayoffsSchema>) =>
			createPlayoffsFn({ data }),
	});
