import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	levels,
	playerProfiles,
	selectTournamentSchema,
	teamPlayers,
	teams,
	tournamentDivisions,
	tournamentDivisionTeams,
} from "@/db/schema";
import { assertFound, badRequest } from "@/lib/responses";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, inArray, sql } from "drizzle-orm";
import z from "zod";

export const calculateSeedsSchema = selectTournamentSchema
	.pick({
		id: true,
	})
	.extend({
		overwrite: z.boolean(),
		tournamentDivisionIds: z.array(z.number()).optional(),
	});

export const calculateSeedsFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(calculateSeedsSchema)
	.handler(
		async ({
			data: { id: tournamentId, tournamentDivisionIds, overwrite },
		}) => {
			const tournament = await db.query.tournaments.findFirst({
				with: {
					tournamentDivisions: {
						with: {
							teams: {
								where: (t, { eq }) => eq(t.status, "confirmed"),
							},
						},
						where: tournamentDivisionIds
							? (t, { inArray }) => inArray(t.id, tournamentDivisionIds)
							: undefined,
					},
				},
				where: (t, { eq }) => eq(t.id, tournamentId),
			});

			assertFound(tournament);

			const hasSeeds = tournament.tournamentDivisions.some((division) =>
				division.teams.some((team) => team.seed !== null),
			);

			if (hasSeeds && !overwrite) {
				throw badRequest(
					'Seeds are already set for this tournament. If you intended to redo the seeding, select "Overwrite existing".',
				);
			}

			const updates = await db
				.select({
					id: tournamentDivisionTeams.id,
					tournamentDivisionId: tournamentDivisionTeams.tournamentDivisionId,
					weight: sql<number>`SUM(COALESCE(${levels.order}, 0))`,
					totalRank: sql<number>`SUM(${playerProfiles.rank})`,
					seed: sql<number>`ROW_NUMBER() OVER (
          PARTITION BY ${tournamentDivisionTeams.tournamentDivisionId}
          ORDER BY SUM(COALESCE(${levels.order}, 0)) DESC, SUM(${playerProfiles.rank}) ASC
        )`,
				})
				.from(tournamentDivisionTeams)
				.innerJoin(teams, eq(tournamentDivisionTeams.teamId, teams.id))
				.innerJoin(teamPlayers, eq(teams.id, teamPlayers.teamId))
				.innerJoin(
					playerProfiles,
					eq(teamPlayers.playerProfileId, playerProfiles.id),
				)
				.leftJoin(levels, eq(playerProfiles.levelId, levels.id))
				.innerJoin(
					tournamentDivisions,
					eq(
						tournamentDivisionTeams.tournamentDivisionId,
						tournamentDivisions.id,
					),
				)
				.where(
					and(
						eq(tournamentDivisions.tournamentId, tournamentId),
						inArray(tournamentDivisionTeams.status, [
							"confirmed",
							"registered",
						]),
					),
				)
				.groupBy(
					tournamentDivisionTeams.id,
					tournamentDivisionTeams.tournamentDivisionId,
				);

			const seeded = await db.transaction(async (txn) => {
				return await Promise.all(
					updates.map(({ id, seed }) =>
						txn
							.update(tournamentDivisionTeams)
							.set({ seed })
							.where(eq(tournamentDivisionTeams.id, id))
							.returning({
								id: tournamentDivisionTeams.id,
								seed: tournamentDivisionTeams.seed,
							}),
					),
				);
			});

			return seeded.flat();
		},
	);

export const calculateSeedsMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof calculateSeedsSchema>) =>
			calculateSeedsFn({ data }),
	});
