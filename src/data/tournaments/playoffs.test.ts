import { eq } from "drizzle-orm";
import { random } from "lodash-es";
import { assert, describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import {
	type MatchSet,
	matchSets,
	playoffMatches,
	type UpdateMatchSet,
} from "@/db/schema";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { dbg } from "@/utils/dbg";
import { isNotNull } from "@/utils/types";
import { overrideScoreFn, overrideScoreMutationOptions } from "./matches";
import { createPlayoffsFn } from "./playoffs";

describe("Generating playoffs", () => {
	test("creates playoffs with even numbers", async () => {
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 30,
					pools: 6,
				},
			],
			poolMatches: true,
			simulatePoolMatches: true,
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		await createPlayoffsFn({
			data: {
				id: tournamentDivisionId,
				teamCount: 16,
				wildcardCount: 0,
				matchKind: "set-to-28",
				overwrite: false,
			},
		});

		const matches = await db.query.playoffMatches.findMany({
			with: {
				teamA: true,
				teamB: true,
			},
			where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
		});

		expect(matches).toHaveLength(8 + 4 + 2 + 1);
		expect(
			matches.filter((mat) => mat.teamAPreviousMatchId !== null),
		).toHaveLength(4 + 2 + 1);
		expect(
			matches.filter((mat) => mat.teamBPreviousMatchId !== null),
		).toHaveLength(4 + 2 + 1);
		expect(
			matches.filter((mat) => isNotNull(mat.teamAId) && isNotNull(mat.teamBId)),
		)
			// This is 4, only because the hardcoded seed order for playoffs calls for
			// 4 wildcards in the round of 16 for 6 pool tournaments
			.toHaveLength(4);
		expect(matches.filter((mat) => mat.nextMatchId === null)).toHaveLength(1);
	});

	test("awards bye's", async () => {
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 30,
					pools: 6,
				},
			],
			poolMatches: true,
			simulatePoolMatches: true,
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		await createPlayoffsFn({
			data: {
				id: tournamentDivisionId,
				teamCount: 12,
				wildcardCount: 0,
				matchKind: "set-to-28",
				overwrite: false,
			},
		});

		const matches = await db.query.playoffMatches.findMany({
			with: {
				teamA: {
					with: {
						poolTeam: true,
					},
				},
				teamB: {
					with: {
						poolTeam: true,
					},
				},
			},
			where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
		});

		expect(matches).toHaveLength(4 + 4 + 2 + 1);

		expect(
			matches.filter(
				(mat) =>
					mat.teamAId !== null &&
					mat.teamAPreviousMatchId === null &&
					mat.teamBId === null &&
					mat.teamBPreviousMatchId !== null,
			),
		).toHaveLength(2);

		expect(
			matches.filter(
				(mat) =>
					mat.teamAId === null &&
					mat.teamAPreviousMatchId !== null &&
					mat.teamBId !== null &&
					mat.teamBPreviousMatchId === null,
			),
		).toHaveLength(2);
		expect(matches.filter((mat) => mat.nextMatchId === null)).toHaveLength(1);
	});

	test("adds slots for wildcards", async () => {
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
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		await createPlayoffsFn({
			data: {
				id: tournamentDivisionId,
				teamCount: 10,
				wildcardCount: 2,
				matchKind: "set-to-28",
				overwrite: false,
			},
		});

		const matches = await db.query.playoffMatches.findMany({
			with: {
				teamA: {
					with: {
						poolTeam: true,
					},
				},
				teamB: {
					with: {
						poolTeam: true,
					},
				},
			},
			where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
		});

		expect(matches).toHaveLength(4 + 4 + 2 + 1);

		expect(
			matches.filter(
				(mat) =>
					mat.teamAId !== null &&
					mat.teamAPreviousMatchId === null &&
					mat.teamBId === null &&
					mat.teamBPreviousMatchId !== null,
			),
		).toHaveLength(2);

		expect(
			matches.filter(
				(mat) =>
					mat.teamAId === null &&
					mat.teamAPreviousMatchId !== null &&
					mat.teamBId !== null &&
					mat.teamBPreviousMatchId === null,
			),
		).toHaveLength(2);

		expect(matches.filter((mat) => mat.nextMatchId === null)).toHaveLength(1);
	});
});

describe("referee assignments", () => {
	test("loser of a playoff match refs the next match", async () => {
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
				wildcardCount: 4,
				matchKind: "set-to-28",
				overwrite: false,
				assignWildcards: true,
			},
		});

		const divisionId = tournamentInfo.divisions[0];

		const match = await db.query.playoffMatches.findFirst({
			with: {
				sets: true,
			},
			where: (t, { and, eq }) =>
				and(eq(t.tournamentDivisionId, divisionId), eq(t.round, 0)),
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
	});
});

// describe("double elimination brackets", () => {
// 	test("in a double elim bracket, loser refs next match and is assigned game in loser bracket", () => {
// 		// ...
// 	});
// });
