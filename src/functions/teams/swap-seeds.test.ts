import { describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { swapSeeds } from "./swap-seeds";

describe("editSeed", () => {
	test("swaps seeds between two teams", async () => {
		// Create a tournament with teams
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

		// Get two teams with different seeds
		const teams = await db._query.tournamentDivisionTeams.findMany({
			where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
			orderBy: (t, { asc }) => [asc(t.seed)],
			limit: 2,
		});

		expect(teams).toHaveLength(2);

		const [teamA, teamB] = teams;
		const teamASeed = teamA.seed;
		const teamBSeed = teamB.seed;

		expect(teamASeed).not.toBeNull();
		expect(teamBSeed).not.toBeNull();
		expect(teamASeed).not.toBe(teamBSeed);

		// Swap: give teamA the seed that teamB currently has
		await swapSeeds({
			data: {
				id: teamA.id,
				seed: teamBSeed!,
			},
		});

		// expect(result.success).toBe(true);

		// Verify the swap occurred
		const updatedTeamA = await db._query.tournamentDivisionTeams.findFirst({
			where: (t, { eq }) => eq(t.id, teamA.id),
		});

		const updatedTeamB = await db._query.tournamentDivisionTeams.findFirst({
			where: (t, { eq }) => eq(t.id, teamB.id),
		});

		expect(updatedTeamA?.seed).toBe(teamBSeed);
		expect(updatedTeamB?.seed).toBe(teamASeed);
	});

	test("fails when trying to set seed to non-existent position", async () => {
		// Create a tournament with teams
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 5,
					pools: 1,
				},
			],
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		// Get the first team
		const team = await db._query.tournamentDivisionTeams.findFirst({
			where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
		});

		expect(team).toBeDefined();

		// Try to set to a seed that doesn't exist (e.g., 100)
		const nonExistentSeed = 100;

		await expect(
			swapSeeds({
				data: {
					id: team!.id,
					seed: nonExistentSeed,
				},
			}),
		).rejects.toThrow();
	});

	test("throws error when team not found", async () => {
		await expect(
			swapSeeds({
				data: {
					id: 999999,
					seed: 1,
				},
			}),
		).rejects.toThrow();
	});

	test("rejects invalid seed values (negative, zero, decimal)", async () => {
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 5,
					pools: 1,
				},
			],
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		const team = await db._query.tournamentDivisionTeams.findFirst({
			where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
		});

		expect(team).toBeDefined();

		// Test negative number
		await expect(
			swapSeeds({
				data: {
					id: team!.id,
					seed: -1,
				},
			}),
		).rejects.toThrow();

		// Test zero
		await expect(
			swapSeeds({
				data: {
					id: team!.id,
					seed: 0,
				},
			}),
		).rejects.toThrow();

		// Test decimal
		await expect(
			swapSeeds({
				data: {
					id: team!.id,
					seed: 1.5,
				},
			}),
		).rejects.toThrow();
	});

	test("preserves seeds of unrelated teams in different divisions", async () => {
		// Create a tournament with multiple divisions
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 5,
					pools: 1,
				},
				{
					division: "a",
					gender: "male",
					teams: 5,
					pools: 1,
				},
			],
		});

		const [divisionAId, divisionBId] = tournamentInfo.divisions;

		// Get teams from both divisions
		const teamA = await db._query.tournamentDivisionTeams.findFirst({
			where: (t, { eq }) => eq(t.tournamentDivisionId, divisionAId),
			orderBy: (t, { asc }) => [asc(t.seed)],
		});

		const teamB = await db._query.tournamentDivisionTeams.findFirst({
			where: (t, { eq }) => eq(t.tournamentDivisionId, divisionBId),
			orderBy: (t, { asc }) => [asc(t.seed)],
		});

		// Get another team in division A to swap with
		const teamA2 = await db._query.tournamentDivisionTeams.findFirst({
			where: (t, { eq, ne, and }) =>
				and(eq(t.tournamentDivisionId, divisionAId), ne(t.id, teamA!.id)),
			orderBy: (t, { asc }) => [asc(t.seed)],
		});

		expect(teamA).toBeDefined();
		expect(teamA2).toBeDefined();
		expect(teamB).toBeDefined();

		const teamBOriginalSeed = teamB!.seed;

		// Swap seeds in division A
		await swapSeeds({
			data: {
				id: teamA!.id,
				seed: teamA2!.seed!,
			},
		});

		// Verify teamB's seed hasn't changed (it's in a different division)
		const updatedTeamB = await db._query.tournamentDivisionTeams.findFirst({
			where: (t, { eq }) => eq(t.id, teamB!.id),
		});

		expect(updatedTeamB?.seed).toBe(teamBOriginalSeed);
	});
});
