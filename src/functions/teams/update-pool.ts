import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { poolTeams, selectTournamentDivisionTeamSchema } from "@/db/schema";
import { notFound } from "@/lib/responses";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq, max } from "drizzle-orm";
import z from "zod";

export const updatePoolSchema = selectTournamentDivisionTeamSchema
	.pick({
		id: true,
	})
	.extend({
		poolId: z.number(),
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

		const maxSeedResult = await db
			.select({ maxSeed: max(poolTeams.seed) })
			.from(poolTeams)
			.where(eq(poolTeams.poolId, poolId));

		const nextSeed = (maxSeedResult[0]?.maxSeed ?? 0) + 1;

		await db
			.update(poolTeams)
			.set({
				poolId,
				seed: nextSeed,
			})
			.where(eq(poolTeams.teamId, tournamentDivisionTeamId));

		return {
			success: true,
		};
	});

export const updatePoolMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof updatePoolSchema>) =>
			updatePool({ data }),
	});
