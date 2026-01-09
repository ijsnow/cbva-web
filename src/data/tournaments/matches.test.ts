import { random } from "lodash-es"
import { assert, describe, expect, test } from "vitest"
import { db } from "@/db/connection"
import { bootstrapTournament } from "@/tests/utils/tournaments"
import { overrideScoreFn } from "./matches"

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
        matchKind: "set-to-28",
        overwrite: false,
        assignWildcards: true,
      },
    })

    const divisionId = tournamentInfo.divisions[0]

    const match = await db.query.playoffMatches.findFirst({
      with: {
        sets: true,
      },
      where: (t, { and, eq }) =>
        and(eq(t.tournamentDivisionId, divisionId), eq(t.round, 0)),
    })

    assert(match, "couldn't find a match")

    const teamAWins = random() === 1

    for (const set of match.sets) {
      await overrideScoreFn({
        data: {
          id: set.id,
          teamAScore: teamAWins ? set.winScore : 12,
          teamBScore: teamAWins ? 12 : set.winScore,
        },
      })
    }

    const teams = await db.query.tournamentDivisionTeams.findMany({
      where: (t, { inArray }) =>
        inArray(t.id, [match.teamAId!, match.teamBId!]),
    })

    expect(teams).toHaveLength(2)

    const winningTeamId = teamAWins ? match.teamAId : match.teamBId
    const losingTeamId = teamAWins ? match.teamBId : match.teamAId

    const winningTeam = teams.find(({ id }) => id === winningTeamId)
    const losingTeam = teams.find(({ id }) => id === losingTeamId)

    expect(winningTeam?.finish).toBeNull()
    expect(losingTeam?.finish).toBe(9)

    const nextMatch = await db.query.playoffMatches.findFirst({
      where: (t, { eq }) => eq(t.id, match.nextMatchId!),
    })

    assert(nextMatch, "next match not found")

    if (nextMatch.teamAPreviousMatchId === match.id) {
      expect(nextMatch.teamAId).toBe(winningTeamId)
      expect(nextMatch.teamBId).toBeDefined()
    } else if (nextMatch.teamBPreviousMatchId === match.id) {
      expect(nextMatch.teamBId).toBe(winningTeamId)
      expect(nextMatch.teamAId).toBeDefined()
    } else {
      throw new Error("unexpected error finding winning team in next match")
    }
  })
})
