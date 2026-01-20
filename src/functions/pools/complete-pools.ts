import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq, inArray } from "drizzle-orm";
import range from "lodash-es/range";
import z from "zod";

import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	type CreateMatchSet,
	type CreatePoolMatch,
	type CreatePoolTeam,
	matchSets,
	type PoolTeam,
	poolMatches,
	pools,
	poolTeams,
	selectPoolSchema,
	selectTournamentDivisionSchema,
} from "@/db/schema";
import { matchRefTeams } from "@/db/schema/match-ref-teams";
import { getPoolStats } from "@/hooks/matches";
import { badRequest, internalServerError } from "@/lib/responses";
import { snake } from "@/lib/snake-draft";

export const completePoolsSchema = selectTournamentDivisionSchema.pick({
	id: true,
});

export const completePoolsFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(completePoolsSchema)
	.handler(async ({ data: { id: tournamentDivisionId } }) => {
		// Get all pools for this tournament division with their teams and completed matches
		const poolsData = await db._query.pools.findMany({
			with: {
				teams: {
					columns: {
						id: true,
						teamId: true,
						seed: true,
						finish: true,
					},
				},
				matches: {
					with: {
						sets: {
							columns: {
								teamAScore: true,
								teamBScore: true,
								winnerId: true,
							},
						},
					},
					columns: {
						id: true,
						teamAId: true,
						teamBId: true,
						winnerId: true,
					},
				},
			},
			where: (p, { eq }) => eq(p.tournamentDivisionId, tournamentDivisionId),
		});

		const updates: Pick<PoolTeam, "id" | "finish">[] = [];

		// Calculate finish positions for each pool
		for (const pool of poolsData) {
			const stats = getPoolStats({
				teams: pool.teams,
				matches: pool.matches,
			});

			if (!stats) {
				// Skip pools without completed matches
				continue;
			}

			// Update finish positions for each team in the pool
			for (const team of pool.teams) {
				const teamStats = stats[team.teamId];

				if (teamStats) {
					updates.push({ id: team.id, finish: teamStats.rank });
				}
			}
		}

		await db.transaction(async (txn) => {
			await Promise.all(
				updates.map(({ id, ...values }) =>
					txn.update(poolTeams).set(values).where(eq(poolTeams.id, id)),
				),
			);
		});

		return {
			success: true as true,
		};
	});

export const completePoolsMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof completePoolsSchema>) =>
			completePoolsFn({ data }),
	});
