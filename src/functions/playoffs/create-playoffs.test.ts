import { eq } from "drizzle-orm";
import { random } from "lodash-es";
import { assert, describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import { pools as poolsTable } from "@/db/schema";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { isNotNull } from "@/utils/types";
import { overrideScoreFn } from "../matches/override-score";
import { createPlayoffsHandler } from "./create-playoffs";

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

		await createPlayoffsHandler({
			data: {
				id: tournamentDivisionId,
				teamCount: 16,
				wildcardCount: 0,
				sets: [{ winScore: 28, switchScore: 7 }],
				overwrite: false,
				assignCourts: true,
			},
		});

		const matches = await db.query.playoffMatches.findMany({
			with: {
				teamA: true,
				teamB: true,
			},
			where: { tournamentDivisionId },
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

		await createPlayoffsHandler({
			data: {
				id: tournamentDivisionId,
				teamCount: 12,
				wildcardCount: 0,
				sets: [{ winScore: 28, switchScore: 7 }],
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
			where: { tournamentDivisionId },
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

		await createPlayoffsHandler({
			data: {
				id: tournamentDivisionId,
				teamCount: 10,
				wildcardCount: 2,
				sets: [{ winScore: 28, switchScore: 7 }],
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
			where: { tournamentDivisionId },
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

		const refTeamId = teamAWins ? match.teamBId : match.teamAId;

		const refTeam = await db.query.matchRefs.findFirst({
			where: {
				teamId: refTeamId!,
				playoffMatchId: match.nextMatchId!,
			},
		});

		assert(refTeam, "did not find a referee assignment for losing team");
	});
});

// describe("double elimination brackets", () => {
// 	test("in a double elim bracket, loser refs next match and is assigned game in loser bracket", () => {
// 		// ...
// 	});
// });

describe("court assignment", () => {
	test("courts propagate from pools through all rounds to finals", async () => {
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 16,
					pools: 4,
				},
			],
			poolMatches: true,
			simulatePoolMatches: true,
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		// Assign courts to pools (pool a -> court 1, pool b -> court 2, etc.)
		const pools = await db.query.pools.findMany({
			where: { tournamentDivisionId },
			orderBy: (t, { asc }) => asc(t.name),
		});

		for (const [i, pool] of pools.entries()) {
			await db
				.update(poolsTable)
				.set({ court: `Court ${i + 1}` })
				.where(eq(poolsTable.id, pool.id));
		}

		await createPlayoffsHandler({
			data: {
				id: tournamentDivisionId,
				teamCount: 8,
				wildcardCount: 0,
				sets: [{ winScore: 28, switchScore: 7 }],
				overwrite: false,
				assignCourts: true,
			},
		});

		const matches = await db.query.playoffMatches.findMany({
			with: {
				teamA: {
					with: {
						poolTeam: {
							with: {
								pool: true,
							},
						},
					},
				},
				teamB: {
					with: {
						poolTeam: {
							with: {
								pool: true,
							},
						},
					},
				},
			},
			where: { tournamentDivisionId },
			orderBy: (t, { asc }) => [asc(t.round), asc(t.matchNumber)],
		});

		// Should have 4 + 2 + 1 = 7 matches
		expect(matches).toHaveLength(7);

		// First round (round 0): 4 matches
		// Each match should have a court from the higher seed's pool
		const round0Matches = matches.filter((m) => m.round === 0);
		expect(round0Matches).toHaveLength(4);

		for (const match of round0Matches) {
			expect(match.court).not.toBeNull();

			// Verify court comes from the higher seed's pool
			const teamA = match.teamA;
			const teamB = match.teamB;

			if (teamA && teamB) {
				const teamASeed = teamA.playoffsSeed ?? Number.POSITIVE_INFINITY;
				const teamBSeed = teamB.playoffsSeed ?? Number.POSITIVE_INFINITY;
				const higherSeedTeam = teamASeed <= teamBSeed ? teamA : teamB;
				const expectedCourt = higherSeedTeam.poolTeam?.pool?.court;

				expect(match.court).toBe(expectedCourt);
			}
		}

		// Second round (round 1): 2 matches (semifinals)
		// Courts should propagate from higher seed's previous match
		const round1Matches = matches.filter((m) => m.round === 1);
		expect(round1Matches).toHaveLength(2);

		for (const match of round1Matches) {
			expect(match.court).not.toBeNull();
		}

		// Finals (round 2): 1 match
		// Court should propagate from higher seed's path
		const finalsMatch = matches.find((m) => m.round === 2);
		expect(finalsMatch).toBeDefined();
		expect(finalsMatch!.court).not.toBeNull();

		// Verify the finals court comes from the #1 seed's path
		// The #1 seed should maintain their pool's court through to finals
		const seed1Pool = pools.find((p) => p.name === "a"); // Pool A has seed 1
		expect(finalsMatch!.court).toBe("Court 1");

		// Verify court propagation chain: trace from finals back to first round
		// The finals match court should match the court of the higher seed's path
		const finalsTeamAPreviousMatchId = finalsMatch!.teamAPreviousMatchId;
		const finalsTeamBPreviousMatchId = finalsMatch!.teamBPreviousMatchId;

		if (finalsTeamAPreviousMatchId && finalsTeamBPreviousMatchId) {
			const semifinalA = matches.find(
				(m) => m.id === finalsTeamAPreviousMatchId,
			);
			const semifinalB = matches.find(
				(m) => m.id === finalsTeamBPreviousMatchId,
			);

			// One of the semifinals should have the same court as finals
			// (the one on the higher seed's path)
			expect([semifinalA?.court, semifinalB?.court]).toContain(
				finalsMatch!.court,
			);
		}
	});

	test("courts propagate correctly with byes - track-based assignment", async () => {
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 20,
					pools: 4,
				},
			],
			poolMatches: true,
			simulatePoolMatches: true,
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		// Assign courts to pools
		const pools = await db.query.pools.findMany({
			where: { tournamentDivisionId },
			orderBy: (t, { asc }) => asc(t.name),
		});

		for (const [i, pool] of pools.entries()) {
			await db
				.update(poolsTable)
				.set({ court: `Court ${i + 1}` })
				.where(eq(poolsTable.id, pool.id));
		}

		// Create playoffs with 6 teams (seeds 1 and 2 get byes)
		await createPlayoffsHandler({
			data: {
				id: tournamentDivisionId,
				teamCount: 6,
				wildcardCount: 0,
				sets: [{ winScore: 28, switchScore: 7 }],
				overwrite: false,
				assignCourts: true,
			},
		});

		const matches = await db.query.playoffMatches.findMany({
			with: {
				teamA: {
					with: {
						poolTeam: {
							with: {
								pool: true,
							},
						},
					},
				},
				teamB: {
					with: {
						poolTeam: {
							with: {
								pool: true,
							},
						},
					},
				},
			},
			where: { tournamentDivisionId },
			orderBy: (t, { asc }) => [asc(t.round), asc(t.matchNumber)],
		});

		// All matches should have courts
		for (const match of matches) {
			expect(match.court).not.toBeNull();
		}

		// Verify bye teams get their own pool's court
		const byeMatches = matches.filter(
			(m) =>
				m.round === 1 &&
				((m.teamAId && !m.teamAPreviousMatchId) ||
					(m.teamBId && !m.teamBPreviousMatchId)),
		);

		for (const match of byeMatches) {
			const byeTeam =
				match.teamAId && !match.teamAPreviousMatchId
					? match.teamA
					: match.teamB;

			if (byeTeam?.poolTeam?.pool?.court) {
				// The match should use the bye team's pool court
				expect(match.court).toBe(byeTeam.poolTeam.pool.court);
			}
		}

		// Key test: verify "track" logic
		// First round matches should use the court of the bye team they feed into
		for (const match of byeMatches) {
			const byeTeam =
				match.teamAId && !match.teamAPreviousMatchId
					? match.teamA
					: match.teamB;
			const feederMatchId =
				match.teamAId && !match.teamAPreviousMatchId
					? match.teamBPreviousMatchId
					: match.teamAPreviousMatchId;

			if (byeTeam?.poolTeam?.pool?.court && feederMatchId) {
				const feederMatch = matches.find((m) => m.id === feederMatchId);

				// The feeder match (first round) should have the same court as the bye match
				// because they're on the same "track"
				expect(feederMatch?.court).toBe(byeTeam.poolTeam.pool.court);
			}
		}

		// Finals should have a court
		const finalsMatch = matches.reduce((max, m) =>
			m.round > max.round ? m : max,
		);
		expect(finalsMatch.court).not.toBeNull();
	});

	test("courts propagate correctly in larger brackets (16 teams)", async () => {
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 32,
					pools: 8,
				},
			],
			poolMatches: true,
			simulatePoolMatches: true,
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		// Assign courts to pools
		const pools = await db.query.pools.findMany({
			where: { tournamentDivisionId },
			orderBy: (t, { asc }) => asc(t.name),
		});

		for (const [i, pool] of pools.entries()) {
			await db
				.update(poolsTable)
				.set({ court: `Court ${i + 1}` })
				.where(eq(poolsTable.id, pool.id));
		}

		// Create playoffs with 16 teams (full bracket, no byes)
		await createPlayoffsHandler({
			data: {
				id: tournamentDivisionId,
				teamCount: 16,
				wildcardCount: 0,
				sets: [{ winScore: 28, switchScore: 7 }],
				overwrite: false,
				assignCourts: true,
			},
		});

		const matches = await db.query.playoffMatches.findMany({
			with: {
				teamA: {
					with: {
						poolTeam: {
							with: {
								pool: true,
							},
						},
					},
				},
				teamB: {
					with: {
						poolTeam: {
							with: {
								pool: true,
							},
						},
					},
				},
			},
			where: { tournamentDivisionId },
			orderBy: (t, { asc }) => [asc(t.round), asc(t.matchNumber)],
		});

		// Should have 8 + 4 + 2 + 1 = 15 matches
		expect(matches).toHaveLength(15);

		// Verify all matches have courts assigned
		for (const match of matches) {
			expect(match.court).not.toBeNull();
		}

		// Find the finals match
		const finalsMatch = matches.find((m) => m.round === 3);
		expect(finalsMatch).toBeDefined();
		expect(finalsMatch!.court).not.toBeNull();

		// Finals court should be Court 1 (from seed 1's pool path)
		expect(finalsMatch!.court).toBe("Court 1");

		// Verify the full propagation chain from seed 1's pool to finals
		// Seed 1 is in pool A (Court 1), and their court should propagate through
		const round0Seed1Match = matches.find(
			(m) => m.round === 0 && m.teamA?.playoffsSeed === 1,
		);
		expect(round0Seed1Match).toBeDefined();
		expect(round0Seed1Match!.court).toBe("Court 1");

		// Find the path from round 0 through to finals for seed 1
		let currentMatchId = round0Seed1Match!.id;
		let currentCourt = round0Seed1Match!.court;

		for (let round = 1; round <= 3; round++) {
			const nextMatch = matches.find(
				(m) =>
					m.round === round &&
					(m.teamAPreviousMatchId === currentMatchId ||
						m.teamBPreviousMatchId === currentMatchId),
			);

			expect(nextMatch).toBeDefined();
			// The court should be propagated from the higher seed's path
			// If seed 1's path is the higher seed path, court should remain Court 1
			expect(nextMatch!.court).toBe("Court 1");

			currentMatchId = nextMatch!.id;
			currentCourt = nextMatch!.court;
		}
	});
});
