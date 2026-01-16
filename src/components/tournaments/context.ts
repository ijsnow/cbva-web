import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { tournamentQueryOptions } from "@/data/tournaments";
import { teamsQueryOptions } from "@/functions/teams/get-teams";
import { getPoolsQueryOptions } from "@/functions/pools/get-pools";
import { playoffsQueryOptions } from "@/functions/playoffs/get-playoffs";
import { isDefined } from "@/utils/types";
import { parseDate, today } from "@internationalized/date";
import { getDefaultTimeZone } from "@/lib/dates";
import { orderBy } from "lodash-es";
import { getPoolStats, PoolTeamStats } from "@/hooks/matches";

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

export function useIsTournamentToday() {
	const tournament = useTournament();

	if (!tournament) {
		return;
	}

	return parseDate(tournament.date) === today(getDefaultTimeZone());
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

	return getPoolsQueryOptions({
		tournamentDivisionId,
	});
}

export function usePoolMatches() {
	const tournamentDivisionId = useActiveDivisionId();

	const { data } = useQuery({
		...getPoolsQueryOptions({
			tournamentDivisionId,
		}),
		select: (data) => data.flatMap((pool) => pool.matches),
	});

	return data;
}

export function useHasPendingPoolMatches() {
	const tournamentDivisionId = useActiveDivisionId();

	const { data } = useQuery({
		...getPoolsQueryOptions({
			tournamentDivisionId,
		}),
		select: (data) =>
			data
				.flatMap((pool) => pool.matches)
				.some(({ status }) => status !== "completed"),
	});

	return data;
}

export function usePlayoffsQueryOptions() {
	const tournamentDivisionId = useActiveDivisionId();

	return playoffsQueryOptions({
		tournamentDivisionId,
	});
}

export function usePlayoffMatches() {
	const query = usePlayoffsQueryOptions();

	const { data: playoffs } = useQuery({
		...query,
	});

	return playoffs;
}

export function usePlayoffMatch(matchId: number) {
	const query = usePlayoffsQueryOptions();

	const { data } = useQuery({
		...query,
		select: (data) => data.find(({ id }) => id === matchId),
	});

	return data;
}

export function useIsPlayoffsComplete() {
	const query = usePlayoffsQueryOptions();

	const { data } = useQuery({
		...query,
	});

	return data && data.length > 0
		? data.some(({ status }) => status !== "completed")
		: false;
}

export function useTeamsQueryOptions() {
	const tournamentDivisionId = useActiveDivisionId();

	return teamsQueryOptions({
		tournamentDivisionId,
	});
}

export function useActiveTeams(tournamentDivisionId: number) {
	const { data: teams } = useQuery({
		...teamsQueryOptions({ tournamentDivisionId }),
		select: (data) =>
			data.filter(({ status }) => ["confirmed", "registered"].includes(status)),
	});

	return teams;
}

export function useActiveTeamsFromUrl() {
	const id = useActiveDivisionId();

	return useActiveTeams(id);
}

export function useTeam(id: number) {
	const query = useTeamsQueryOptions();

	const { data: teams } = useQuery({
		...query,
		select: (data) => data.find((team) => id === team.id),
	});

	return teams;
}

export function useWaitlist() {
	const query = useTeamsQueryOptions();

	const { data: waitlist } = useQuery({
		...query,
		select: (data) => data.filter(({ status }) => status === "waitlisted"),
	});

	return waitlist
		? orderBy(waitlist, ["order", "createdAt"], ["asc", "asc"])
		: undefined;
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
		...getPoolsQueryOptions({
			tournamentDivisionId: Number.parseInt(divisionId, 10),
		}),
	});

	return data;
}

export function usePoolStats(poolId: number) {
	const pools = usePools();

	const teamsQuery = useTeamsQueryOptions();

	const pool = pools?.find(({ id }) => id === poolId);

	const { data: teams } = useQuery({
		...teamsQuery,
		select: (data) => data.filter((team) => team.poolTeam.poolId === poolId),
		enabled: isDefined(pool),
	});

	if (!pool) {
		return undefined;
	}

	if (!teams) {
		return undefined;
	}

	const stats = getPoolStats(pool);

	if (!stats) {
		return undefined;
	}

	const statsMap = new Map(
		Object.keys(stats).map(
			(teamId) =>
				[Number.parseInt(teamId, 10), stats[teamId as unknown as number]] as [
					number,
					PoolTeamStats,
				],
		),
	);

	const orderedTeams = orderBy(
		teams.map((team) => ({
			...team,
			stats: statsMap?.get(team.id),
		})),
		[
			(team) => team.poolTeam?.finish,
			(team) => {
				const teamStats = statsMap.get(team.id);

				if (teamStats) {
					return (
						teamStats.wins.size / teamStats.wins.size + teamStats.losses.size
					);
				}

				return 0;
			},
			(team) => statsMap.get(team.id)?.totalPointDiff,
			(team) => team.poolTeam?.pool.name,
		],
		["asc", "asc", "desc", "asc"],
	);

	return orderedTeams;
}

export function useLastSeed() {
	const options = useTeamsQueryOptions();

	const { data: teams } = useQuery(options);

	const lastSeed = Math.max(
		...(teams?.map((team) => team.seed).filter(isDefined) ?? []),
	);

	return lastSeed;
}
