import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import { db } from "@/db/connection";
import { selectTournamentDivisionTeamSchema } from "@/db/schema";

async function readTeams({
	tournamentDivisionId,
}: {
	tournamentDivisionId: number;
}) {
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
		where: (teams, { eq, and, or }) =>
			and(
				eq(teams.tournamentDivisionId, tournamentDivisionId),
				or(eq(teams.status, "confirmed"), eq(teams.status, "registered")),
			),
		orderBy: (t, { asc }) => [asc(t.finish), asc(t.seed)],
	});
}

export const getTeams = createServerFn({
	method: "GET",
})
	.inputValidator(
		selectTournamentDivisionTeamSchema.pick({ tournamentDivisionId: true }),
	)
	.handler(async ({ data }) => await readTeams(data));

export const teamsQueryOptions = (tournamentDivisionId: number) =>
	queryOptions({
		queryKey: ["teams", tournamentDivisionId],
		queryFn: () =>
			getTeams({
				data: {
					tournamentDivisionId,
				},
			}),
	});
