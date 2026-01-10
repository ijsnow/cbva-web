import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { withDirectorId } from "@/middlewares/with-director-id";
import { isDefined } from "@/utils/types";
import { forbidden } from "@/lib/responses";
import { getDefaultTimeZone } from "@/lib/dates";
import { today } from "@internationalized/date";
import { findPaged } from "@/db/pagination2";

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
			// Determine which director IDs to filter by (if not admin)
			const isAdmin = viewer?.role === "admin";
			let targetDirectorIds = directorIds;

			// Non-admin users: use provided directorIds or fall back to their own director ID
			if (!isAdmin) {
				if (isDefined(directorId)) {
					targetDirectorIds = [directorId];
				} else {
					throw forbidden();
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
			}

			const todaysDate = today(getDefaultTimeZone()).toString();

			return findPaged(db, "tournaments", {
				paging: { page, size: pageSize },
				countColumn: "id",
				query: {
					with: {
						venue: {
							columns: {
								id: true,
								name: true,
								city: true,
							},
						},
					},
					where: {
						date: past ? { lt: todaysDate } : { gte: todaysDate },
						directors: {
							directorId:
								!isAdmin && targetDirectorIds
									? {
											in: targetDirectorIds,
										}
									: undefined,
						},
					},
					orderBy: (tournaments, { asc, desc }) => [
						past ? desc(tournaments.date) : asc(tournaments.date),
					],
				},
			});
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
