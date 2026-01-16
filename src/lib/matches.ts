import { useQuery } from "@tanstack/react-query";
import {
	playoffMatchQueryOptions,
	poolMatchQueryOptions,
} from "@/data/matches";
import { getMatchQueryOptions } from "@/functions/matches/get-match";

export function isSetDone(
	teamAScore: number,
	teamBScore: number,
	winScore: number,
) {
	return (
		(teamAScore >= winScore && teamAScore - teamBScore >= 2) ||
		(teamBScore >= winScore && teamBScore - teamAScore >= 2)
	);
}

export type MatchIdProps = {
	poolMatchId?: number;
	playoffMatchId?: number;
};

export function useMatchTeams({ poolMatchId, playoffMatchId }: MatchIdProps) {
	const { data: poolMatch } = useQuery({
		...poolMatchQueryOptions(poolMatchId ?? 0),
		enabled: poolMatchId !== undefined,
	});

	const { data: playoffMatch } = useQuery({
		...playoffMatchQueryOptions(playoffMatchId ?? 0),
		enabled: playoffMatchId !== undefined,
	});

	const match = poolMatchId ? poolMatch : playoffMatch;

	if (!match) {
		return undefined;
	}

	return {
		teamA: match.teamA,
		teamB: match.teamB,
	};
}

export function useMatchSets({ poolMatchId, playoffMatchId }: MatchIdProps) {
	const { data: match } = useQuery(
		getMatchQueryOptions({ poolMatchId, playoffMatchId }),
	);

	return match?.sets;
}
