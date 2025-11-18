import {
	queryOptions,
	type UseQueryOptions,
	useQuery,
} from "@tanstack/react-query";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { db } from "@/db/connection";

async function readPlayoffs({
	tournamentDivisionId,
}: {
	tournamentDivisionId: number;
}) {
	return await db.query.playoffMatches.findMany({
		with: {
			sets: true,
			teamA: {
				with: {
					poolTeam: true,
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
				},
			},
			teamB: {
				with: {
					poolTeam: true,
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
				},
			},
		},
		where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
		orderBy: (t, { asc }) => asc(t.matchNumber),
	});
}

export const getPlayoffs = createServerFn({
	method: "GET",
})
	.inputValidator(
		(i) =>
			i as {
				tournamentDivisionId: number;
			},
	)
	.handler(async ({ data }) => await readPlayoffs(data));

export const playoffsQueryOptions = ({
	tournamentDivisionId,
}: {
	tournamentDivisionId: number;
}) =>
	queryOptions({
		queryKey: ["playoffs", tournamentDivisionId].filter(Boolean),
		queryFn: () =>
			getPlayoffs({
				data: {
					tournamentDivisionId,
				},
			}),
	});
