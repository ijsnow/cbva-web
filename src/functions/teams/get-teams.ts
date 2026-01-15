import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { db } from "@/db/connection";
import { selectTournamentDivisionTeamSchema } from "@/db/schema";
import { teamStatusSchema } from "@/db/schema/shared";
import { isDefined, isNotNullOrUndefined } from "@/utils/types";
import {
	authMiddleware,
	roleHasPermission,
	type SessionViewer,
} from "@/auth/shared";

const getTeamsSchema = selectTournamentDivisionTeamSchema
	.pick({ tournamentDivisionId: true })
	.extend({
		statusIn: z.array(teamStatusSchema).optional(),
	});

export const getTeams = createServerFn({
	method: "GET",
})
	.middleware([authMiddleware])
	.inputValidator(getTeamsSchema)
	.handler(
		async ({
			data: { tournamentDivisionId, statusIn },
			context: { viewer },
		}) => {
			const canUpdate = viewer
				? roleHasPermission(viewer.role, {
						tournament: ["update"],
					})
				: false;

			return await db.query.tournamentDivisionTeams.findMany({
				with: {
					team: {
						with: {
							players: {
								with: {
									profile: {
										with: {
											level: true,
										},
									},
								},
							},
						},
					},
					poolTeam: {
						with: {
							pool: true,
						},
					},
				},
				where: {
					tournamentDivisionId,
					status: {
						in:
							statusIn ??
							[
								"confirmed" as const,
								"registered" as const,
								canUpdate ? ("waitlisted" as const) : null,
							].filter(isDefined),
					},
				},
				orderBy: (t, { asc }) => [asc(t.finish), asc(t.seed)],
			});
		},
	);

export const teamsQueryOptions = ({
	tournamentDivisionId,
	statusIn,
}: z.infer<typeof getTeamsSchema>) =>
	queryOptions({
		queryKey: ["teams", tournamentDivisionId, statusIn?.join(":")].filter(
			isNotNullOrUndefined,
		),
		queryFn: () =>
			getTeams({
				data: {
					tournamentDivisionId,
					statusIn,
				},
			}),
	});
