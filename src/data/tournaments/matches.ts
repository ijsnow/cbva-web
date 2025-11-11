import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { eq, sql } from "drizzle-orm";

import { requireAuthenticated } from "@/auth/shared";
import { db } from "@/db/connection";
import { MatchSet, matchSets, selectMatchSetSchema } from "@/db/schema";
import { mutationOptions } from "@tanstack/react-query";

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

	// TODO: calculate isDone
	const isDone = false

	if (isDone) {
	  next.status === 'completed'
		next.endedAt = new Date()
	}

	return next;
}

const updateScoreFn = createServerFn()
	.middleware([requireAuthenticated])
	.inputValidator(matchSetActionSchema)
	.handler(async ({ data: { id, teamA, action } }) => {
		// TODO: referees

		const scoreColumn = teamA ? "team_a_score" : "team_b_score";
		const operation = action === "increment" ? "+" : "-";

		await db
			.update(matchSets)
			.set(
				teamA
					? {
							teamAScore: sql`${sql.identifier(scoreColumn)} ${sql.raw(operation)} 1`,
						}
					: {
							teamBScore: sql`${sql.identifier(scoreColumn)} ${sql.raw(operation)} 1`,
						},
			)
			.where(eq(matchSets.id, id));
	});

export const updateScoreMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof matchSetActionSchema>) => {
			return await updateScoreFn({ data });
		},
	});
