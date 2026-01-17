import { db } from "@/db/connection";
import { findPaged } from "@/db/pagination";
import { genderSchema } from "@/db/schema/shared";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

export const getLeaderboardSchema = z.object({
	gender: genderSchema.optional(),
	query: z.string().optional(),
	levels: z.array(z.number()).optional(),
	page: z.number(),
	pageSize: z.number(),
});

export const getLeaderboardFn = createServerFn()
	.inputValidator(getLeaderboardSchema)
	.handler(({ data: { query, gender, levels, page, pageSize } }) => {
		return findPaged(db, "playerProfiles", {
			paging: {
				page,
				size: pageSize,
			},
			countColumn: "id",
			query: {
				with: {
					level: true,
				},
				where: {
					gender,
					levelId:
						levels && levels.length > 0
							? {
									in: levels,
								}
							: undefined,
					RAW: query
						? (t, { sql, ilike }) =>
								ilike(
									sql`
            CASE
              WHEN ${t.preferredName} IS NOT NULL and ${t.preferredName} != ''
              THEN ${t.preferredName} || ' ' || ${t.lastName}
              ELSE ${t.firstName} || ' ' || ${t.lastName}
            END
            `,
									`%${query}%`,
								)
						: undefined,
				},
				orderBy: (t, { asc }) => [asc(t.rank), asc(t.ratedPoints)],
			},
		});
	});

export const getLeaderboardQueryOptions = (
	data: z.infer<typeof getLeaderboardSchema>,
) =>
	queryOptions({
		queryKey: ["getLeaderboardQueryOptions", JSON.stringify(data)],
		queryFn: () => getLeaderboardFn({ data }),
	});
