import { db } from "@/db/connection";
import { levels, playerProfiles } from "@/db/schema";
import { genderSchema } from "@/db/schema/shared";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { and, asc, count, eq, gte, ilike, inArray, sql } from "drizzle-orm";
import z from "zod";

// Divisions go by high school graduation year and update 9/1. Until 9/1/26, they are:
//
// 12u: 2032 or after
// 14u: 2030 or after
// 16u: 2028 or after
// 18u: 2026 or after

const juniorsGraduationYear: Record<string, number> = {
	true: 2026,
	"12": 2032,
	"14": 2030,
	"16": 2028,
	"18": 2026,
};

export const getJuniorsLeaderboardSchema = z.object({
	gender: genderSchema.optional(),
	query: z.string().optional(),
	levels: z.array(z.number()).optional(),
	juniors: z.xor([
		z.literal(12),
		z.literal(14),
		z.literal(16),
		z.literal(18),
		z.literal(true),
	]),
	page: z.number(),
	pageSize: z.number(),
});

export const getJuniorsLeaderboardFn = createServerFn()
	.inputValidator(getJuniorsLeaderboardSchema)
	.handler(async ({ data: { query, gender, levels: levelIds, juniors, page, pageSize } }) => {
		const minGraduationYear =
			juniorsGraduationYear[juniors === true ? "true" : juniors];

		// Calculate rank based on division (graduation year) only,
		// not affected by other filters like gender, levels, or search query
		const rankedSubquery = db
			.select({
				id: playerProfiles.id,
				odRank: sql<number>`dense_rank() over (order by ${playerProfiles.juniorsPoints} desc)`.as(
					"od_rank",
				),
			})
			.from(playerProfiles)
			.where(gte(playerProfiles.highSchoolGraduationYear, minGraduationYear))
			.as("ranked");

		// Build filter conditions for the main query
		const conditions = [
			gte(playerProfiles.highSchoolGraduationYear, minGraduationYear),
		];

		if (gender) {
			conditions.push(eq(playerProfiles.gender, gender));
		}

		if (levelIds && levelIds.length > 0) {
			conditions.push(inArray(playerProfiles.levelId, levelIds));
		}

		if (query) {
			conditions.push(
				ilike(
					sql`CASE
						WHEN ${playerProfiles.preferredName} IS NOT NULL AND ${playerProfiles.preferredName} != ''
						THEN ${playerProfiles.preferredName} || ' ' || ${playerProfiles.lastName}
						ELSE ${playerProfiles.firstName} || ' ' || ${playerProfiles.lastName}
					END`,
					`%${query}%`,
				),
			);
		}

		const offset = pageSize * (page - 1);

		const [data, countResult] = await Promise.all([
			db
				.select({
					id: playerProfiles.id,
					odRank: rankedSubquery.odRank,
					firstName: playerProfiles.firstName,
					preferredName: playerProfiles.preferredName,
					lastName: playerProfiles.lastName,
					birthdate: playerProfiles.birthdate,
					gender: playerProfiles.gender,
					levelId: playerProfiles.levelId,
					ratedPoints: playerProfiles.ratedPoints,
					juniorsPoints: playerProfiles.juniorsPoints,
					rank: playerProfiles.rank,
					bio: playerProfiles.bio,
					imageSource: playerProfiles.imageSource,
					heightFeet: playerProfiles.heightFeet,
					heightInches: playerProfiles.heightInches,
					dominantArm: playerProfiles.dominantArm,
					preferredRole: playerProfiles.preferredRole,
					preferredSide: playerProfiles.preferredSide,
					club: playerProfiles.club,
					highSchoolGraduationYear: playerProfiles.highSchoolGraduationYear,
					collegeTeam: playerProfiles.collegeTeam,
					collegeTeamYearsParticipated: playerProfiles.collegeTeamYearsParticipated,
					externalRef: playerProfiles.externalRef,
					level: {
						id: levels.id,
						name: levels.name,
						shortName: levels.shortName,
					},
				})
				.from(playerProfiles)
				.innerJoin(rankedSubquery, eq(playerProfiles.id, rankedSubquery.id))
				.leftJoin(levels, eq(playerProfiles.levelId, levels.id))
				.where(and(...conditions))
				.orderBy(asc(rankedSubquery.odRank))
				.limit(pageSize)
				.offset(offset),
			db
				.select({ totalCount: count() })
				.from(playerProfiles)
				.where(and(...conditions)),
		]);

		const totalItems = countResult?.[0]?.totalCount ?? 0;

		return {
			data,
			pageInfo: {
				totalItems,
				totalPages: Math.ceil(totalItems / pageSize),
			},
		};
	});

export const getJuniorsLeaderboardQueryOptions = (
	data: z.infer<typeof getJuniorsLeaderboardSchema>,
) =>
	queryOptions({
		queryKey: ["getJuniorsLeaderboardQueryOptions", JSON.stringify(data)],
		queryFn: () => getJuniorsLeaderboardFn({ data }),
	});
