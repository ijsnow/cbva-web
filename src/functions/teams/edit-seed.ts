import { db } from "@/db/connection";
import {
	poolTeams,
	selectTournamentDivisionTeamSchema,
	tournamentDivisionTeams,
} from "@/db/schema";
import { notFound } from "@/lib/responses";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, gte, lt, lte, gt, sql, not } from "drizzle-orm";
import z from "zod";

export const editSeedSchema = selectTournamentDivisionTeamSchema
	.pick({
		id: true,
	})
	.extend({
		seed: z.number().int().positive(),
		target: z.enum(["division", "pool"]),
	});

export const editSeed = createServerFn()
	.inputValidator(editSeedSchema)
	.handler(async ({ data: { id, seed, target } }) => {
		const targetTeam = await db.query.tournamentDivisionTeams.findFirst({
			with: {
				poolTeam: true,
			},
			where: (table, { eq }) => eq(table.id, id),
		});

		if (!targetTeam) {
			throw notFound();
		}

		const currentSeed =
			target === "division" ? targetTeam.seed : targetTeam.poolTeam.seed;

		console.log({ id, seed, target, currentSeed });

		await db.transaction(async (txn) => {
			const groupFilter =
				target === "division"
					? eq(
							tournamentDivisionTeams.tournamentDivisionId,
							targetTeam.tournamentDivisionId,
						)
					: eq(poolTeams.poolId, targetTeam.poolTeam.poolId);

			const targetTable =
				target === "division" ? tournamentDivisionTeams : poolTeams;

			const targetId =
				target === "division" ? targetTeam.id : targetTeam.poolTeam.id;

			if (currentSeed) {
				if (seed < currentSeed) {
					// Moving up (to a lower seed number): shift teams down
					// Teams with seeds >= new seed AND < current seed move down by 1
					await txn
						.update(targetTable)
						.set({
							seed: sql`${targetTable.seed} + 1`,
						})
						.where(
							and(
								groupFilter,
								not(eq(targetTable.id, targetId)),
								gte(targetTable.seed, seed),
								lt(targetTable.seed, currentSeed),
							),
						);
				} else {
					// Moving down (to a higher seed number): shift teams up
					// Teams with seeds > current seed AND <= new seed move up by 1
					await txn
						.update(targetTable)
						.set({
							seed: sql`${targetTable.seed} - 1`,
						})
						.where(
							and(
								groupFilter,
								not(eq(targetTable.id, targetId)),
								gt(targetTable.seed, currentSeed),
								lte(targetTable.seed, seed),
							),
						);
				}
			}

			await txn
				.update(targetTable)
				.set({ seed })
				.where(eq(targetTable.id, targetId));
		});

		return {
			success: true,
		};
	});

export const editSeedMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof editSeedSchema>) => editSeed({ data }),
	});
