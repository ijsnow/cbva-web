import { db } from "@/db/connection";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

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
