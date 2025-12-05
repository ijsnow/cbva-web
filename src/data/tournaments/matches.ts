import { mutationOptions } from "@tanstack/react-query";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { eq, sql } from "drizzle-orm";
import random from "lodash-es/random";
import z from "zod";
import { requireAuthenticated, requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	type MatchSet,
	matchSets,
	poolMatches,
	selectMatchSetSchema,
	selectTournamentDivisionSchema,
	type UpdateMatchSet,
	type UpdatePoolMatch,
} from "@/db/schema";
import { isSetDone } from "@/lib/matches";
import { notFound } from "@/lib/responses";

const findMatchSetSchema = selectMatchSetSchema.pick({
	id: true,
});

const matchSetActionSchema = selectMatchSetSchema
	.pick({
		id: true,
	})
	.extend({
		action: z.enum(["increment", "decrement"]),
		teamA: z.boolean(),
	});

export function applyMatchSetAction(
	{ action, teamA }: z.infer<typeof matchSetActionSchema>,
	current: MatchSet,
) {
	const next = { ...current };

	const diff = action === "increment" ? 1 : -1;

	if (teamA) {
		next.teamAScore = Math.max(0, next.teamAScore + diff);
	} else {
		next.teamBScore = Math.max(0, next.teamBScore + diff);
	}

	// Calculate if the set is done: a team must reach winScore AND be ahead by at least 2 points
	const isDone = isSetDone(next.teamAScore, next.teamBScore, current.winScore);

	if (isDone) {
		next.status = "completed";
		next.endedAt = new Date();
	}

	return next;
}

const updateScoreFn = createServerFn()
	.middleware([requireAuthenticated])
	.inputValidator(matchSetActionSchema)
	.handler(async ({ data: { id, teamA, action } }) => {
		const matchSet = await db.query.matchSets.findFirst({
			where: (t, { and, eq }) => and(eq(t.id, id), eq(t.status, "in_progress")),
		});

		if (!matchSet) {
			throw notFound();
		}

		const next = applyMatchSetAction({ id, teamA, action }, matchSet);

		await db.update(matchSets).set(next).where(eq(matchSets.id, id));
	});

export const updateScoreMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof matchSetActionSchema>) => {
			return await updateScoreFn({ data });
		},
	});

const startMatchFn = createServerFn()
	.middleware([requireAuthenticated])
	.inputValidator(findMatchSetSchema)
	.handler(async ({ data: { id } }) => {
		const matchSet = await db.query.matchSets.findFirst({
			where: (t, { and, eq }) => and(eq(t.id, id), eq(t.status, "not_started")),
		});

		if (!matchSet) {
			throw notFound();
		}

		await db
			.update(matchSets)
			.set({
				status: "in_progress",
				startedAt: new Date(),
			})
			.where(eq(matchSets.id, id));
	});

export const startMatchMutationOptions = (
	data: z.infer<typeof findMatchSetSchema>,
) =>
	mutationOptions({
		mutationFn: async () => {
			return await startMatchFn({ data });
		},
	});

const undoSetCompletedMatchFn = createServerFn()
	.middleware([requireAuthenticated])
	.inputValidator(
		selectMatchSetSchema.pick({
			id: true,
		}),
	)
	.handler(async ({ data: { id } }) => {
		const matchSet = await db.query.matchSets.findFirst({
			where: (t, { and, eq }) => and(eq(t.id, id), eq(t.status, "completed")),
		});

		if (!matchSet) {
			throw notFound();
		}

		const { teamAScore, teamBScore } = matchSet;
		const isTeamAWinner = teamAScore > teamBScore;

		await db
			.update(matchSets)
			.set({
				status: "in_progress",
				endedAt: null,
				teamAScore: isTeamAWinner ? Math.max(0, teamAScore - 1) : teamAScore,
				teamBScore: isTeamAWinner ? teamBScore : Math.max(0, teamBScore - 1),
			})
			.where(eq(matchSets.id, id));
	});

export const undoSetCompletedMutationOptions = (
	data: z.infer<typeof findMatchSetSchema>,
) =>
	mutationOptions({
		mutationFn: async () => {
			return await undoSetCompletedMatchFn({ data });
		},
	});

