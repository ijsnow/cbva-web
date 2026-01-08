import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { tournamentQueryOptions } from "@/data/tournaments";
import { teamsQueryOptions } from "@/data/teams";
import { poolsQueryOptions } from "@/data/pools";
import { playoffsQueryOptions } from "@/data/playoffs";
import { isDefined } from "@/utils/types";

export function useTournament() {
	const { tournamentId } = useParams({
		from: "/tournaments/$tournamentId/$divisionId/{-$tab}",
	});

	const { data: tournament } = useSuspenseQuery(
		tournamentQueryOptions(Number.parseInt(tournamentId, 10)),
	);

	return tournament;
}

export function useTournamentDivision() {
	const { divisionId } = useParams({
		from: "/tournaments/$tournamentId/$divisionId/{-$tab}",
	});

	const tournament = useTournament();

	return (
		tournament?.tournamentDivisions.find(
			({ id }) => id.toString() === divisionId,
		) ?? tournament?.tournamentDivisions[0]
	);
}

export function useIsDemoTournament() {
	const tournament = useTournament();

	return tournament?.demo;
}
export function useActiveDivisionId() {
	const { divisionId } = useParams({
		from: "/tournaments/$tournamentId/$divisionId/{-$tab}",
	});

	return Number.parseInt(divisionId, 10);
}

export function usePoolsQueryOptions() {
	const tournamentDivisionId = useActiveDivisionId();

	return poolsQueryOptions({
		tournamentDivisionId,
	});
}

export function usePlayoffsQueryOptions() {
	const tournamentDivisionId = useActiveDivisionId();

	return playoffsQueryOptions({
		tournamentDivisionId,
	});
}

export function useTeamsQueryOptions() {
	const tournamentDivisionId = useActiveDivisionId();

	return teamsQueryOptions({
		tournamentDivisionId,
	});
}

export function useTeamsAtCapacity() {
	const { divisionId } = useParams({
		from: "/tournaments/$tournamentId/$divisionId/{-$tab}",
	});

	const division = useTournamentDivision();

	const { data: atCapacity } = useSuspenseQuery({
		...teamsQueryOptions({
			tournamentDivisionId: Number.parseInt(divisionId, 10),
		}),
		select: (data) => data.length === division?.capacity,
	});

	return atCapacity;
}

export function usePools() {
	const { divisionId } = useParams({
		from: "/tournaments/$tournamentId/$divisionId/{-$tab}",
	});

	const { data } = useSuspenseQuery({
		...poolsQueryOptions({
			tournamentDivisionId: Number.parseInt(divisionId, 10),
		}),
	});

	return data;
}

// const { data: hasGames } = useQuery({
// 	...poolsQueryOptions({
// 		tournamentDivisionId: activeDivision.id,
// 	}),
// 	select: (data) => data.some((pool) => pool.matches.length > 0),
// });
//
// const { data: hasPlayoffs } = useQuery({
// 	...playoffsQueryOptions({
// 		tournamentDivisionId: activeDivision.id,
// 	}),
// 	select: (data) => data.length > 0,
// });

export function useLastSeed() {
	const options = useTeamsQueryOptions();

	const { data: teams } = useQuery(options);

	const lastSeed = Math.max(
		...(teams?.map((team) => team.seed).filter(isDefined) ?? []),
	);

	return lastSeed;
}
