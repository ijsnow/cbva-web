import { assert, describe, expect, test } from "vitest"
import { db } from "@/db/connection"
import { bootstrapTournament } from "@/tests/utils/tournaments"
import {
  editMatchRefTeamHandler,
  editMatchRefTeamSchema,
} from "./edit-match-ref-teams"

describe("editMatchRefTeamSchema", () => {
  describe("schema validation", () => {
    test("should fail when both poolMatchId and playoffMatchId are provided", () => {
      const input = {
        teamId: 1,
        poolMatchId: 1,
        playoffMatchId: 1,
      }

      const result = editMatchRefTeamSchema.safeParse(input)

      expect(result.success).toBe(false)
    })

    test("should fail when neither poolMatchId nor playoffMatchId are provided", () => {
      const input = {
        teamId: 1,
      }

      const result = editMatchRefTeamSchema.safeParse(input)

      expect(result.success).toBe(false)
    })

    test("should pass when only poolMatchId is provided", () => {
      const input = {
        teamId: 1,
        poolMatchId: 1,
      }

      const result = editMatchRefTeamSchema.safeParse(input)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toMatchObject({
          teamId: 1,
          poolMatchId: 1,
        })
      }
    })

    test("should pass when only playoffMatchId is provided", () => {
      const input = {
        teamId: 1,
        playoffMatchId: 1,
      }

      const result = editMatchRefTeamSchema.safeParse(input)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toMatchObject({
          teamId: 1,
          playoffMatchId: 1,
        })
      }
    })

    test("should fail when poolMatchId is not a number", () => {
      const input = {
        teamId: 1,
        poolMatchId: "not-a-number",
      }

      const result = editMatchRefTeamSchema.safeParse(input)

      expect(result.success).toBe(false)
    })

    test("should fail when playoffMatchId is not a number", () => {
      const input = {
        teamId: 1,
        playoffMatchId: "not-a-number",
      }

      const result = editMatchRefTeamSchema.safeParse(input)

      expect(result.success).toBe(false)
    })
  })

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
      })

      const pool = await db._query.pools.findFirst({
        with: {
          matches: {
            limit: 1,
          },
        },
        where: (t, { eq }) =>
          eq(t.tournamentDivisionId, tournament.divisions[0]),
      })

      assert(pool)

      const poolMatch = pool.matches[0]

      assert(poolMatch)

      // Get a tournament division team to use as ref team
      const refTeam = await db._query.tournamentDivisionTeams.findFirst({
        where: (t, { eq }) =>
          eq(t.tournamentDivisionId, tournament.divisions[0]),
      })

      assert(refTeam)

      // Call the handler to assign ref team
      const result = await editMatchRefTeamHandler({
        data: {
          poolMatchId: poolMatch.id,
          teamId: refTeam.id,
        },
      })

      expect(result.success).toBe(true)

      // Verify the ref team was created
      const createdRefTeam = await db._query.matchRefTeams.findFirst({
        where: (t, { eq }) => eq(t.poolMatchId, poolMatch.id),
      })

      expect(createdRefTeam).toBeDefined()
      expect(createdRefTeam?.teamId).toBe(refTeam.id)
      expect(createdRefTeam?.poolMatchId).toBe(poolMatch.id)
      expect(createdRefTeam?.playoffMatchId).toBeNull()
    })

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
          matchKind: "set-to-28",
          assignWildcards: true,
          overwrite: true,
        },
      })

      // Get a playoff match
      const playoffMatch = await db._query.playoffMatches.findFirst({
        where: (t, { eq }) =>
          eq(t.tournamentDivisionId, tournament.divisions[0]),
      })

      assert(playoffMatch)

      // Get a tournament division team to use as ref team
      const refTeam = await db._query.tournamentDivisionTeams.findFirst({
        where: (t, { eq }) =>
          eq(t.tournamentDivisionId, tournament.divisions[0]),
      })

      assert(refTeam)

      // Call the handler to assign ref team
      const result = await editMatchRefTeamHandler({
        data: {
          playoffMatchId: playoffMatch.id,
          teamId: refTeam.id,
        },
      })

      expect(result.success).toBe(true)

      // Verify the ref team was created
      const createdRefTeam = await db._query.matchRefTeams.findFirst({
        where: (t, { eq }) => eq(t.playoffMatchId, playoffMatch.id),
      })

      expect(createdRefTeam).toBeDefined()
      expect(createdRefTeam?.teamId).toBe(refTeam.id)
      expect(createdRefTeam?.playoffMatchId).toBe(playoffMatch.id)
      expect(createdRefTeam?.poolMatchId).toBeNull()
    })

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
      })

      const pool = await db._query.pools.findFirst({
        with: {
          matches: {
            limit: 1,
          },
        },
        where: (t, { eq }) =>
          eq(t.tournamentDivisionId, tournament.divisions[0]),
      })

      assert(pool)

      const poolMatch = pool.matches[0]

      assert(poolMatch)

      // Get two tournament division teams to use as ref teams
      const teams = await db._query.tournamentDivisionTeams.findMany({
        where: (t, { eq }) =>
          eq(t.tournamentDivisionId, tournament.divisions[0]),
        limit: 2,
      })

      expect(teams).toHaveLength(2)

      // Assign first ref team
      await editMatchRefTeamHandler({
        data: {
          poolMatchId: poolMatch.id,
          teamId: teams[0].id,
        },
      })

      // Verify first ref team was created
      let refTeams = await db._query.matchRefTeams.findMany({
        where: (t, { eq }) => eq(t.poolMatchId, poolMatch.id),
      })

      expect(refTeams).toHaveLength(1)
      expect(refTeams[0].teamId).toBe(teams[0].id)

      // Replace with second ref team
      await editMatchRefTeamHandler({
        data: {
          poolMatchId: poolMatch.id,
          teamId: teams[1].id,
        },
      })

      // Verify old ref team was deleted and new one created
      refTeams = await db._query.matchRefTeams.findMany({
        where: (t, { eq }) => eq(t.poolMatchId, poolMatch.id),
      })

      expect(refTeams).toHaveLength(1)
      expect(refTeams[0].teamId).toBe(teams[1].id)
    })

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
          matchKind: "set-to-28",
          assignWildcards: true,
          overwrite: true,
        },
      })

      // Get a playoff match
      const playoffMatch = await db._query.playoffMatches.findFirst({
        where: (t, { eq }) =>
          eq(t.tournamentDivisionId, tournament.divisions[0]),
      })

      assert(playoffMatch)

      // Get two tournament division teams to use as ref teams
      const teams = await db._query.tournamentDivisionTeams.findMany({
        where: (t, { eq }) =>
          eq(t.tournamentDivisionId, tournament.divisions[0]),
        limit: 2,
      })

      expect(teams).toHaveLength(2)

      // Assign first ref team
      await editMatchRefTeamHandler({
        data: {
          playoffMatchId: playoffMatch.id,
          teamId: teams[0].id,
        },
      })

      // Verify first ref team was created
      let refTeams = await db._query.matchRefTeams.findMany({
        where: (t, { eq }) => eq(t.playoffMatchId, playoffMatch.id),
      })

      expect(refTeams).toHaveLength(1)
      expect(refTeams[0].teamId).toBe(teams[0].id)

      // Replace with second ref team
      await editMatchRefTeamHandler({
        data: {
          playoffMatchId: playoffMatch.id,
          teamId: teams[1].id,
        },
      })

      // Verify old ref team was deleted and new one created
      refTeams = await db._query.matchRefTeams.findMany({
        where: (t, { eq }) => eq(t.playoffMatchId, playoffMatch!.id),
      })

      expect(refTeams).toHaveLength(1)
      expect(refTeams[0].teamId).toBe(teams[1].id)
    })

    test("should throw notFound error when pool match does not exist", async () => {
      const nonExistentPoolMatchId = 999999
      const nonExistentTeamId = 999999

      await expect(
        editMatchRefTeamHandler({
          data: {
            poolMatchId: nonExistentPoolMatchId,
            teamId: nonExistentTeamId,
          },
        })
      ).rejects.toThrow()
    })

    test("should throw notFound error when playoff match does not exist", async () => {
      const nonExistentPlayoffMatchId = 999999
      const nonExistentTeamId = 999999

      await expect(
        editMatchRefTeamHandler({
          data: {
            playoffMatchId: nonExistentPlayoffMatchId,
            teamId: nonExistentTeamId,
          },
        })
      ).rejects.toThrow()
    })
  })
})