const overrideScoreSchema = selectMatchSetSchema.pick({
	id: true,
	teamAScore: true,
	teamBScore: true,
});

export const overrideScoreFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(overrideScoreSchema)
	.handler(async ({ data: { id, teamAScore, teamBScore } }) => {
		const matchSet = await db.query.matchSets.findFirst({
			where: (t, { eq }) => eq(t.id, id),
		});

		if (!matchSet) {
			throw notFound();
		}

		const isDone = isSetDone(teamAScore, teamBScore, matchSet.winScore);

		const [{ playoffMatchId, poolMatchId, status }] = await db
			.update(matchSets)
			.set({
				status: isDone ? "completed" : "in_progress",
				endedAt: isDone ? new Date() : sql`null`,
				teamAScore,
				teamBScore,
			})
			.where(eq(matchSets.id, id))
			.returning({
				playoffMatchId: matchSets.playoffMatchId,
				poolMatchId: matchSets.poolMatchId,
				status: matchSets.status,
			});

		if (status === "completed") {
			if (poolMatchId) {
				return await handleCompletedPoolMatch(poolMatchId);
			}

			if (playoffMatchId) {
				return await handleCompletedPlayoffMatch(playoffMatchId);
			}
		}
	});

const handleCompletedPoolMatch = createServerOnlyFn(
	async (poolMatchId: number) => {
		// ...
	},
);

const handleCompletedPlayoffMatch = createServerOnlyFn(
	async (playoffMatchId: number) => {
		const match = await db.query.playoffMatches.findFirst({
			columns: {
				allSetsCompleted: sql`todo: true if all sets for this match are status == completed`,
			},
			where: (t, { eq }) => eq(t.id, playoffMatchId),
		});

		// ...
	},
);

export const overrideScoreMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof overrideScoreSchema>) => {
			return await overrideScoreFn({ data });
		},
	});

export const simulateMatchesSchema = selectTournamentDivisionSchema.pick({
	tournamentId: true,
});

export const simulateMatchesFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(simulateMatchesSchema)
	.handler(async ({ data: { tournamentId } }) => {
		const divisions = await db.query.tournamentDivisions.findMany({
			with: {
				pools: {
					with: {
						matches: {
							with: {
								sets: {
									where: (t, { not, eq }) => not(eq(t.status, "completed")),
								},
							},
						},
					},
				},
				// TODO: playoffs
			},
			where: (t, { eq }) => eq(t.tournamentId, tournamentId),
		});

		const poolMatchUpdates: (Omit<UpdatePoolMatch, "id"> & { id: number })[] =
			[];
		const setUpdates: (Omit<UpdateMatchSet, "id"> & { id: number })[] = [];

		for (const division of divisions) {
			for (const pool of division.pools) {
				for (const match of pool.matches) {
					let aWins = 0;
					let bWins = 0;

					for (const set of match.sets) {
						const teamAWins = random(0, 1) === 0;

						if (teamAWins) {
							aWins += 1;
						} else {
							bWins += 1;
						}

						const teamAScore = teamAWins
							? set.winScore
							: random(0, set.winScore - 2);
						const teamBScore = !teamAWins
							? set.winScore
							: random(0, set.winScore - 2);

						setUpdates.push({
							id: set.id,
							teamAScore,
							teamBScore,
							winnerId: teamAWins ? match.teamAId : match.teamBId,
							status: "completed",
							startedAt: new Date(),
							endedAt: new Date(),
						});
					}

					poolMatchUpdates.push({
						id: match.id,
						winnerId: aWins > bWins ? match.teamAId : match.teamBId,
						status: "completed",
					});
				}
			}
		}

		await db.transaction(async (txn) => {
			await Promise.all(
				setUpdates.map(({ id, ...values }) =>
					txn.update(matchSets).set(values).where(eq(matchSets.id, id)),
				),
			);

			await Promise.all(
				poolMatchUpdates.map(({ id, ...values }) =>
					txn.update(poolMatches).set(values).where(eq(poolMatches.id, id)),
				),
			);
		});
	});

export const simulateMatchesMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof simulateMatchesSchema>) => {
			return await simulateMatchesFn({ data });
		},
	});
