import { assert, describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { setMatchCourtHandler } from "./set-match-court";

describe("set match court", () => {
	test("set pool court", async () => {
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 10,
					pools: 2,
				},
			],
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		const pool = await db.query.pools.findFirst({
			where: {
				tournamentDivisionId,
			},
		});

		assert(pool, "pool not found");

		const result = await setMatchCourtHandler({
			poolId: pool.id,
			court: "Court 5",
		});

		expect(result.success).toBe(true);

		const updatedPool = await db.query.pools.findFirst({
			where: {
				id: pool.id,
			},
		});

		expect(updatedPool?.court).toBe("Court 5");
	});

	test("set playoff court", async () => {
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
				sets: [
					{
						winScore: 28,
						switchScore: 7,
					},
				],
				overwrite: false,
				assignWildcards: true,
			},
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		const playoffMatch = await db.query.playoffMatches.findFirst({
			where: {
				tournamentDivisionId,
			},
		});

		assert(playoffMatch, "playoff match not found");

		const result = await setMatchCourtHandler({
			playoffMatchId: playoffMatch.id,
			court: "Court 3",
		});

		expect(result.success).toBe(true);

		const updatedMatch = await db.query.playoffMatches.findFirst({
			where: {
				id: playoffMatch.id,
			},
		});

		expect(updatedMatch?.court).toBe("Court 3");
	});
});
