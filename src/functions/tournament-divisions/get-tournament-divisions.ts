import { db } from "@/db/connection";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { isNotNullOrUndefined } from "@/utils/types";

const getTournamentDivisionsSchema = z.object({
	ids: z.array(z.number()),
});

export const getTournamentDivisions = createServerFn({
	method: "GET",
})
	.inputValidator(getTournamentDivisionsSchema)
	.handler(async ({ data: { ids } }) => {
		if (ids.length === 0) {
			return [];
		}

		return db.query.tournamentDivisions.findMany({
			where: {
				id: {
					in: ids,
				},
				// tournament: {
				// 	visible: true,
				// },
			},
			with: {
				tournament: {
					columns: {
						id: true,
						name: true,
						date: true,
						registrationOpenAt: true,
					},
					with: {
						venue: {
							columns: {
								id: true,
								name: true,
								city: true,
								slug: true,
							},
						},
					},
				},
				division: true,
			},
		});
	});

export const getTournamentDivisionsQueryOptions = (ids: number[]) =>
	queryOptions({
		queryKey: ["tournamentDivisions", ids],
		queryFn: () => getTournamentDivisions({ data: { ids } }),
	});

const searchTournamentDivisionsSchema = z.object({
	divisionIds: z.array(z.number()).default([]),
	venueIds: z.array(z.number()).default([]),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	excludeIds: z.array(z.number()).default([]),
});

export const searchTournamentDivisions = createServerFn({
	method: "GET",
})
	.inputValidator(searchTournamentDivisionsSchema)
	.handler(
		async ({
			data: { divisionIds, venueIds, startDate, endDate, excludeIds },
		}) => {
			return db.query.tournamentDivisions.findMany({
				where: {
					id:
						excludeIds.length > 0
							? {
									notIn: excludeIds,
								}
							: undefined,
					divisionId:
						divisionIds.length > 0
							? {
									in: divisionIds,
								}
							: undefined,
					tournament: {
						visible: true,
						demo: false,
						venueId:
							venueIds.length > 0
								? {
										in: venueIds,
									}
								: undefined,
						date: {
							gte: startDate,
							lte: endDate,
						},
					},
				},
				with: {
					tournament: {
						columns: {
							id: true,
							name: true,
							date: true,
							registrationOpenAt: true,
						},
						with: {
							venue: {
								columns: {
									id: true,
									name: true,
									city: true,
									slug: true,
								},
							},
						},
					},
					division: true,
				},
				orderBy: (td, { asc }) => asc(td.tournamentId),
				limit: 5,
			});
		},
	);

export type SearchTournamentDivisionsInput = z.infer<
	typeof searchTournamentDivisionsSchema
>;

export const searchTournamentDivisionsQueryOptions = (
	data: SearchTournamentDivisionsInput,
) =>
	queryOptions({
		queryKey: [
			"searchTournamentDivisions",
			data.divisionIds?.join(","),
			data.venueIds?.join(","),
			data.startDate,
			data.endDate,
			data.excludeIds?.join(","),
		].filter(isNotNullOrUndefined),
		queryFn: () => searchTournamentDivisions({ data }),
	});
