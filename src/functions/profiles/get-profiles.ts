import { db } from "@/db/connection";
import { genderSchema } from "@/db/schema/shared";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

export const getProfilesSchema = z.object({
	ids: z.array(z.number()).optional(),
	query: z.string().optional(),
	gender: genderSchema.optional(),
	orderBy: z.array(z.enum(["rank", "points"])).optional(),
});

export const getProfilesFn = createServerFn()
	.inputValidator(getProfilesSchema)
	.handler(({ data: { ids, gender, query } }) => {
		return db.query.playerProfiles.findMany({
			with: {
				level: true,
			},
			where: {
				id: ids
					? {
							in: ids,
						}
					: undefined,
				gender,
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
		});
	});

export const getProfilesQueryOptions = (
	data: z.infer<typeof getProfilesSchema>,
) =>
	queryOptions({
		queryKey: ["getProfilesQueryOptions", JSON.stringify(data)],
		queryFn: () => getProfilesFn({ data }),
	});
