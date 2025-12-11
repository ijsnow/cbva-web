import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";
import { authMiddleware, requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { findPaged } from "@/db/pagination";
import {
	selectTournamentSchema,
	type TournamentDivision,
	tournamentDivisions,
	tournaments,
} from "@/db/schema";
import { isNotNull, isNotNullOrUndefined } from "@/utils/types";

export const getTournaments = createServerFn({
	method: "GET",
})
	.inputValidator(
		(i) =>
			i as {
				divisions: number[];
				venues: number[];
				past: boolean;
				page: number;
				pageSize: number;
				genders: TournamentDivision["gender"][];
			},
	)
	.middleware([authMiddleware])
	.handler(
		async ({
			data: { page, pageSize, divisions, venues, genders, past },
			context: { viewer },
		}) => {
			return await findPaged("tournaments", {
				paging: { page, size: pageSize },
				config: {
					with: {
						venue: {
							columns: {
								id: true,
								name: true,
								city: true,
							},
						},
						tournamentDivisions: {
							with: {
								division: true,
								requirements: true,
							},
							where: (tournamentDivisions, { inArray, and }) => {
								const filters = [];

								if (divisions.length) {
									filters.push(
										inArray(tournamentDivisions.divisionId, divisions),
									);
								}

								if (genders.length) {
									filters.push(inArray(tournamentDivisions.gender, genders));
								}

								if (filters.length) {
									return undefined;
								}

								return and(...filters);
							},
						},
					},
					where: (tournaments, { sql, gt, lt, and, eq, inArray, exists }) => {
						const filters = [
							viewer?.role === "admin" ? null : eq(tournaments.visible, true),
							past
								? lt(tournaments.date, sql`current_date`)
								: gt(tournaments.date, sql`current_date`),
						].filter(isNotNull);

						if (divisions.length) {
							filters.push(
								exists(
									db
										.select()
										.from(tournamentDivisions)
										.where(
											and(
												eq(tournaments.id, tournamentDivisions.tournamentId),
												inArray(tournamentDivisions.divisionId, divisions),
											),
										),
								),
							);
						}

						if (genders.length) {
							filters.push(
								exists(
									db
										.select()
										.from(tournamentDivisions)
										.where(
											and(
												eq(tournaments.id, tournamentDivisions.tournamentId),
												inArray(tournamentDivisions.gender, genders),
											),
										),
								),
							);
						}

						if (venues.length) {
							filters.push(inArray(tournaments.venueId, venues));
						}

						return and(...filters);
					},
					orderBy: (table, { desc, asc }) =>
						past ? desc(table.date) : asc(table.date),
				},
			});
		},
	);

export const tournamentsQueryOptions = (data: {
	divisions: number[];
	venues: number[];
	past: boolean;
	page: number;
	pageSize: number;
	genders: TournamentDivision["gender"][];
}) =>
	queryOptions({
		queryKey: ["tournaments", JSON.stringify(data)],
		queryFn: () => getTournaments({ data }),
	});

// async function readTournament({ id }: { id: number }) {
// 	const res = await db.query.tournaments.findFirst({
// 		where: (table, { eq }) => eq(table.id, id),
// 		with: {
// 			venue: true,
// 			directors: {
// 				with: {
// 					director: {
// 						with: {
// 							profile: true,
// 						},
// 					},
// 				},
// 			},
// 			tournamentDivisions: {
// 				with: {
// 					division: true,
// 					requirements: true,
// 				},
// 			},
// 		},
// 	});

// 	return res;
// }

export const getTournament = createServerFn({
	method: "GET",
})
	.inputValidator(selectTournamentSchema.pick({ id: true }))
	.handler(async ({ data: { id } }) => {
		const res = await db.query.tournaments.findFirst({
			where: (table, { eq }) => eq(table.id, id),
			with: {
				venue: {
					with: {
						director: true,
					},
				},
				directors: {
					with: {
						director: {
							with: {
								profile: true,
							},
						},
					},
				},
				tournamentDivisions: {
					with: {
						division: true,
						requirements: true,
					},
				},
			},
		});

		return res;
	});

export const tournamentQueryOptions = (id?: number) =>
	queryOptions({
		queryKey: ["tournament", id],
		queryFn: () => {
			if (id) {
				return getTournament({ data: { id: id as number } });
			}

			return null;
		},
	});

export const upsertTournamentSchema = selectTournamentSchema
	.pick({
		name: true,
		date: true,
		startTime: true,
		venueId: true,
	})
	.extend({
		id: z.number().optional(),
	});

export type UpsertTournamentParams = z.infer<typeof upsertTournamentSchema>;

export const upsertTournamentFn = createServerFn({ method: "POST" })
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(upsertTournamentSchema)
	.handler(
		async ({ data: { id: tournamentId, name, date, startTime, venueId } }) => {
			if (isNotNullOrUndefined(tournamentId)) {
				const [{ id }] = await db
					.update(tournaments)
					.set({
						name,
						date,
						startTime,
						venueId,
					})
					.where(eq(tournaments.id, tournamentId));

				return {
					success: true,
					data: { id },
				};
			}

			const [{ id }] = await db
				.insert(tournaments)
				.values({
					name,
					date,
					startTime,
					venueId,
				})
				.returning({
					id: tournaments.id,
				});

			return {
				success: true,
				data: { id },
			};
		},
	);

export const upsertTournamentMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: UpsertTournamentParams) => {
			return upsertTournamentFn({ data });
		},
	});

export const editTournamentSchema = selectTournamentSchema.pick({
	id: true,
	date: true,
	startTime: true,
	venueId: true,
});

export type EditTournamentParams = z.infer<typeof editTournamentSchema>;

export const editTournamentFn = createServerFn({ method: "POST" })
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(editTournamentSchema)
	.handler(async ({ data: { id, date, startTime, venueId } }) => {
		await db
			.update(tournaments)
			.set({
				date,
				startTime,
				venueId,
			})
			.where(eq(tournaments.id, id));

		return {
			success: true,
		};
	});

export const editTournamentMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: EditTournamentParams) => {
			return editTournamentFn({ data });
		},
	});
