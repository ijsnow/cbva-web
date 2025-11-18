import { describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { createPlayoffsFn } from "./playoffs";

describe("Generating playoffs", () => {
	test("creates playoffs with even numbers", async () => {
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			venue: 1,
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
		expect(matches.filter((mat) => mat.teamAId && mat.teamBId)).toHaveLength(8);
		expect(matches.filter((mat) => mat.nextMatchId === null)).toHaveLength(1);
	});

	test("awards bye's", async () => {
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			venue: 1,
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
});
