import { db } from "@/db/connection";
import { matchSets, selectMatchSetSchema } from "@/db/schema";
import { isSetDone } from "@/lib/matches";
import { assertFound } from "@/lib/responses";
import { eq, sql } from "drizzle-orm";
import {
	handleCompletedPlayoffMatchSet,
	handleCompletedPoolMatchSet,
} from "./update-score";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { requirePermissions } from "@/auth/shared";
import type z from "zod";
import { mutationOptions } from "@tanstack/react-query";

const overrideScoreSchema = selectMatchSetSchema.pick({
	id: true,
	teamAScore: true,
	teamBScore: true,
});

export const overrideScoreHandler = createServerOnlyFn(
	async ({
		id,
		teamAScore,
		teamBScore,
	}: z.infer<typeof overrideScoreSchema>) => {
		const matchSet = await db.query.matchSets.findFirst({
			with: {
				poolMatch: {
					columns: {
						teamAId: true,
						teamBId: true,
					},
				},
				playoffMatch: {
					columns: {
						teamAId: true,
						teamBId: true,
					},
				},
			},
			where: { id },
		});

		assertFound(matchSet);

		const isDone = isSetDone(teamAScore, teamBScore, matchSet.winScore);

		const teamAId =
			matchSet.poolMatch?.teamAId ?? matchSet.playoffMatch?.teamAId;
		const teamBId =
			matchSet.poolMatch?.teamBId ?? matchSet.playoffMatch?.teamBId;

		return await db.transaction(async (txn) => {
			const [{ playoffMatchId, poolMatchId, status }] = await db
				.update(matchSets)
				.set({
					status: isDone ? "completed" : "in_progress",
					endedAt: isDone ? new Date() : sql`null`,
					teamAScore,
					teamBScore,
					winnerId: isDone
						? teamAScore > teamBScore
							? teamAId
							: teamBId
						: null,
				})
				.where(eq(matchSets.id, id))
				.returning({
					playoffMatchId: matchSets.playoffMatchId,
					poolMatchId: matchSets.poolMatchId,
					status: matchSets.status,
				});

			if (status === "completed") {
				if (poolMatchId) {
					return await handleCompletedPoolMatchSet(txn, poolMatchId);
				}

				if (playoffMatchId) {
					return await handleCompletedPlayoffMatchSet(txn, playoffMatchId);
				}
			}

			return {
				success: true,
				data: {
					winnerId: undefined,
				},
			};
		});
	},
);

export const overrideScoreFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(overrideScoreSchema)
	.handler(async ({ data }) => overrideScoreHandler(data));

export const overrideScoreMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof overrideScoreSchema>) => {
			return await overrideScoreFn({ data });
		},
	});
