import { assert, describe, expect, test } from "vitest"
import { db } from "@/db/connection"
import { bootstrapTournament } from "@/tests/utils/tournaments"
import { updatePool } from "./update-pool"
import { poolTeams } from "@/db/schema"
import { eq } from "drizzle-orm"
import { orderBy, range } from "lodash-es"

describe("updatePool", () => {
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
    })

    const tournamentDivisionId = tournamentInfo.divisions[0]

    // Get a pool
    const pools = await db.query.pools.findMany({
      where: (p, { eq }) => eq(p.tournamentDivisionId, tournamentDivisionId),
      limit: 1,
    })

    const pool = pools[0]

    // Get all teams in this pool and remove them
    const poolTeamsInPool = await db.query.poolTeams.findMany({
      where: (pt, { eq }) => eq(pt.poolId, pool.id),
    })

    // Remove all teams from this pool
    for (const pt of poolTeamsInPool) {
      await db.delete(poolTeams).where(eq(poolTeams.id, pt.id))
    }

    // Get a team that's not in this pool
    const allTeams = await db.query.tournamentDivisionTeams.findMany({
      with: {
        poolTeam: true,
      },
      where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
    })

    const teamToAdd = allTeams.find(({ poolTeam }) => poolTeam !== null)

    assert(teamToAdd, "team not found")

    // Add the team to the now-empty pool
    await updatePool({
      data: {
        id: teamToAdd!.id,
        poolId: pool.id,
      },
    })

    // Verify the team has seed 1
    const addedPoolTeam = await db.query.poolTeams.findFirst({
      where: (pt, { eq }) => eq(pt.teamId, teamToAdd!.id),
    })

    expect(addedPoolTeam).toBeDefined()
    expect(addedPoolTeam?.seed).toBe(1)
    expect(addedPoolTeam?.poolId).toBe(pool.id)
  })

  test("throws error when team not found", async () => {
    await expect(
      updatePool({
        data: {
          id: 999999,
          poolId: 1,
        },
      })
    ).rejects.toThrow()
  })

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
    })

    const tournamentDivisionId = tournamentInfo.divisions[0]

    // Get pools
    const pools = await db.query.pools.findMany({
      where: (p, { eq }) => eq(p.tournamentDivisionId, tournamentDivisionId),
    })

    // Get a team from pool 1
    const pool1Team = await db.query.poolTeams.findFirst({
      where: (pt, { eq }) => eq(pt.poolId, pools[0].id),
    })

    expect(pool1Team).toBeDefined()

    const teamId = pool1Team!.teamId
    const originalPoolId = pool1Team!.poolId

    // Move to pool 2
    await updatePool({
      data: {
        id: teamId,
        poolId: pools[1].id,
      },
    })

    // Verify team is NOT in the original pool
    const teamInOriginalPool = await db.query.poolTeams.findFirst({
      where: (pt, { eq, and }) =>
        and(eq(pt.teamId, teamId), eq(pt.poolId, originalPoolId)),
    })

    expect(teamInOriginalPool).toBeUndefined()

    // Verify team IS in the new pool
    const teamInNewPool = await db.query.poolTeams.findFirst({
      where: (pt, { eq, and }) =>
        and(eq(pt.teamId, teamId), eq(pt.poolId, pools[1].id)),
    })

    expect(teamInNewPool).toBeDefined()

    const pool1Teams = await db.query.poolTeams.findMany({
      where: (pt, { eq }) => eq(pt.poolId, pools[0].id),
      orderBy: (t, { asc }) => asc(t.seed),
    })

    expect(pool1Teams.map(({ seed }) => seed)).toStrictEqual(
      range(1, pool1Teams.length + 1)
    )
  })

  test("calculate seed based on division seeds", async () => {
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
    })

    const tournamentDivisionId = tournamentInfo.divisions[0]

    const [pool, otherPool] = await db.query.pools.findMany({
      with: {
        teams: true,
      },
      where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
    })

    const teams = orderBy(pool.teams, ["seed"], ["asc"])

    const first = teams[0]
    const second = teams[1]
    const third = teams[2]
    const fourth = teams[3]
    const fifth = teams[4]

    expect(teams.map(({ id, seed }) => [id, seed])).toStrictEqual([
      [first.id, 1],
      [second.id, 2],
      [third.id, 3],
      [fourth.id, 4],
      [fifth.id, 5],
    ])

    const teamToMove = otherPool.teams[0]

    assert(teamToMove, "no team to move")

    await updatePool({
      data: {
        id: teamToMove.teamId,
        poolId: pool.id,
        seed: 2,
      },
    })

    const updatedTeams = await db.query.poolTeams.findMany({
      with: {
        team: true,
      },
      where: (t, { eq }) => eq(t.poolId, pool.id),
      orderBy: (t, { asc }) => [asc(t.seed)],
    })

    expect(updatedTeams.map(({ id, seed }) => [id, seed])).toStrictEqual([
      [first.id, 1],
      // Moved team will be second because it comes from second pool so its division seed is lower
      [teamToMove.id, 2],
      [second.id, 3],
      [third.id, 4],
      [fourth.id, 5],
      [fifth.id, 6],
    ])
  })

  test("manually set pool seed for moved team", async () => {
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
    })

    const tournamentDivisionId = tournamentInfo.divisions[0]

    const [pool, otherPool] = await db.query.pools.findMany({
      with: {
        teams: true,
      },
      where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
    })

    const teams = orderBy(pool.teams, ["seed"], ["asc"])

    const first = teams[0]
    const second = teams[1]
    const third = teams[2]
    const fourth = teams[3]
    const fifth = teams[4]

    expect(teams.map(({ id, seed }) => [id, seed])).toStrictEqual([
      [first.id, 1],
      [second.id, 2],
      [third.id, 3],
      [fourth.id, 4],
      [fifth.id, 5],
    ])

    const teamToMove = otherPool.teams[0]

    assert(teamToMove, "no team to move")

    await updatePool({
      data: {
        id: teamToMove.teamId,
        poolId: pool.id,
        seed: 2,
      },
    })

    const updatedTeams = await db.query.poolTeams.findMany({
      with: {
        team: true,
      },
      where: (t, { eq }) => eq(t.poolId, pool.id),
      orderBy: (t, { asc }) => [asc(t.seed)],
    })

    expect(updatedTeams.map(({ id, seed }) => [id, seed])).toStrictEqual([
      [first.id, 1],
      [teamToMove.id, 2],
      [second.id, 3],
      [third.id, 4],
      [fourth.id, 5],
      [fifth.id, 6],
    ])
  })
})
