import { assert, describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { setMatchRefsHandler, setMatchRefsSchema } from "./set-match-refs";

describe("setMatchRefs", () => {
	describe("schema validation", () => {
		test("should pass when only poolMatchId is provided", () => {
			const input = {
				teamId: 1,
				poolMatchId: 1,
				profileIds: [],
			};

			const result = setMatchRefsSchema.safeParse(input);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toMatchObject({
					teamId: 1,
					poolMatchId: 1,
					profileIds: [],
				});
			}
		});

		test("should pass when only playoffMatchId is provided", () => {
			const input = {
				teamId: 1,
				playoffMatchId: 1,
				profileIds: [],
			};

			const result = setMatchRefsSchema.safeParse(input);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toMatchObject({
					teamId: 1,
					playoffMatchId: 1,
					profileIds: [],
				});
			}
		});

		test("should pass with profileIds and no teamId", () => {
			const input = {
				poolMatchId: 1,
				profileIds: [1, 2],
			};

			const result = setMatchRefsSchema.safeParse(input);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toMatchObject({
					poolMatchId: 1,
					profileIds: [1, 2],
				});
			}
		});

		test("should fail when poolMatchId is not a number", () => {
			const input = {
				teamId: 1,
				poolMatchId: "not-a-number",
				profileIds: [],
			};

			const result = setMatchRefsSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		test("should fail when playoffMatchId is not a number", () => {
			const input = {
				teamId: 1,
				playoffMatchId: "not-a-number",
				profileIds: [],
			};

			const result = setMatchRefsSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		test("should fail when profileIds is missing", () => {
			const input = {
				teamId: 1,
				poolMatchId: 1,
			};

			const result = setMatchRefsSchema.safeParse(input);

			expect(result.success).toBe(false);
		});
	});

	describe("database operations", () => {
		test("should assign ref team to a pool match", async () => {
			// Setup: Create a tournament with pool matches
			const tournament = await bootstrapTournament(db, {
				date: "2025-01-01",
				startTime: "09:00:00",
				divisions: [
					{
						division: "a",
						gender: "male",
						teams: 16,
						pools: 4,
					},
				],
				poolMatches: true,
				simulatePoolMatches: false,
			});

			const pool = await db.query.pools.findFirst({
				with: {
					matches: {
						limit: 1,
					},
				},
				where: { tournamentDivisionId: tournament.divisions[0] },
			});

			assert(pool);

			const poolMatch = pool.matches[0];

			assert(poolMatch);

			// Get a tournament division team to use as ref team
			const refTeam = await db.query.tournamentDivisionTeams.findFirst({
				with: {
					players: true,
				},
				where: { tournamentDivisionId: tournament.divisions[0] },
			});

			assert(refTeam);

			// Call the handler to assign ref team
			const result = await setMatchRefsHandler({
				data: {
					poolMatchId: poolMatch.id,
					teamId: refTeam.id,
					profileIds: [],
				},
			});

			expect(result.success).toBe(true);

			// Verify the match refs were created (one per player on team)
			const createdRefs = await db.query.matchRefs.findMany({
				where: { poolMatchId: poolMatch.id },
			});

			expect(createdRefs).toHaveLength(refTeam.players.length);
			for (const ref of createdRefs) {
				expect(ref.teamId).toBe(refTeam.id);
				expect(ref.poolMatchId).toBe(poolMatch.id);
				expect(ref.playoffMatchId).toBeNull();
			}
		});

		test("should assign ref team to a playoff match", async () => {
			// Setup: Create a tournament with playoff matches
			const tournament = await bootstrapTournament(db, {
				date: "2025-01-01",
				startTime: "09:00:00",
				divisions: [
					{
						division: "a",
						gender: "male",
						teams: 16,
						pools: 4,
					},
				],
				poolMatches: true,
				simulatePoolMatches: true,
				playoffConfig: {
					teamCount: 10,
					wildcardCount: 2,
					sets: [
						{
							winScore: 28,
							switchScore: 7,
						},
					],
					assignCourts: true,
					assignWildcards: true,
					overwrite: true,
				},
			});

			// Get a playoff match
			const playoffMatch = await db.query.playoffMatches.findFirst({
				where: { tournamentDivisionId: tournament.divisions[0] },
			});

			assert(playoffMatch);

			// Get a tournament division team to use as ref team
			const refTeam = await db.query.tournamentDivisionTeams.findFirst({
				with: {
					players: true,
				},
				where: { tournamentDivisionId: tournament.divisions[0] },
			});

			assert(refTeam);

			// Call the handler to assign ref team
			const result = await setMatchRefsHandler({
				data: {
					playoffMatchId: playoffMatch.id,
					teamId: refTeam.id,
					profileIds: [],
				},
			});

			expect(result.success).toBe(true);

			// Verify the match refs were created (one per player on team)
			const createdRefs = await db.query.matchRefs.findMany({
				where: { playoffMatchId: playoffMatch.id },
			});

			expect(createdRefs).toHaveLength(refTeam.players.length);
			for (const ref of createdRefs) {
				expect(ref.teamId).toBe(refTeam.id);
				expect(ref.playoffMatchId).toBe(playoffMatch.id);
				expect(ref.poolMatchId).toBeNull();
			}
		});

		test("should replace existing ref team for a pool match", async () => {
			// Setup: Create a tournament with pool matches
			const tournament = await bootstrapTournament(db, {
				date: "2025-01-01",
				startTime: "09:00:00",
				divisions: [
					{
						division: "a",
						gender: "male",
						teams: 16,
						pools: 4,
					},
				],
				poolMatches: true,
				simulatePoolMatches: false,
			});

			const pool = await db.query.pools.findFirst({
				with: {
					matches: {
						limit: 1,
					},
				},
				where: { tournamentDivisionId: tournament.divisions[0] },
			});

			assert(pool);

			const poolMatch = pool.matches[0];

			assert(poolMatch);

			// Get two tournament division teams to use as ref teams
			const teams = await db.query.tournamentDivisionTeams.findMany({
				with: {
					players: true,
				},
				where: { tournamentDivisionId: tournament.divisions[0] },
				limit: 2,
			});

			expect(teams).toHaveLength(2);

			// Assign first ref team
			await setMatchRefsHandler({
				data: {
					poolMatchId: poolMatch.id,
					teamId: teams[0].id,
					profileIds: [],
				},
			});

			// Verify first ref team was created (one ref per player)
			let refs = await db.query.matchRefs.findMany({
				where: { poolMatchId: poolMatch.id },
			});

			expect(refs).toHaveLength(teams[0].players.length);
			for (const ref of refs) {
				expect(ref.teamId).toBe(teams[0].id);
			}

			// Replace with second ref team
			await setMatchRefsHandler({
				data: {
					poolMatchId: poolMatch.id,
					teamId: teams[1].id,
					profileIds: [],
				},
			});

			// Verify old refs were deleted and new ones created
			refs = await db.query.matchRefs.findMany({
				where: { poolMatchId: poolMatch.id },
			});

			expect(refs).toHaveLength(teams[1].players.length);
			for (const ref of refs) {
				expect(ref.teamId).toBe(teams[1].id);
			}
		});

		test("should replace existing ref team for a playoff match", async () => {
			// Setup: Create a tournament with playoff matches
			const tournament = await bootstrapTournament(db, {
				date: "2025-01-01",
				startTime: "09:00:00",
				divisions: [
					{
						division: "a",
						gender: "male",
						teams: 16,
						pools: 4,
					},
				],
				poolMatches: true,
				simulatePoolMatches: true,
				playoffConfig: {
					teamCount: 10,
					wildcardCount: 2,
					sets: [
						{
							winScore: 28,
							switchScore: 7,
						},
					],
					assignCourts: true,
					assignWildcards: true,
					overwrite: true,
				},
			});

			// Get a playoff match
			const playoffMatch = await db.query.playoffMatches.findFirst({
				where: { tournamentDivisionId: tournament.divisions[0] },
			});

			assert(playoffMatch);

			// Get two tournament division teams to use as ref teams
			const teams = await db.query.tournamentDivisionTeams.findMany({
				with: {
					players: true,
				},
				where: { tournamentDivisionId: tournament.divisions[0] },
				limit: 2,
			});

			expect(teams).toHaveLength(2);

			// Assign first ref team
			await setMatchRefsHandler({
				data: {
					playoffMatchId: playoffMatch.id,
					teamId: teams[0].id,
					profileIds: [],
				},
			});

			// Verify first ref team was created (one ref per player)
			let refs = await db.query.matchRefs.findMany({
				where: { playoffMatchId: playoffMatch.id },
			});

			expect(refs).toHaveLength(teams[0].players.length);
			for (const ref of refs) {
				expect(ref.teamId).toBe(teams[0].id);
			}

			// Replace with second ref team
			await setMatchRefsHandler({
				data: {
					playoffMatchId: playoffMatch.id,
					teamId: teams[1].id,
					profileIds: [],
				},
			});

			// Verify old refs were deleted and new ones created
			refs = await db.query.matchRefs.findMany({
				where: { playoffMatchId: playoffMatch.id },
			});

			expect(refs).toHaveLength(teams[1].players.length);
			for (const ref of refs) {
				expect(ref.teamId).toBe(teams[1].id);
			}
		});

		test("should throw notFound error when pool match does not exist", async () => {
			const nonExistentPoolMatchId = 999999;
			const nonExistentTeamId = 999999;

			await expect(
				setMatchRefsHandler({
					data: {
						poolMatchId: nonExistentPoolMatchId,
						teamId: nonExistentTeamId,
						profileIds: [],
					},
				}),
			).rejects.toThrow();
		});

		test("should throw notFound error when playoff match does not exist", async () => {
			const nonExistentPlayoffMatchId = 999999;
			const nonExistentTeamId = 999999;

			await expect(
				setMatchRefsHandler({
					data: {
						playoffMatchId: nonExistentPlayoffMatchId,
						teamId: nonExistentTeamId,
						profileIds: [],
					},
				}),
			).rejects.toThrow();
		});
	});
});
