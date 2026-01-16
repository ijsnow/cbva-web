import { db } from "@/db/connection";
import type {
	MatchRef,
	MatchSet,
	PlayerProfile,
	TournamentDivisionTeam,
} from "@/db/schema";
import type { MatchStatus } from "@/db/schema/shared";
import { assertFound, badRequest } from "@/lib/responses";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

export const getMatchSchema = z.object({
	poolMatchId: z.number(),
	playoffMatchId: z.number(),
});

export type SharedMatchData = {
	poolMatchId?: number;
	playoffMatchId?: number;
	status: MatchStatus;
	teamAId: number | null;
	teamA: TournamentDivisionTeam | null;
	teamBId: null | number;
	teamB: TournamentDivisionTeam | null;
	sets: MatchSet[];
	refs: (MatchRef & { profile: PlayerProfile })[];
};

export const getMatch = createServerFn({
	method: "GET",
})
	.inputValidator(getMatchSchema)
	.handler(
		async ({
			data: { poolMatchId, playoffMatchId },
		}): Promise<SharedMatchData> => {
			if (playoffMatchId) {
				const match = await db.query.playoffMatches.findFirst({
					where: { id: playoffMatchId },
					with: {
						sets: true,
						tournamentDivision: {
							columns: { id: true, tournamentId: true },
						},
						teamA: {
							with: {
								team: {
									with: {
										players: {
											with: {
												profile: true,
											},
										},
									},
								},
							},
						},
						teamB: {
							with: {
								team: {
									with: {
										players: {
											with: {
												profile: true,
											},
										},
									},
								},
							},
						},
						refs: {
							with: {
								profile: true,
							},
						},
					},
				});

				assertFound(match);

				return {
					playoffMatchId: match.id,
					status: match.status,
					teamAId: match.teamAId,
					teamA: match.teamA,
					teamBId: match.teamBId,
					teamB: match.teamB,
					sets: match.sets,
					refs: match.refs,
				};
			}

			if (poolMatchId) {
				const match = await db.query.poolMatches.findFirst({
					where: {
						id: poolMatchId,
					},
					with: {
						sets: true,
						teamA: {
							with: {
								team: {
									with: {
										players: {
											with: {
												profile: true,
											},
										},
									},
								},
							},
						},
						teamB: {
							with: {
								team: {
									with: {
										players: {
											with: {
												profile: true,
											},
										},
									},
								},
							},
						},
						refs: {
							with: {
								profile: true,
							},
						},
						pool: {
							with: {
								tournamentDivision: true,
							},
						},
					},
				});

				assertFound(match);

				return {
					poolMatchId: match.id,
					status: match.status,
					teamAId: match.teamAId,
					teamA: match.teamA,
					teamBId: match.teamBId,
					teamB: match.teamB,
					sets: match.sets,
					refs: match.refs,
				};
			}

			throw badRequest("Must provide either `poolMatchId` or `playoffMatchId`");
		},
	);

export const getMatchQueryOptions = (data: z.infer<typeof getMatchSchema>) =>
	queryOptions({
		queryKey: ["match", JSON.stringify(data)],
		queryFn: () => getMatch({ data }),
	});
