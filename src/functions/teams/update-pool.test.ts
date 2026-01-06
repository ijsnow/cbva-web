import { assert, describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { updatePool } from "./update-pool";
import { poolTeams } from "@/db/schema";
import { eq } from "drizzle-orm";
import { range } from "lodash-es";

describe("updatePool", () => {
	test("adds a team to a pool when it wasn't in any pool before", async () => {
		// Create a tournament with teams and pools
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

		// Get the pools for this division
		const pools = await db.query.pools.findMany({
			where: (p, { eq }) => eq(p.tournamentDivisionId, tournamentDivisionId),
		});

		expect(pools.length).toBeGreaterThanOrEqual(2);

		// Get the pool teams to find a team not in the first pool
		const poolTeamsInPool1 = await db.query.poolTeams.findMany({
			where: (pt, { eq }) => eq(pt.poolId, pools[0].id),
		});

		const poolTeamsInPool2 = await db.query.poolTeams.findMany({
			where: (pt, { eq }) => eq(pt.poolId, pools[1].id),
		});

		expect(poolTeamsInPool1.length).toBeGreaterThan(0);
		expect(poolTeamsInPool2.length).toBeGreaterThan(0);

		// Get a team from pool 2
		const teamInPool2 = poolTeamsInPool2[0];
		const originalSeed = teamInPool2.seed;

		// Move it to pool 1
		await updatePool({
			data: {
				id: teamInPool2.teamId,
				poolId: pools[0].id,
			},
		});

		// Verify the team is now in pool 1 with the correct seed
		const updatedPoolTeam = await db.query.poolTeams.findFirst({
			where: (pt, { eq }) => eq(pt.teamId, teamInPool2.teamId),
		});

		expect(updatedPoolTeam).toBeDefined();
		expect(updatedPoolTeam?.poolId).toBe(pools[0].id);
		expect(updatedPoolTeam?.seed).toBe(poolTeamsInPool1.length + 1);

		// Verify the team is no longer in pool 2
		const teamStillInPool2 = await db.query.poolTeams.findFirst({
			where: (pt, { eq, and }) =>
				and(eq(pt.teamId, teamInPool2.teamId), eq(pt.poolId, pools[1].id)),
		});

		expect(teamStillInPool2).toBeUndefined();
	});

	test("moves a team from one pool to another", async () => {
		// Create a tournament with teams and pools
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 12,
					pools: 3,
				},
			],
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		// Get the pools
		const pools = await db.query.pools.findMany({
			where: (p, { eq }) => eq(p.tournamentDivisionId, tournamentDivisionId),
			orderBy: (p, { asc }) => [asc(p.name)],
		});

		expect(pools.length).toBe(3);

		// Get teams from pool 1 and pool 2
		const pool1Teams = await db.query.poolTeams.findMany({
			where: (pt, { eq }) => eq(pt.poolId, pools[0].id),
		});

		const pool2TeamsBefore = await db.query.poolTeams.findMany({
			where: (pt, { eq }) => eq(pt.poolId, pools[1].id),
		});

		const pool1TeamsCountBefore = pool1Teams.length;
		const pool2TeamsCountBefore = pool2TeamsBefore.length;

		expect(pool1TeamsCountBefore).toBeGreaterThan(0);
		expect(pool2TeamsCountBefore).toBeGreaterThan(0);

		// Move the first team from pool 1 to pool 2
		const teamToMove = pool1Teams[0];

		await updatePool({
			data: {
				id: teamToMove.teamId,
				poolId: pools[1].id,
			},
		});

		// Verify pool 1 has one less team
		const pool1TeamsAfter = await db.query.poolTeams.findMany({
			where: (pt, { eq }) => eq(pt.poolId, pools[0].id),
		});

		expect(pool1TeamsAfter.length).toBe(pool1TeamsCountBefore - 1);

		// Verify pool 2 has one more team
		const pool2TeamsAfter = await db.query.poolTeams.findMany({
			where: (pt, { eq }) => eq(pt.poolId, pools[1].id),
		});

		expect(pool2TeamsAfter.length).toBe(pool2TeamsCountBefore + 1);

		// Verify the team is in pool 2 with the correct seed
		const movedTeam = await db.query.poolTeams.findFirst({
			where: (pt, { eq }) => eq(pt.teamId, teamToMove.teamId),
		});

		expect(movedTeam).toBeDefined();
		expect(movedTeam?.poolId).toBe(pools[1].id);
		expect(movedTeam?.seed).toBe(pool2TeamsCountBefore + 1);
	});

	test("assigns seed 1 when adding team to an empty pool", async () => {
		// Create a tournament with teams but don't assign them to pools yet
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 15,
					pools: 3,
				},
			],
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		// Get a pool
		const pools = await db.query.pools.findMany({
			where: (p, { eq }) => eq(p.tournamentDivisionId, tournamentDivisionId),
			limit: 1,
		});

		const pool = pools[0];

		// Get all teams in this pool and remove them
		const poolTeamsInPool = await db.query.poolTeams.findMany({
			where: (pt, { eq }) => eq(pt.poolId, pool.id),
		});

		// Remove all teams from this pool
		for (const pt of poolTeamsInPool) {
			await db.delete(poolTeams).where(eq(poolTeams.id, pt.id));
		}

		// Get a team that's not in this pool
		const allTeams = await db.query.tournamentDivisionTeams.findMany({
			with: {
				poolTeam: true,
			},
			where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
		});

		const teamToAdd = allTeams.find(({ poolTeam }) => poolTeam !== null);

		assert(teamToAdd, "team not found");

		// Add the team to the now-empty pool
		await updatePool({
			data: {
				id: teamToAdd!.id,
				poolId: pool.id,
			},
		});

		// Verify the team has seed 1
		const addedPoolTeam = await db.query.poolTeams.findFirst({
			where: (pt, { eq }) => eq(pt.teamId, teamToAdd!.id),
		});

		expect(addedPoolTeam).toBeDefined();
		expect(addedPoolTeam?.seed).toBe(1);
		expect(addedPoolTeam?.poolId).toBe(pool.id);
	});

	test("throws error when team not found", async () => {
		await expect(
			updatePool({
				data: {
					id: 999999,
					poolId: 1,
				},
			}),
		).rejects.toThrow();
	});

	test("correctly calculates next seed in pool with existing teams", async () => {
		// Create a tournament with teams and pools
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

		// Get pools
		const pools = await db.query.pools.findMany({
			where: (p, { eq }) => eq(p.tournamentDivisionId, tournamentDivisionId),
		});

		const targetPool = pools[0];

		// Get current teams in the target pool
		const currentTeams = await db.query.poolTeams.findMany({
			where: (pt, { eq }) => eq(pt.poolId, targetPool.id),
			orderBy: (pt, { desc }) => [desc(pt.seed)],
		});

		const maxSeed = currentTeams[0]?.seed ?? 0;

		// Get a team from another pool
		const otherPoolTeams = await db.query.poolTeams.findMany({
			where: (pt, { eq, ne }) =>
				ne(pt.poolId, targetPool.id) && eq(pt.poolId, pools[1].id),
			limit: 1,
		});

		const teamToMove = otherPoolTeams[0];

		// Move the team
		await updatePool({
			data: {
				id: teamToMove.teamId,
				poolId: targetPool.id,
			},
		});

		// Verify the seed is maxSeed + 1
		const movedTeam = await db.query.poolTeams.findFirst({
			where: (pt, { eq }) => eq(pt.teamId, teamToMove.teamId),
		});

		expect(movedTeam?.seed).toBe(maxSeed + 1);
	});

	test("removes team from previous pool when moving", async () => {
		// Create a tournament with teams and pools
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

		// Get pools
		const pools = await db.query.pools.findMany({
			where: (p, { eq }) => eq(p.tournamentDivisionId, tournamentDivisionId),
		});

		// Get a team from pool 1
		const pool1Team = await db.query.poolTeams.findFirst({
			where: (pt, { eq }) => eq(pt.poolId, pools[0].id),
		});

		expect(pool1Team).toBeDefined();

		const teamId = pool1Team!.teamId;
		const originalPoolId = pool1Team!.poolId;

		// Move to pool 2
		await updatePool({
			data: {
				id: teamId,
				poolId: pools[1].id,
			},
		});

		// Verify team is NOT in the original pool
		const teamInOriginalPool = await db.query.poolTeams.findFirst({
			where: (pt, { eq, and }) =>
				and(eq(pt.teamId, teamId), eq(pt.poolId, originalPoolId)),
		});

		expect(teamInOriginalPool).toBeUndefined();

		// Verify team IS in the new pool
		const teamInNewPool = await db.query.poolTeams.findFirst({
			where: (pt, { eq, and }) =>
				and(eq(pt.teamId, teamId), eq(pt.poolId, pools[1].id)),
		});

		expect(teamInNewPool).toBeDefined();

		const pool1Teams = await db.query.poolTeams.findMany({
			where: (pt, { eq }) => eq(pt.poolId, pools[0].id),
			orderBy: (t, { asc }) => asc(t.seed),
		});

		expect(pool1Teams.map(({ seed }) => seed)).toStrictEqual(
			range(1, pool1Teams.length + 1),
		);
	});
});
