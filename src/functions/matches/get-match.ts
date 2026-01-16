import { db } from "@/db/connection";
import type {
	MatchRef,
	MatchSet,
	PlayerProfile,
	Team,
	TeamPlayer,
	TournamentDivisionTeam,
} from "@/db/schema";
import type { MatchStatus } from "@/db/schema/shared";
import { assertFound, badRequest } from "@/lib/responses";
import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import z from "zod";

export const getMatchSchema = z.object({
	poolMatchId: z.number().optional(),
	playoffMatchId: z.number().optional(),
});

export type SharedMatchTeam = TournamentDivisionTeam & {
	team: Team & { players: (TeamPlayer & { profile: PlayerProfile })[] };
};

export type SharedMatchData = {
	poolMatchId?: number;
	playoffMatchId?: number;
	tournamentDivisionId: number;
	tournamentId: number;
	winnerId: number | null;
	court: string | null;
	matchNumber: number;
	status: MatchStatus;
	teamAId: number | null;
	teamA: SharedMatchTeam | null;
	teamBId: null | number;
	teamB: SharedMatchTeam | null;
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
					tournamentDivisionId: match.tournamentDivisionId,
					tournamentId: match.tournamentDivision.tournamentId,
					court: match.court,
					winnerId: match.winnerId,
					matchNumber: match.matchNumber,
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
					tournamentDivisionId: match.pool.tournamentDivisionId,
					tournamentId: match.pool.tournamentDivision.tournamentId,
					court: match.pool.court,
					winnerId: match.winnerId,
					matchNumber: match.matchNumber,
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
