import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { and, count, eq, gte, inArray, lt, sql } from "drizzle-orm";
import z from "zod";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { getLimitAndOffset } from "@/db/pagination";
import { tournamentDirectors } from "@/db/schema/tournament-directors";
import { tournaments } from "@/db/schema/tournaments";
import { venues } from "@/db/schema/venues";
import { withDirectorId } from "@/middlewares/with-director-id";
import { isDefined } from "@/utils/types";

export const getTournamentsByDirectorsSchema = z.object({
	directorIds: z.array(z.number()).optional(),
	past: z.boolean().optional(),
	page: z.number().min(1).default(1),
	pageSize: z.number().min(1).default(25),
});

export const getTournamentsByDirectors = createServerFn()
	.middleware([
		withDirectorId,
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(getTournamentsByDirectorsSchema)
	.handler(
		async ({
			data: { directorIds, past, page, pageSize },
			context: { viewer, directorId },
		}) => {
			// Build date filter
			const today = sql`CURRENT_DATE`;
			const dateFilter = past
				? lt(tournaments.date, today)
				: gte(tournaments.date, today);

			// Get pagination parameters
			const { limit, offset } = getLimitAndOffset({ page, size: pageSize });

			// Admin users see all tournaments
			if (viewer?.role === "admin") {
				const [results, countResult] = await Promise.all([
					// Query all tournaments with pagination
					db
						.select({
							id: tournaments.id,
							name: tournaments.name,
							date: tournaments.date,
							startTime: tournaments.startTime,
							visible: tournaments.visible,
							demo: tournaments.demo,
							venueId: tournaments.venueId,
							externalRef: tournaments.externalRef,
							venue: {
								id: venues.id,
								name: venues.name,
								city: venues.city,
							},
						})
						.from(tournaments)
						.innerJoin(venues, eq(tournaments.venueId, venues.id))
						.where(dateFilter)
						.orderBy(tournaments.date)
						.limit(limit)
						.offset(offset),
					// Count total matching tournaments
					db
						.select({ totalCount: count() })
						.from(tournaments)
						.where(dateFilter),
				]);

				const totalItems = countResult?.[0]?.totalCount ?? 0;

				return {
					data: results,
					pageInfo: {
						totalItems,
						totalPages: Math.ceil(totalItems / pageSize),
					},
				};
			}

			// Non-admin users: Get director IDs to filter by
			let targetDirectorIds = directorIds;

			// If no directorIds provided, use the current viewer's director ID from context
			if (!targetDirectorIds && isDefined(directorId)) {
				targetDirectorIds = [directorId];
			}

			// If still no director IDs, return empty result
			if (!targetDirectorIds || targetDirectorIds.length === 0) {
				return {
					data: [],
					pageInfo: {
						totalItems: 0,
						totalPages: 0,
					},
				};
			}

			// Build the base query for filtering
			const whereConditions = and(
				inArray(tournamentDirectors.directorId, targetDirectorIds),
				dateFilter,
			);

			// Run the data query and count query in parallel
			const [results, countResult] = await Promise.all([
				// Query tournaments by director IDs with pagination
				db
					.selectDistinct({
						id: tournaments.id,
						name: tournaments.name,
						date: tournaments.date,
						startTime: tournaments.startTime,
						visible: tournaments.visible,
						demo: tournaments.demo,
						venueId: tournaments.venueId,
						externalRef: tournaments.externalRef,
						venue: {
							id: venues.id,
							name: venues.name,
							city: venues.city,
						},
					})
					.from(tournaments)
					.innerJoin(
						tournamentDirectors,
						eq(tournaments.id, tournamentDirectors.tournamentId),
					)
					.innerJoin(venues, eq(tournaments.venueId, venues.id))
					.where(whereConditions)
					.orderBy(tournaments.date)
					.limit(limit)
					.offset(offset),
				// Count total matching tournaments
				db
					.select({ totalCount: count() })
					.from(
						db
							.selectDistinct({ id: tournaments.id })
							.from(tournaments)
							.innerJoin(
								tournamentDirectors,
								eq(tournaments.id, tournamentDirectors.tournamentId),
							)
							.where(whereConditions)
							.as("subquery"),
					),
			]);

			const totalItems = countResult?.[0]?.totalCount ?? 0;

			return {
				data: results,
				pageInfo: {
					totalItems,
					totalPages: Math.ceil(totalItems / pageSize),
				},
			};
		},
	);

export const getTournamentsByDirectorsOptions = (
	data: z.infer<typeof getTournamentsByDirectorsSchema> = {
		page: 1,
		pageSize: 25,
	},
) =>
	queryOptions({
		queryKey: ["getTournamentsByDirectors", JSON.stringify(data)],
		queryFn: () => getTournamentsByDirectors({ data }),
	});
