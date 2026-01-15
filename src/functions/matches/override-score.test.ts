import { random } from "lodash-es";
import { assert, describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { overrideScoreFn } from "./override-score";
import { simulateMatchFn } from "./simulate-match";

describe("playoff match finish", () => {
	test("assign loser's finish and advance winner", async () => {
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 25,
					pools: 5,
				},
			],
			poolMatches: true,
			simulatePoolMatches: true,
			playoffConfig: {
				teamCount: 10,
				wildcardCount: 2,
				sets: [{ winScore: 28, switchScore: 7 }],
				overwrite: false,
				assignWildcards: true,
			},
		});

		const divisionId = tournamentInfo.divisions[0];

		const match = await db.query.playoffMatches.findFirst({
			with: {
				sets: true,
			},
			where: {
				tournamentDivisionId: divisionId,
				round: 0,
			},
		});

		assert(match, "couldn't find a match");

		const teamAWins = random() === 1;

		for (const set of match.sets) {
			await overrideScoreFn({
				data: {
					id: set.id,
					teamAScore: teamAWins ? set.winScore : 12,
					teamBScore: teamAWins ? 12 : set.winScore,
				},
			});
		}

		const teams = await db.query.tournamentDivisionTeams.findMany({
			where: {
				id: {
					in: [match.teamAId!, match.teamBId!],
				},
			},
		});

		expect(teams).toHaveLength(2);

		const winningTeamId = teamAWins ? match.teamAId : match.teamBId;
		const losingTeamId = teamAWins ? match.teamBId : match.teamAId;

		const winningTeam = teams.find(({ id }) => id === winningTeamId);
		const losingTeam = teams.find(({ id }) => id === losingTeamId);

		expect(winningTeam?.finish).toBeNull();
		expect(losingTeam?.finish).toBe(9);

		const nextMatch = await db.query.playoffMatches.findFirst({
			where: {
				id: match.nextMatchId!,
			},
		});

		assert(nextMatch, "next match not found");

		if (nextMatch.teamAPreviousMatchId === match.id) {
			expect(nextMatch.teamAId).toBe(winningTeamId);
			expect(nextMatch.teamBId).toBeDefined();
		} else if (nextMatch.teamBPreviousMatchId === match.id) {
			expect(nextMatch.teamBId).toBe(winningTeamId);
			expect(nextMatch.teamAId).toBeDefined();
		} else {
			throw new Error("unexpected error finding winning team in next match");
		}
	});

	test("calculates finish correctly", async () => {
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-02",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 10,
					pools: 2,
				},
			],
			poolMatches: true,
			simulatePoolMatches: true,
			playoffConfig: {
				teamCount: 6,
				wildcardCount: 2,
				sets: [{ winScore: 28, switchScore: 7 }],
				overwrite: false,
				assignWildcards: true,
			},
		});

		const [tournamentDivisionId] = tournamentInfo.divisions;

		const playoffMatches = await db.query.playoffMatches.findMany({
			where: {
				tournamentDivisionId,
			},
			orderBy: {
				matchNumber: "asc",
			},
		});

		for (const { id } of playoffMatches) {
			const match = await db.query.playoffMatches.findFirst({
				where: {
					id,
				},
			});

			assert(match);
			assert(match.teamAId);
			assert(match.teamBId);

			await simulateMatchFn({
				data: {
					playoffMatchId: match.id,
				},
			});
		}

		const playoffTeams = await db.query.tournamentDivisionTeams.findMany({
			where: {
				tournamentDivisionId,
				finish: {
					isNotNull: true,
				},
			},
			orderBy: {
				finish: "asc",
			},
		});

		expect(playoffTeams.map(({ finish }) => finish)).toStrictEqual([
			1, 2, 3, 3, 5, 5, 5, 5,
		]);
	});
});
