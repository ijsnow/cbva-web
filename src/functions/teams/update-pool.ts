import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { poolTeams, selectTournamentDivisionTeamSchema } from "@/db/schema";
import { notFound } from "@/lib/responses";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq, max } from "drizzle-orm";
import { range } from "lodash-es";
import z from "zod";

export const updatePoolSchema = selectTournamentDivisionTeamSchema
	.pick({
		id: true,
	})
	.extend({
		poolId: z.number(),
		// TODO: set desired seed in new pool if this exsits, otherwise recalculate pool seeds
		seed: z.number().nullable().optional(),
	});

export const updatePool = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(updatePoolSchema)
	.handler(async ({ data: { id: tournamentDivisionTeamId, poolId } }) => {
		const targetTeam = await db.query.tournamentDivisionTeams.findFirst({
			where: (table, { eq }) => eq(table.id, tournamentDivisionTeamId),
		});

		if (!targetTeam) {
			throw notFound();
		}

		// Get the current pool team record to find the previous pool
		const currentPoolTeam = await db.query.poolTeams.findFirst({
			where: (table, { eq }) => eq(table.teamId, tournamentDivisionTeamId),
		});

		const previousPoolId = currentPoolTeam?.poolId;

		const maxSeedResult = await db
			.select({ maxSeed: max(poolTeams.seed) })
			.from(poolTeams)
			.where(eq(poolTeams.poolId, poolId));

		const nextSeed = (maxSeedResult[0]?.maxSeed ?? 0) + 1;

		await db.transaction(async (txn) => {
			await txn
				.update(poolTeams)
				.set({
					poolId,
					seed: nextSeed,
				})
				.where(eq(poolTeams.teamId, tournamentDivisionTeamId));

			// If the team was in a different pool, resequence the seeds in the previous pool
			if (previousPoolId && previousPoolId !== poolId) {
				const remainingTeams = await txn.query.poolTeams.findMany({
					where: (table, { eq }) => eq(table.poolId, previousPoolId),
					orderBy: (table, { asc }) => [asc(table.seed)],
				});

				await Promise.all(
					range(0, remainingTeams.length).map((i) =>
						txn
							.update(poolTeams)
							.set({ seed: i + 1 })
							.where(eq(poolTeams.id, remainingTeams[i].id)),
					),
				);
			}
		});

		return {
			success: true,
		};
	});

export const updatePoolMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof updatePoolSchema>) =>
			updatePool({ data }),
	});
