import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { and, count, desc, eq, inArray, not } from "drizzle-orm";
import { round } from "lodash-es";
import { titleCase } from "title-case";
import z from "zod";
import type { Viewer } from "@/auth";
import { getViewer } from "@/auth/server";
import { authMiddleware, requireAuthenticated } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	getLimitAndOffset,
	type PagingOptions,
	pagingOptionsSchema,
} from "@/db/pagination";
import { divisions } from "@/db/schema/divisions";
import { levels } from "@/db/schema/levels";
import {
	type CreatePlayerProfile,
	createPlayerProfileSchema,
	playerProfiles,
	selectPlayerProfileSchema,
	updatePlayerProfileSchema,
} from "@/db/schema/player-profiles";
import { genderSchema } from "@/db/schema/shared";
import { teamPlayers } from "@/db/schema/team-players";
import { teams } from "@/db/schema/teams";
import { tournamentDivisionTeams } from "@/db/schema/tournament-division-teams";
import { tournamentDivisions } from "@/db/schema/tournament-divisions";
import { tournaments } from "@/db/schema/tournaments";
import { venues } from "@/db/schema/venues";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";
import { forbidden, unauthorized } from "@/lib/responses";
import { isNotNull, isNotNullOrUndefined } from "@/utils/types";

async function readViewerProfiles(userId: Viewer["id"]) {
	return await db.query.playerProfiles.findMany({
		where: (t, { eq }) => eq(t.userId, userId),
	});
}

// TODO: write test for unauthenticated request
const getViewerProfiles = createServerFn({
	method: "GET",
})
	.middleware([authMiddleware])
	.handler(async ({ context: { viewer } }) => {
		if (!viewer) {
			throw unauthorized();
		}

		return await readViewerProfiles(viewer.id);
	});

export const viewerProfileQueryOptions = () =>
	queryOptions({
		queryKey: ["viewer_profiles"],
		queryFn: () => getViewerProfiles(),
	});

export const insertPlayerProfileFn = createServerFn({ method: "POST" })
	.inputValidator(createPlayerProfileSchema)
	.handler(async ({ data }) => {
		const viewer = await getViewer();

		if (!viewer) {
			throw new Error("UNAUTHENTICATED");
		}

		await db.insert(playerProfiles).values({
			...data,
			userId: viewer.id,
		});
	});

export function useInsertPlayerProfile() {
	const mutationFn = useServerFn(insertPlayerProfileFn);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreatePlayerProfile) => {
			return mutationFn({ data: input });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["viewer_profiles"],
			});
		},
	});
}

async function readProfile(id: number, viewerId: Viewer["id"]) {
	const result = await db.query.playerProfiles.findFirst({
		where: (t, { eq, and }) => and(eq(t.id, id), eq(t.userId, viewerId)),
	});

	if (!result) {
		throw notFound();
	}

	return result;
}

const getProfile = createServerFn({
	method: "GET",
})
	.middleware([requireAuthenticated])
	.inputValidator(selectPlayerProfileSchema.pick({ id: true }))
	.handler(async ({ data: { id } }) => {
		const viewer = await getViewer();

		if (!viewer) {
			throw new Error("UNAUTHENTICATED");
		}

		return await readProfile(id, viewer.id);
	});

export const profileQueryOptions = (id: number) =>
	queryOptions({
		queryKey: ["profile", id],
		queryFn: () => getProfile({ data: { id } }),
	});

const getProfileOverview = createServerFn({
	method: "GET",
})
	.inputValidator(selectPlayerProfileSchema.pick({ id: true }))
	.handler(async ({ data: { id } }) => {
		const result = await db.query.playerProfiles.findFirst({
			columns: {
				id: true,
				userId: true,
				firstName: true,
				preferredName: true,
				lastName: true,
				imageSource: true,
				ratedPoints: true,
				juniorsPoints: true,
				rank: true,
				bio: true,
				heightFeet: true,
				heightInches: true,
				dominantArm: true,
				preferredRole: true,
				preferredSide: true,
				club: true,
				highSchoolGraduationYear: true,
				collegeTeam: true,
				collegeTeamYearsParticipated: true,
			},
			with: {
				level: true,
			},
			where: (t, { eq }) => eq(t.id, id),
		});

		if (!result) {
			throw notFound();
		}

		return result;
	});

export const profileOverviewQueryOptions = (id: number) =>
	queryOptions({
		queryKey: ["profile", id],
		queryFn: () => getProfileOverview({ data: { id } }),
	});

const profileResultsSchema = selectPlayerProfileSchema
	.pick({
		id: true,
	})
	.extend({
		venues: z.array(z.number()),
		divisions: z.array(z.number()),
		paging: pagingOptionsSchema,
	});

