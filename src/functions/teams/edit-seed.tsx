import { db } from "@/db/connection";
import {
	selectTournamentDivisionTeamSchema,
	tournamentDivisionTeams,
} from "@/db/schema";
import { badRequest, notFound } from "@/lib/responses";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import z from "zod";

export const editSeedSchema = selectTournamentDivisionTeamSchema
	.pick({
		id: true,
	})
	.extend({
		seed: z.number().int().positive(),
	});

export const editSeed = createServerFn()
	.inputValidator(editSeedSchema)
	.handler(async ({ data: { id: tournamentDivisionTeamId, seed } }) => {
		const targetTeam = await db.query.tournamentDivisionTeams.findFirst({
			where: (table, { eq }) => eq(table.id, tournamentDivisionTeamId),
		});

		if (!targetTeam) {
			throw notFound();
		}

		// Find the team with the desired seed in the same division
		const teamWithTargetSeed = await db.query.tournamentDivisionTeams.findFirst(
			{
				where: (t, { eq, and }) =>
					and(
						eq(t.tournamentDivisionId, targetTeam.tournamentDivisionId),
						eq(t.seed, seed),
					),
			},
		);

		// Fail if no team has the target seed (can only swap with existing seeds)
		if (!teamWithTargetSeed) {
			throw badRequest(
				`No team found with seed ${seed} in this division. Can only swap with existing seeds.`,
			);
		}

		// Perform the seed swap in a transaction
		await db.transaction(async (txn) => {
			await txn
				.update(tournamentDivisionTeams)
				.set({
					seed: targetTeam.seed,
				})
				.where(eq(tournamentDivisionTeams.seed, seed));

			await txn
				.update(tournamentDivisionTeams)
				.set({
					seed,
				})
				.where(eq(tournamentDivisionTeams.id, tournamentDivisionTeamId));
		});

		return {
			success: true,
		};
	});

export const editSeedMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof editSeedSchema>) => editSeed({ data }),
	});
