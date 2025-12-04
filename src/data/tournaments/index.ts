import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import type z from "zod";
import type { Viewer } from "@/auth";
import { authMiddleware, requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { findPaged } from "@/db/pagination";
import {
	selectTournamentSchema,
	type TournamentDivision,
	tournamentDivisions,
	tournaments,
} from "@/db/schema";
import { isNotNull } from "@/utils/types";

async function readTournaments(
	{
		page,
		pageSize,
		divisions,
		venues,
		genders,
		past,
	}: {
		page: number;
		pageSize: number;
		divisions: number[];
		venues: number[];
		genders: ("male" | "female" | "coed")[];
		past: boolean;
	},
	viewer?: Pick<Viewer, "id" | "role">,
) {
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
					},
					where: (tournamentDivisions, { inArray, and }) => {
						const filters = [];

						if (divisions.length) {
							filters.push(inArray(tournamentDivisions.divisionId, divisions));
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
}

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
	.handler(async ({ data, context }) => {
		return await readTournaments(data, context.viewer);
	});

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

async function readTournament({ id }: { id: number }) {
	const res = await db.query.tournaments.findFirst({
		where: (table, { eq }) => eq(table.id, id),
		with: {
			venue: true,
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
				},
			},
		},
	});

	return res;
}

export const getTournament = createServerFn({
	method: "GET",
})
	.inputValidator(
		(i) =>
			i as {
				id: number;
			},
	)
	.handler(({ data }) => readTournament(data));

export const tournamentQueryOptions = (id?: number) =>
	queryOptions({
		queryKey: ["tournament", id],
		queryFn: () => (id ? getTournament({ data: { id: id as number } }) : null),
	});

export const editDateSchema = selectTournamentSchema.pick({
	id: true,
	date: true,
	startTime: true,
});

export type SetCapacityParams = z.infer<typeof editDateSchema>;

export const editDateFn = createServerFn({ method: "POST" })
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(editDateSchema)
	.handler(async ({ data: { id, date, startTime } }) => {
		await db
			.update(tournaments)
			.set({
				date,
				startTime,
			})
			.where(eq(tournaments.id, id));

		return {
			success: true,
		};
	});

export const editDateMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: SetCapacityParams) => {
			return editDateFn({ data });
		},
	});