export async function getProfileResultsHandler({
	data: { id, venues: venueIds, divisions: divisionIds, paging },
}: {
	data: z.infer<typeof profileResultsSchema>;
}) {
	const { limit, offset } = getLimitAndOffset(paging);

	// Build filter conditions
	const filters = [
		eq(tournamentDivisionTeams.status, "confirmed"),
		inArray(
			tournamentDivisionTeams.teamId,
			db
				.select({ teamId: teamPlayers.teamId })
				.from(teamPlayers)
				.where(eq(teamPlayers.playerProfileId, id)),
		),
	];

	// Add venue filter if provided
	if (venueIds.length > 0) {
		filters.push(inArray(tournaments.venueId, venueIds));
	}

	// Add division filter if provided
	if (divisionIds.length > 0) {
		filters.push(inArray(tournamentDivisions.divisionId, divisionIds));
	}

	// Shared where condition
	const whereCondition = and(...filters);

	// Get total count - need to include divisions join for division filter
	const [totalResult] = await db
		.select({ count: count() })
		.from(tournamentDivisionTeams)
		.innerJoin(teams, eq(tournamentDivisionTeams.teamId, teams.id))
		.innerJoin(
			tournamentDivisions,
			eq(tournamentDivisionTeams.tournamentDivisionId, tournamentDivisions.id),
		)
		.innerJoin(
			tournaments,
			eq(tournamentDivisions.tournamentId, tournaments.id),
		)
		.where(whereCondition);

	const totalItems = totalResult.count;
	const totalPages = Math.ceil(totalItems / paging.size);

	// Main query to get tournament results with pagination
	const results = await db
		.select({
			id: tournamentDivisionTeams.id,
			teamId: tournamentDivisionTeams.teamId,
			finish: tournamentDivisionTeams.finish,
			pointsEarned: tournamentDivisionTeams.pointsEarned,
			tournamentDate: tournaments.date,
			tournamentName: tournaments.name,
			tournamentDivisionName: tournamentDivisions.name,
			tournamentDivisionGender: tournamentDivisions.gender,
			tournamentDivisionTeamSize: tournamentDivisions.teamSize,
			divisionId: divisions.id,
			divisionName: divisions.name,
			divisionMaxAge: divisions.maxAge,
			levelEarnedName: levels.name,
			venueId: venues.id,
			venueName: venues.name,
			venueCity: venues.city,
		})
		.from(tournamentDivisionTeams)
		.innerJoin(teams, eq(tournamentDivisionTeams.teamId, teams.id))
		.innerJoin(
			tournamentDivisions,
			eq(tournamentDivisionTeams.tournamentDivisionId, tournamentDivisions.id),
		)
		.innerJoin(
			tournaments,
			eq(tournamentDivisions.tournamentId, tournaments.id),
		)
		.innerJoin(divisions, eq(tournamentDivisions.divisionId, divisions.id))
		.innerJoin(venues, eq(tournaments.venueId, venues.id))
		.leftJoin(levels, eq(tournamentDivisionTeams.levelEarnedId, levels.id))
		.where(whereCondition)
		.orderBy(desc(tournaments.date))
		.limit(limit)
		.offset(offset);

	// Get partner info for each result
	const teamIds = results.map((r) => r.teamId);
	const partners = teamIds.length
		? await db
				.select({
					teamId: teamPlayers.teamId,
					playerProfileId: teamPlayers.playerProfileId,
					firstName: playerProfiles.firstName,
					preferredName: playerProfiles.preferredName,
					lastName: playerProfiles.lastName,
				})
				.from(teamPlayers)
				.innerJoin(
					playerProfiles,
					eq(teamPlayers.playerProfileId, playerProfiles.id),
				)
				.where(
					and(
						inArray(teamPlayers.teamId, teamIds),
						not(eq(teamPlayers.playerProfileId, id)),
					),
				)
		: [];

	// Group partners by team ID
	const partnersByTeam = new Map<
		number,
		Array<{
			teamId: number;
			playerProfileId: number;
			firstName: string;
			preferredName: string | null;
			lastName: string;
		}>
	>();

	for (const partner of partners) {
		if (!partnersByTeam.has(partner.teamId)) {
			partnersByTeam.set(partner.teamId, []);
		}
		partnersByTeam.get(partner.teamId)?.push(partner);
	}

	const data = results.map((result) => {
		const tournamentDivision = {
			name: result.tournamentDivisionName,
			gender: result.tournamentDivisionGender,
			division: {
				name: result.divisionName,
				maxAge: result.divisionMaxAge,
			},
			teamSize: result.tournamentDivisionTeamSize,
		};

		return {
			id: result.id,
			date: result.tournamentDate,
			event:
				result.tournamentName ??
				getTournamentDivisionDisplay(tournamentDivision),
			venueId: result.venueId,
			venue: `${result.venueName}, ${result.venueCity}`,
			divisionId: result.divisionId,
			division: ["unrated", "open"].includes(result.divisionName)
				? titleCase(result.divisionName)
				: (result.divisionName.toUpperCase() ?? "-"),
			players:
				partnersByTeam.get(result.teamId)?.map((p) => ({
					profile: {
						id: p.playerProfileId,
						firstName: p.firstName,
						preferredName: p.preferredName,
						lastName: p.lastName,
					},
				})) ?? [],
			finish: result.finish,
			rating: result.levelEarnedName?.toUpperCase() ?? "-",
			points: result.pointsEarned ? round(result.pointsEarned) : "-",
		};
	});

	return {
		data,
		pageInfo: {
			totalItems,
			totalPages,
		},
	};
}

