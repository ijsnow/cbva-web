import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import orderBy from "lodash-es/orderBy";
import sum from "lodash-es/sum";
import z from "zod";

import { db } from "@/db/connection";
import { selectTournamentSchema, tournamentDivisionTeams } from "@/db/schema";

async function readPools({
	tournamentDivisionId,
	ids,
}: {
	tournamentDivisionId: number;
	ids?: [];
}) {
	return await db.query.pools.findMany({
		with: {
			matches: {
				with: {
					sets: true,
					teamA: {
						with: {
							poolTeam: {
								with: {
									pool: true,
								},
							},
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
							poolTeam: {
								with: {
									pool: true,
								},
							},
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
					refTeams: {
						with: {
							team: {
								with: {
									team: {
										with: {
											players: {
												with: {
													profile: true,
												},
											},
										},
									},
								},
							},
						},
					},
				},
			},
			teams: {
				with: {
					team: {
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
						},
					},
				},
			},
		},
		where: (t, { eq, and, inArray }) =>
			and(
				...[
					eq(t.tournamentDivisionId, tournamentDivisionId),
					ids ? inArray(t.id, ids) : undefined,
				].filter(Boolean),
			),
		orderBy: (t, { asc }) => asc(t.name),
	});
}

export const getPools = createServerFn({
	method: "GET",
})
	.inputValidator(
		(i) =>
			i as {
				tournamentDivisionId: number;
			},
	)
	.handler(async ({ data }) => await readPools(data));

export const poolsQueryOptions = ({
	tournamentDivisionId,
	ids,
}: {
	tournamentDivisionId: number;
	ids?: number[];
}) =>
	queryOptions({
		queryKey: ["pools", tournamentDivisionId, ids ? ids.join() : null].filter(
			Boolean,
		),
		queryFn: () =>
			getPools({
				data: {
					tournamentDivisionId,
					ids,
				},
			}),
	});
