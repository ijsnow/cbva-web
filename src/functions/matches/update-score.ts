import { requireAuthenticated } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	matchRefs,
	MatchSet,
	matchSets,
	playoffMatches,
	poolMatches,
	selectMatchSetSchema,
	tournamentDivisionTeams,
	Transaction,
	UpdatePlayoffMatch,
} from "@/db/schema";
import { isSetDone } from "@/lib/matches";
import { assertFound, internalServerError } from "@/lib/responses";
import { dbg } from "@/utils/dbg";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";

export function getWinnerId(
	{ teamAId, teamBId }: { teamAId: number; teamBId: number },
	sets: MatchSet[],
) {
	const { winnerId } = sets.reduce(
		(memo, set) => {
			if (set.teamAScore > set.teamBScore) {
				memo.aWins += 1;

				if (memo.aWins > Math.floor(sets.length / 2)) {
					memo.winnerId = teamAId;
				}
			} else if (set.teamAScore < set.teamBScore) {
				memo.bWins += 1;

				if (memo.bWins > Math.floor(sets.length / 2)) {
					memo.winnerId = teamBId;
				}
			}

			return memo;
		},
		{ winnerId: null as number | null, aWins: 0, bWins: 0 },
	);

	return winnerId;
}

export const handleCompletedPoolMatchSet = createServerOnlyFn(
	async (txn: Transaction, poolMatchId: number) => {
		const match = await txn.query.poolMatches.findFirst({
			with: {
				sets: true,
			},
			where: { id: poolMatchId },
		});

		if (!match?.teamAId || !match?.teamBId) {
			throw internalServerError(
				`expected to find match in handleCompletedPoolMatchSet(${poolMatchId})`,
			);
		}

		const winnerId = getWinnerId(
			{
				teamAId: match.teamAId,
				teamBId: match.teamBId,
			},
			match.sets,
		);

		if (!winnerId) {
			return {
				success: true,
				data: {
					winnerId: undefined,
				},
			};
		}

		await txn
			.update(poolMatches)
			.set({
				winnerId,
				status: "completed",
			})
			.where(eq(poolMatches.id, poolMatchId));

		return {
			success: true,
			data: {
				winnerId,
			},
		};
	},
);

export const handleCompletedPlayoffMatchSet = createServerOnlyFn(
	async (txn: Transaction, playoffMatchId: number) => {
		const match = await txn.query.playoffMatches.findFirst({
			with: {
				sets: true,
				nextMatch: true,
			},
			where: { id: playoffMatchId },
		});

		if (!match?.teamAId || !match?.teamBId) {
			throw internalServerError(
				`expected to find match in handleCompletedPlayoffMatchSet(${playoffMatchId})`,
			);
		}

		const winnerId = getWinnerId(
			{
				teamAId: match.teamAId,
				teamBId: match.teamBId,
			},
			match.sets,
		);

		if (!winnerId) {
			return {
				success: true,
				data: {
					winnerId: undefined,
				},
			};
		}

		const matchUpdates: (Omit<UpdatePlayoffMatch, "id"> & { id: number })[] = [
			{
				id: playoffMatchId,
				winnerId,
				status: "completed",
			},
		];

		if (match.nextMatch) {
			matchUpdates.push({
				id: match.nextMatch.id,
				teamAId:
					match.nextMatch.teamAPreviousMatchId === playoffMatchId
						? winnerId
						: undefined,
				teamBId:
					match.nextMatch.teamBPreviousMatchId === playoffMatchId
						? winnerId
						: undefined,
			});
		}

		await Promise.all(
			matchUpdates.map(({ id, ...update }) =>
				txn.update(playoffMatches).set(update).where(eq(playoffMatches.id, id)),
			),
		);

		const loserId = winnerId === match.teamAId ? match.teamBId : match.teamAId;

		if (match.nextMatchId) {
			await txn
				.delete(matchRefs)
				.where(eq(matchRefs.playoffMatchId, match.nextMatchId));

			// Look up the losing team's players to create ref assignments
			const losingTeam = await txn.query.tournamentDivisionTeams.findFirst({
				with: {
					players: {
						with: {
							profile: true,
						},
					},
				},
				where: { id: loserId },
			});

			if (losingTeam && losingTeam.players.length > 0) {
				await txn.insert(matchRefs).values(
					losingTeam.players.map(({ profile }) => ({
						teamId: loserId,
						profileId: profile.id,
						playoffMatchId: match.nextMatchId,
					})),
				);
			}

			await txn
				.update(tournamentDivisionTeams)
				.set({ finish: dbg(match.loserFinish) })
				.where(eq(tournamentDivisionTeams.id, loserId));
		} else {
			// This is the finals match - set finish for both teams
			// Winner gets 1st place, loser gets 2nd place
			await txn
				.update(tournamentDivisionTeams)
				.set({ finish: 1 })
				.where(eq(tournamentDivisionTeams.id, winnerId));

			await txn
				.update(tournamentDivisionTeams)
				.set({ finish: 2 })
				.where(eq(tournamentDivisionTeams.id, loserId));
		}

		return {
			success: true,
			data: {
				winnerId,
			},
		};
	},
);

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
		const matchSet = await db._query.matchSets.findFirst({
			where: (t, { and, eq }) => and(eq(t.id, id), eq(t.status, "in_progress")),
		});

		assertFound(matchSet);

		const next = applyMatchSetAction({ id, teamA, action }, matchSet);

		const { playoffMatchId, poolMatchId } = matchSet;

		await db.transaction(async (txn) => {
			await txn.update(matchSets).set(next).where(eq(matchSets.id, id));

			if (next.status === "completed") {
				if (poolMatchId) {
					return await handleCompletedPoolMatchSet(txn, poolMatchId);
				}

				if (playoffMatchId) {
					return await handleCompletedPlayoffMatchSet(txn, playoffMatchId);
				}
			}
		});
	});

export const updateScoreMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof matchSetActionSchema>) => {
			return await updateScoreFn({ data });
		},
	});