export const getProfileResults = createServerFn({
	method: "GET",
})
	.inputValidator(profileResultsSchema)
	.handler(getProfileResultsHandler);

export const profileResultsQueryOptions = ({
	id,
	venues,
	divisions,
	paging: { page, size },
}: {
	id: number;
	venues: number[];
	divisions: number[];
	paging: PagingOptions;
}) =>
	queryOptions({
		queryKey: [
			"profile_results",
			id,
			page,
			size,
			JSON.stringify({ venues, divisions }),
		],
		queryFn: () =>
			getProfileResults({
				data: { id, divisions, venues, paging: { page, size } },
			}),
	});

export const updatePlayerProfileFn = createServerFn({ method: "POST" })
	.inputValidator(updatePlayerProfileSchema.extend({ id: z.number() }))
	.handler(async ({ data }) => {
		const viewer = await getViewer();

		if (!viewer) {
			throw new Error("UNAUTHENTICATED");
		}

		const {
			id,
			preferredName,
			gender,
			bio,
			imageSource,
			heightFeet,
			heightInches,
			dominantArm,
			preferredRole,
			preferredSide,
			club,
			highSchoolGraduationYear,
			collegeTeam,
			collegeTeamYearsParticipated,
		} = data;

		const profile = await db.query.playerProfiles.findFirst({
			columns: {
				userId: true,
			},
			where: (t, { eq }) => eq(t.id, id),
		});

		if (!profile) {
			throw notFound();
		}

		if (viewer.role !== "admin" && viewer.id !== profile.userId) {
			throw forbidden();
		}

		const [result] = await db
			.update(playerProfiles)
			.set({
				preferredName,
				gender,
				bio,
				imageSource,
				heightFeet,
				heightInches,
				dominantArm,
				preferredRole,
				preferredSide,
				club,
				highSchoolGraduationYear,
				collegeTeam,
				collegeTeamYearsParticipated,
			})
			.where(eq(playerProfiles.id, id))
			.returning({
				id: playerProfiles.id,
			});

		return result;
	});

export function useUpdatePlayerProfile() {
	const mutationFn = useServerFn(updatePlayerProfileFn);
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: CreatePlayerProfile) => {
			return mutationFn({ data: input });
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: ["viewer_profiles"],
			});

			queryClient.invalidateQueries({
				queryKey: ["profile", data.id],
			});
		},
	});
}

export const searchProfilesSchema = z.object({
	name: z.string().min(3),
	gender: genderSchema.optional(),
	levels: z.array(z.number().nonoptional()).optional(),
});

export const searchProfiles = createServerFn({
	method: "GET",
})
	.inputValidator(searchProfilesSchema)
	.handler(async ({ data: { name, gender, levels } }) => {
		const profiles = await db.query.playerProfiles.findMany({
			limit: 25,
			where: (t, { and, ilike, eq, inArray, sql }) => {
				const filters = [
					ilike(
						sql`
            CASE
              WHEN ${t.preferredName} IS NOT NULL
              THEN ${t.preferredName} || ' ' || ${t.lastName}
              ELSE ${t.firstName} || ' ' || ${t.lastName}
            END
            `,
						`%${name}%`,
					),
					gender ? eq(t.gender, gender) : null,
					levels ? inArray(t.levelId, levels) : null,
				].filter(isNotNull);

				return and(...filters);
			},
		});

		return profiles;
	});

export const searchProfilesQueryOptions = (
	filter: z.infer<typeof searchProfilesSchema>,
	signal?: AbortSignal,
) =>
	queryOptions({
		queryKey: ["searchProfiles", JSON.stringify(filter)],
		queryFn: ({ signal: queryFnSignal }) =>
			searchProfiles({
				data: filter,
				signal: AbortSignal.any(
					[signal, queryFnSignal].filter(isNotNullOrUndefined),
				),
			}),
	});
