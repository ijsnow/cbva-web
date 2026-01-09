import { describe, expect, test } from "vitest"
import { db } from "@/db/connection"
import { bootstrapTournament } from "@/tests/utils/tournaments"
import { tournamentDivisions, tournamentDivisionTeams } from "@/db/schema"
import { eq } from "drizzle-orm"
import { createTeams } from "@/tests/utils/users"
import { getQualifiedLevels } from "@/tests/utils/divisions"
import { promoteFromWaitlist } from "./promote-from-waitlist"

describe("promoteFromWaitlist", () => {
  test("raises division capacity when promoting exceeds current capacity", async () => {
    // Create a tournament with one division
    const tournamentInfo = await bootstrapTournament(db, {
      date: "2025-01-01",
      startTime: "09:00:00",
      divisions: [
        {
          division: "b",
          gender: "male",
          teams: 3,
          pools: 1,
        },
      ],
    })

    const tournamentDivisionId = tournamentInfo.divisions[0]

    // Set capacity to 3
    await db
      .update(tournamentDivisions)
      .set({
        capacity: 3,
        waitlistCapacity: 5,
      })
      .where(eq(tournamentDivisions.id, tournamentDivisionId))

    // Add a waitlisted team
    const levels = await getQualifiedLevels(db, "b")
    const waitlistedTeamIds = await createTeams(db, {
      count: 1,
      levels: levels.map(({ name }) => name),
      gender: "male",
    })

    const [insertedWaitlistedTeam] = await db
      .insert(tournamentDivisionTeams)
      .values([
        {
          tournamentDivisionId,
          teamId: waitlistedTeamIds[0].id,
          status: "waitlisted" as const,
          order: 3,
        },
      ])
      .returning({ id: tournamentDivisionTeams.id })

    // Verify initial state: capacity is 3, 3 confirmed teams, 1 waitlisted
    const divisionBefore = await db.query.tournamentDivisions.findFirst({
      where: (t, { eq }) => eq(t.id, tournamentDivisionId),
    })

    expect(divisionBefore?.capacity).toBe(3)

    const teamsBefore = await db.query.tournamentDivisionTeams.findMany({
      where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
    })

    expect(teamsBefore.filter((t) => t.status === "confirmed")).toHaveLength(3)
    expect(teamsBefore.filter((t) => t.status === "waitlisted")).toHaveLength(1)

    // Promote the waitlisted team
    await promoteFromWaitlist({
      data: {
        id: insertedWaitlistedTeam.id,
        seed: null,
        poolId: null,
        poolSeed: null,
        automatic: false,
      },
    })

    // Verify that the capacity was automatically increased to 4
    const divisionAfter = await db.query.tournamentDivisions.findFirst({
      where: (t, { eq }) => eq(t.id, tournamentDivisionId),
    })

    expect(divisionAfter?.capacity).toBe(4)

    // Verify that the team was promoted
    const teamsAfter = await db.query.tournamentDivisionTeams.findMany({
      where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
    })

    expect(teamsAfter.filter((t) => t.status === "confirmed")).toHaveLength(4)
    expect(teamsAfter.filter((t) => t.status === "waitlisted")).toHaveLength(0)

    // Verify the specific team was promoted
    const promotedTeam = teamsAfter.find(
      (t) => t.id === insertedWaitlistedTeam.id
    )
    expect(promotedTeam?.status).toBe("confirmed")
  })
})
