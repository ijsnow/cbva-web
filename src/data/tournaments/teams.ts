import { mutationOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { and, eq, inArray, lte, sql } from "drizzle-orm";
import chunk from "lodash-es/chunk";
import shuffle from "lodash-es/shuffle";
import z from "zod";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	levels,
	playerProfiles,
	selectTournamentDivisionSchema,
	selectTournamentSchema,
	teamPlayers,
	teams,
	tournamentDivisions,
	tournamentDivisionTeams,
} from "@/db/schema";
import { badRequest } from "@/lib/responses";

const addTeamSchema = z.object({
	tournamentDivisionId: z.number(),
	players: z.array(z.number()),
});

type AddTeamParams = z.infer<typeof addTeamSchema>;

export const addTeamFn = createServerFn({ method: "POST" })
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(addTeamSchema)
	.handler(async ({ data: { tournamentDivisionId, players } }) => {
		const division = await db.query.tournamentDivisions.findFirst({
			where: (t, { eq }) => eq(t.id, tournamentDivisionId),
		});

		if (!division) {
			throw notFound();
		}

		const nonWaitlistedTeamsCount = await db.$count(
			tournamentDivisionTeams,
			and(
				eq(tournamentDivisionTeams.tournamentDivisionId, tournamentDivisionId),
				inArray(tournamentDivisionTeams.status, ["registered", "confirmed"]),
			),
		);

		const waitlistedTeamsCount = await db.$count(
			tournamentDivisionTeams,
			and(
				eq(tournamentDivisionTeams.tournamentDivisionId, tournamentDivisionId),
				inArray(tournamentDivisionTeams.status, ["waitlisted"]),
			),
		);

		if (
			nonWaitlistedTeamsCount + waitlistedTeamsCount + 1 >
			division.capacity + division.waitlistCapacity
		) {
			throw badRequest("Division at capacity.");
		}

		// Find teams in the tournament division that have all the specified players
		const existingTeam = await db
			.select({
				teamId: teams.id,
				playerCount: sql<number>`count(distinct ${teamPlayers.playerProfileId})`,
			})
			.from(teams)
			.innerJoin(teamPlayers, eq(teams.id, teamPlayers.teamId))
			.where(inArray(teamPlayers.playerProfileId, players))
			.groupBy(teams.id)
			.having(
				sql`count(distinct ${teamPlayers.playerProfileId}) = ${players.length}`,
			)
			.limit(1);

		let teamId = existingTeam.at(0)?.teamId;

		if (!teamId) {
			const [newTeam] = await db
				.insert(teams)
				.values({
					name: null,
				})
				.returning({
					id: teams.id,
				});

			teamId = newTeam.id;

			await db.insert(teamPlayers).values(
				players.map((profileId) => ({
					teamId: newTeam.id,
					playerProfileId: profileId,
				})),
			);
		}

		if (!teamId) {
			throw new Error("INTERNAL_SERVER_ERROR");
		}

		// Get the highest order for this tournament division
		const maxOrderResult = await db
			.select({
				maxOrder: sql<number | null>`MAX(${tournamentDivisionTeams.order})`,
			})
			.from(tournamentDivisionTeams)
			.where(
				eq(tournamentDivisionTeams.tournamentDivisionId, tournamentDivisionId),
			);

		const nextOrder = (maxOrderResult[0]?.maxOrder ?? -1) + 1;

		const newTournamentDivisionTeam = await db
			.insert(tournamentDivisionTeams)
			.values({
				tournamentDivisionId,
				teamId,
				status:
					nonWaitlistedTeamsCount >= division.capacity
						? "waitlisted"
						: "confirmed",
				order: nextOrder,
			})
			.returning({
				id: tournamentDivisionTeams.id,
			});

		return {
			data: newTournamentDivisionTeam,
		};
	});

export const addTeamOptions = () =>
	mutationOptions({
		mutationFn: async (data: AddTeamParams) => {
			return addTeamFn({ data });
		},
	});

export const fillTournamentSchema = selectTournamentSchema.pick({
	id: true,
});

export const fillTournamentFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(fillTournamentSchema)
	.handler(async ({ data: { id: tournamentId } }) => {
		const tournament = await db.query.tournaments.findFirst({
			with: {
				tournamentDivisions: {
					with: {
						division: true,
						teams: true,
					},
				},
			},
			where: (t, { eq }) => eq(t.id, tournamentId),
		});

		if (!tournament) {
			throw notFound();
		}

		for (const {
			id: tournamentDivisionId,
			capacity,
			teamSize,
			gender,
			division: { order },
			teams: existingTeams,
		} of tournament.tournamentDivisions) {
			const validLevelIds = (
				await db.select().from(levels).where(lte(levels.order, order))
			).map(({ id }) => id);

			const randomTeams = chunk(
				shuffle(
					await db.query.playerProfiles.findMany({
						where: (t, { inArray, and, eq }) =>
							and(inArray(t.levelId, validLevelIds), eq(t.gender, gender)),
						limit: capacity * teamSize - existingTeams.length,
					}),
				),
				2,
			);

			const createdTeams = await db
				.insert(teams)
				.values(
					randomTeams.map((players) => ({
						name: players.map(({ id }) => id).join(":"),
					})),
				)
				.returning({
					id: teams.id,
					name: teams.name,
				});

			const createdTeamMap = createdTeams.reduce<{ [key: string]: number }>(
				(memo, team) => {
					memo[team.name as string] = team.id;
					return memo;
				},
				{},
			);

			await db.insert(teamPlayers).values(
				randomTeams.flatMap((players) => {
					const teamId = createdTeamMap[players.map(({ id }) => id).join(":")];

					return players.map(({ id }) => ({
						teamId: teamId,
						playerProfileId: id,
					}));
				}),
			);

			// Get the highest order for this tournament division
			const maxOrderResult = await db
				.select({
					maxOrder: sql<number | null>`MAX(${tournamentDivisionTeams.order})`,
				})
				.from(tournamentDivisionTeams)
				.where(
					eq(
						tournamentDivisionTeams.tournamentDivisionId,
						tournamentDivisionId,
					),
				);

			const startOrder = (maxOrderResult[0]?.maxOrder ?? -1) + 1;

			await db.insert(tournamentDivisionTeams).values(
				createdTeams.map(({ id }, index) => ({
					tournamentDivisionId,
					teamId: id,
					status: "confirmed" as const,
					order: startOrder + index,
				})),
			);
		}
	});

export const fillTournamentMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof fillTournamentSchema>) =>
			fillTournamentFn({ data }),
	});
