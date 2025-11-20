import groupBy from "lodash/groupBy";
import sortBy from "lodash/sortBy";
import type { MatchSet, PoolMatch, PoolTeam } from "@/db/schema";

export type PoolTeamStats = {
	rank: number;
	wins: Set<number>;
	losses: Set<number>;
	headToHead: number;
	tiePointDiff: number;
	tieHeadToHead: number;
	totalPointDiff: number;
};

export type PoolStats = {
	[id: number]: PoolTeamStats;
};

// Finish results are ordered based on this criteria from the rulebook.
//
// - win-loss record
// - among tied teams do the following
//   - Head-to-head
//   - Point differential only among teams that are tied
//   - After initial tie is broken, go back to head-to-head if remaining teams are still tied.
//   - Point differential among all teams in the pool
//   - Coin toss

export function getPoolStats({
	matches,
	teams,
}: {
	teams: Pick<PoolTeam, "teamId">[];
	matches: (Pick<PoolMatch, "teamAId" | "teamBId" | "winnerId"> & {
		sets: Pick<MatchSet, "teamAScore" | "teamBScore" | "winnerId">[];
	})[];
}): PoolStats | undefined {
	if (matches.length === 0) {
		return undefined;
	}

	const stats = teams.reduce<PoolStats>((memo, { teamId }) => {
		memo[teamId] = {
			rank: 1,
			wins: new Set(),
			losses: new Set(),
			headToHead: 0,
			tiePointDiff: 0,
			tieHeadToHead: 0,
			totalPointDiff: 0,
		};
		return memo;
	}, {});

	// Process matches to calculate wins/losses and point differentials
	for (const match of matches) {
		const { teamAId, teamBId, winnerId, sets } = match;

		if (teamAId === null || teamBId === null || winnerId === null) {
			return undefined;

			// continue;
		}

		// Record wins and losses
		if (winnerId === teamAId) {
			stats[teamAId].wins.add(teamBId);
			stats[teamBId].losses.add(teamAId);
		} else {
			stats[teamAId].losses.add(teamBId);
			stats[teamBId].wins.add(teamAId);
		}

		// Calculate point differential from sets
		let teamAPoints = 0;
		let teamBPoints = 0;

		for (const set of sets) {
			teamAPoints += set.teamAScore || 0;
			teamBPoints += set.teamBScore || 0;
		}

		const pointDiff = teamAPoints - teamBPoints;
		stats[teamAId].totalPointDiff += pointDiff;
		stats[teamBId].totalPointDiff -= pointDiff;
	}

	const recordTiedGroups = groupBy(Object.entries(stats), ([, stats]) =>
		[stats.wins.size, stats.losses.size].join(":"),
	);

	for (const group of Object.values(recordTiedGroups)) {
		const groupTeamIds = new Set(group.map(([id]) => Number.parseInt(id, 10)));

		// Calculate head-to-head records
		for (const match of matches) {
			const { teamAId, teamBId, winnerId, sets } = match;

			if (teamAId === null || teamBId === null || winnerId === null) {
				continue;
			}

			if (!(groupTeamIds.has(teamAId) && groupTeamIds.has(teamBId))) {
				continue;
			}

			if (winnerId === teamAId) {
				stats[teamAId].headToHead += 1;
			} else {
				stats[teamBId].headToHead += 1;
			}

			// Calculate point differential from sets
			let teamAPoints = 0;
			let teamBPoints = 0;

			for (const set of sets) {
				teamAPoints += set.teamAScore || 0;
				teamBPoints += set.teamBScore || 0;
			}

			const pointDiff = teamAPoints - teamBPoints;
			stats[teamAId].tiePointDiff += pointDiff;
			stats[teamBId].tiePointDiff -= pointDiff;
		}
	}

	const stillTiedGroups = groupBy(Object.entries(stats), ([, stats]) =>
		[
			stats.wins.size,
			stats.losses.size,
			stats.headToHead,
			stats.tiePointDiff,
		].join(":"),
	);

	for (const group of Object.values(stillTiedGroups)) {
		const groupTeamIds = new Set(group.map(([id]) => Number.parseInt(id, 10)));

		// Calculate head-to-head records
		for (const match of matches) {
			const { teamAId, teamBId, winnerId } = match;

			if (teamAId === null || teamBId === null || winnerId === null) {
				continue;
			}

			if (!(groupTeamIds.has(teamAId) && groupTeamIds.has(teamBId))) {
				continue;
			}

			if (winnerId === teamAId) {
				stats[teamAId].tieHeadToHead += 1;
			} else {
				stats[teamBId].tieHeadToHead += 1;
			}
		}
	}

	const ordered = sortBy(Object.entries(stats), ([, s]) =>
		[
			`${s.wins.size}-${s.losses.size}`,
			s.headToHead,
			s.tiePointDiff,
			s.tieHeadToHead,
			s.totalPointDiff,
		].join(":"),
	).map(([id]) => Number.parseInt(id, 10));

	ordered.reverse();

	for (const [i, id] of ordered.entries()) {
		stats[id].rank = i + 1;
	}

	return stats;
}

// - win-loss record
// - among tied teams do the following
//   - Head-to-head
//   - Point differential only among teams that are tied
//   - After initial tie is broken, go back to head-to-head if remaining teams are still tied.
//   - Point differential among all teams in the pool
//   - Coin toss
export function getPoolFinishOrder(stats: PoolStats) {
	return sortBy(Object.entries(stats), ([, stats]) =>
		[
			stats.wins.size - stats.losses.size,
			stats.headToHead,
			stats.tiePointDiff,
			stats.tieHeadToHead,
			stats.totalPointDiff,
		].join(":"),
	).map(([id]) => Number.parseInt(id, 10));
}
