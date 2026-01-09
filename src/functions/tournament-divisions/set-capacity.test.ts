import { describe, expect, test } from "vitest"
import { db } from "@/db/connection"
import { bootstrapTournament } from "@/tests/utils/tournaments"
import { tournamentDivisions, tournamentDivisionTeams } from "@/db/schema"
import { eq } from "drizzle-orm"
import { createTeams } from "@/tests/utils/users"
import { getQualifiedLevels } from "@/tests/utils/divisions"
import { setCapacityFn } from "./set-capacity"

describe("update waitlist teams", () => {
  test("promotes teams from waitlist", async () => {
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

    // Set initial capacity to 3
    await db
      .update(tournamentDivisions)
      .set({
        capacity: 3,
        waitlistCapacity: 5,
      })
      .where(eq(tournamentDivisions.id, tournamentDivisionId))

    // Add 2 waitlisted teams
    const levels = await getQualifiedLevels(db, "b")
    const waitlistedTeamIds = await createTeams(db, {
      count: 2,
      levels: levels.map(({ name }) => name),
      gender: "male",
    })

    const insertedWaitlistedTeams = await db
      .insert(tournamentDivisionTeams)
      .values(
        waitlistedTeamIds.map(({ id: teamId }, index) => ({
          tournamentDivisionId,
          teamId,
          status: "waitlisted" as const,
          order: 3 + index,
        }))
      )
      .returning({ id: tournamentDivisionTeams.id })

    // Verify initial state: 3 confirmed, 2 waitlisted
    const teamsBefore = await db.query.tournamentDivisionTeams.findMany({
      where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
    })

    expect(teamsBefore.filter((t) => t.status === "confirmed")).toHaveLength(3)
    expect(teamsBefore.filter((t) => t.status === "waitlisted")).toHaveLength(2)

    // Increase capacity to 5
    await setCapacityFn({
      data: {
        id: tournamentDivisionId,
        capacity: 5,
        waitlistCapacity: 5,
      },
    })

    // Verify that 2 teams were promoted from waitlist
    const teamsAfter = await db.query.tournamentDivisionTeams.findMany({
      where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
    })

    expect(teamsAfter.filter((t) => t.status === "confirmed")).toHaveLength(5)
    expect(teamsAfter.filter((t) => t.status === "waitlisted")).toHaveLength(0)

    // Verify that the specific waitlisted teams were promoted
    const promotedTeams = teamsAfter.filter((t) =>
      insertedWaitlistedTeams.map((wt) => wt.id).includes(t.id)
    )
    expect(promotedTeams).toHaveLength(2)
    promotedTeams.forEach((team) => {
      expect(team.status).toBe("confirmed")
    })
  })
})
