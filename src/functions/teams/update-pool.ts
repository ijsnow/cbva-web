import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	PoolTeam,
	poolTeams,
	selectTournamentDivisionTeamSchema,
	TournamentDivisionTeam,
	Transaction,
} from "@/db/schema";
import { notFound } from "@/lib/responses";
import { isNotNullOrUndefined } from "@/utils/types";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { eq, max } from "drizzle-orm";
import { orderBy, range } from "lodash-es";
import z from "zod";
import { editSeedTransaction } from "./edit-seed";

export const updatePoolSchema = selectTournamentDivisionTeamSchema
	.pick({
		id: true,
	})
	.extend({
		poolId: z.number(),
		seed: z.number().nullable().optional(),
	});

export const updatePoolTransaction = createServerOnlyFn(
	async (
		txn: Transaction,
		team: TournamentDivisionTeam & { poolTeam: PoolTeam },
		poolId: number,
		desiredSeed?: number | null,
	) => {
		const previousPoolId = team.poolTeam.poolId;

		const maxSeedResult = await txn
			.select({ maxSeed: max(poolTeams.seed) })
			.from(poolTeams)
			.where(eq(poolTeams.poolId, poolId));

		const nextSeed = (maxSeedResult[0]?.maxSeed ?? 0) + 1;

		await txn
			.update(poolTeams)
			.set({
				poolId,
				seed: nextSeed,
			})
			.where(eq(poolTeams.teamId, team.id));

		if (isNotNullOrUndefined(desiredSeed)) {
			// Manually setting seed
			await editSeedTransaction(
				txn,
				{
					...team,
					poolTeam: {
						...team.poolTeam,
						poolId,
						seed: nextSeed,
					},
				},
				desiredSeed,
				"pool",
			);
		} else {
			// recalculating pool seeds based on division seeds
			const teams = await txn.query.poolTeams.findMany({
				with: {
					team: true,
				},
				where: (table, { eq }) => eq(table.poolId, poolId),
			});

			await Promise.all(
				orderBy(teams, [(t) => t.team.seed], ["asc"]).map(({ id }, idx) =>
					txn
						.update(poolTeams)
						.set({
							seed: idx + 1,
						})
						.where(eq(poolTeams.id, id)),
				),
			);
		}

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
	},
);

export const updatePool = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(updatePoolSchema)
	.handler(
		async ({
			data: { id: tournamentDivisionTeamId, poolId, seed: desiredSeed },
		}) => {
			const targetTeam = await db.query.tournamentDivisionTeams.findFirst({
				with: {
					poolTeam: true,
				},
				where: (table, { eq }) => eq(table.id, tournamentDivisionTeamId),
			});

			if (!targetTeam) {
				throw notFound();
			}

			await db.transaction((txn) =>
				updatePoolTransaction(txn, targetTeam, poolId, desiredSeed),
			);

			return {
				success: true,
			};
		},
	);

export const updatePoolMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof updatePoolSchema>) =>
			updatePool({ data }),
	});
