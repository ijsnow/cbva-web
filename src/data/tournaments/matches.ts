import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { eq, sql } from "drizzle-orm";
import { mutationOptions } from "@tanstack/react-query";

import { requireAuthenticated } from "@/auth/shared";
import { db } from "@/db/connection";
import { MatchSet, matchSets, selectMatchSetSchema } from "@/db/schema";
import { notFound } from "@/lib/responses";

const findMatchSetSchema = selectMatchSetSchema.pick({
  id: true
})

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
	// teamAId: number | null,
	// teamBId: number | null,
) {
	const next = { ...current };

	const diff = action === "increment" ? 1 : -1;

	if (teamA) {
		next.teamAScore = Math.max(0, next.teamAScore + diff);
	} else {
		next.teamBScore = Math.max(0, next.teamBScore + diff);
	}

	// Calculate if the set is done: a team must reach winScore AND be ahead by at least 2 points
	const isDone =
		(next.teamAScore >= current.winScore &&
			next.teamAScore - next.teamBScore >= 2) ||
		(next.teamBScore >= current.winScore &&
			next.teamBScore - next.teamAScore >= 2);

	if (isDone) {
		next.status = "completed";
		next.endedAt = new Date();
		// next.winnerId = next.teamAScore > next.teamBScore ? teamAId : teamBId;
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

		await db
			.update(matchSets)
			.set(next)
			.where(eq(matchSets.id, id));
	});

export const updateScoreMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof matchSetActionSchema>) => {
			return await updateScoreFn({ data });
		},
	});

const startMatchFn = createServerFn()
	.middleware([requireAuthenticated])
	.inputValidator(
		findMatchSetSchema,
	)
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

export const startMatchMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof findMatchSetSchema>) => {
			return await startMatchFn({ data });
		},
	});

const restartMatchFn = createServerFn()
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

export const restartMatchMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof findMatchSetSchema>) => {
			return await restartMatchFn({ data });
		},
	});
