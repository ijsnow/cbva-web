import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import { db } from "@/db/connection";

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
					refs: {
						with: {
							profile: true,
						},
						where: {
							abandoned: {
								OR: [{ isNull: true }, { eq: false }],
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
				orderBy: (t, { asc }) => asc(t.seed),
			},
		},
		where: {
			tournamentDivisionId,
			id: ids
				? {
						in: ids,
					}
				: undefined,
		},
		orderBy: (t, { asc }) => [asc(t.name)],
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

export const getPoolsQueryOptions = ({
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
