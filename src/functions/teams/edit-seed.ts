import { db } from "@/db/connection";
import {
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
	.handler(async ({ data: { id, seed } }) => {
		const targetTeam = await db.query.tournamentDivisionTeams.findFirst({
			where: (table, { eq }) => eq(table.id, id),
		});

		if (!targetTeam) {
			throw notFound();
		}

		const currentSeed = targetTeam.seed;

		await db.transaction(async (txn) => {
			if (currentSeed) {
				if (seed < currentSeed) {
					// Moving up (to a lower seed number): shift teams down
					// Teams with seeds >= new seed AND < current seed move down by 1
					await txn
						.update(tournamentDivisionTeams)
						.set({
							seed: sql`${tournamentDivisionTeams.seed} + 1`,
						})
						.where(
							and(
								not(eq(tournamentDivisionTeams.id, id)),
								eq(
									tournamentDivisionTeams.tournamentDivisionId,
									targetTeam.tournamentDivisionId,
								),
								gte(tournamentDivisionTeams.seed, seed),
								lt(tournamentDivisionTeams.seed, currentSeed),
							),
						);
				} else {
					// Moving down (to a higher seed number): shift teams up
					// Teams with seeds > current seed AND <= new seed move up by 1
					await txn
						.update(tournamentDivisionTeams)
						.set({
							seed: sql`${tournamentDivisionTeams.seed} - 1`,
						})
						.where(
							and(
								not(eq(tournamentDivisionTeams.id, id)),
								eq(
									tournamentDivisionTeams.tournamentDivisionId,
									targetTeam.tournamentDivisionId,
								),
								gt(tournamentDivisionTeams.seed, currentSeed),
								lte(tournamentDivisionTeams.seed, seed),
							),
						);
				}
			}

			await txn
				.update(tournamentDivisionTeams)
				.set({ seed })
				.where(eq(tournamentDivisionTeams.id, id));
		});

		return {
			success: true,
		};
	});

export const editSeedMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof editSeedSchema>) => editSeed({ data }),
	});
