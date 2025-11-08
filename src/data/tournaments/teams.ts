import { mutationOptions } from "@tanstack/react-query"
import { notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { setResponseStatus } from "@tanstack/react-start/server"
import { eq, inArray, sql } from "drizzle-orm"
import z from "zod"
import { db } from "@/db/connection"
import {
  levels,
  playerProfiles,
  selectTournamentSchema,
  teamPlayers,
  teams,
  tournamentDivisions,
  tournamentDivisionTeams,
} from "@/db/schema"

const addTeamSchema = z.object({
  tournamentDivisionId: z.number(),
  players: z.array(z.number()),
})

type AddTeamParams = z.infer<typeof addTeamSchema>

export const addTeamFn = createServerFn({ method: "POST" })
  .inputValidator(addTeamSchema)
  .handler(async ({ data: { tournamentDivisionId, players } }) => {
    // Find teams in the tournament division that have all the specified players
    const existingTeam = await db
      .select({
        teamId: teams.id,
        playerCount: sql<number>`count(distinct ${teamPlayers.playerProfileId})`,
      })
      .from(teams)
      .innerJoin(teamPlayers, eq(teams.id, teamPlayers.teamId))
      .where(inArray(teamPlayers.playerProfileId, players))
      .groupBy(teams.id)
      .having(
        sql`count(distinct ${teamPlayers.playerProfileId}) = ${players.length}`
      )
      .limit(1)

    let teamId = existingTeam.at(0)?.teamId

    console.log({ teamId })

    if (!teamId) {
      const [newTeam] = await db
        .insert(teams)
        .values({
          name: null,
        })
        .returning({
          id: teams.id,
        })

      teamId = newTeam.id

      await db.insert(teamPlayers).values(
        players.map((profileId) => ({
          teamId: newTeam.id,
          playerProfileId: profileId,
        }))
      )
    }

    if (!teamId) {
      throw new Error("INTERNAL_SERVER_ERROR")
    }

    const newTournamentDivisionTeam = await db
      .insert(tournamentDivisionTeams)
      .values({
        tournamentDivisionId,
        teamId,
      })
      .returning({
        id: tournamentDivisionTeams.id,
      })

    return {
      data: newTournamentDivisionTeam,
    }
  })

export const addTeamOptions = () =>
  mutationOptions({
    mutationFn: async (data: AddTeamParams) => {
      return addTeamFn({ data })
    },
  })

export const calculateSeedsSchema = selectTournamentSchema
  .pick({
    id: true,
  })
  .extend({
    overwrite: z.boolean(),
  })

const calculateSeedsFn = createServerFn()
  .inputValidator(calculateSeedsSchema)
  .handler(async ({ data: { id: tournamentId, overwrite } }) => {
    const tournament = await db.query.tournaments.findFirst({
      with: {
        tournamentDivisions: {
          with: {
            teams: true,
          },
        },
      },
      where: (t, { eq }) => eq(t.id, tournamentId),
    })

    if (!tournament) {
      throw notFound()
    }

    const hasSeeds = tournament.tournamentDivisions.some((division) =>
      division.teams.some((team) => team.seed !== null)
    )

    if (hasSeeds && !overwrite) {
      setResponseStatus(400)

      throw new Error(
        'Seeds are already set for this tournament. If you intended to redo the seeding, select "Overwrite existing".'
      )
    }

    const updates = await db
      .select({
        id: tournamentDivisionTeams.id,
        tournamentDivisionId: tournamentDivisionTeams.tournamentDivisionId,
        weight: sql<number>`SUM(COALESCE(${levels.order}, 0))`,
        totalRank: sql<number>`SUM(${playerProfiles.rank})`,
        seed: sql<number>`ROW_NUMBER() OVER (
          PARTITION BY ${tournamentDivisionTeams.tournamentDivisionId}
          ORDER BY SUM(COALESCE(${levels.order}, 0)) DESC, SUM(${playerProfiles.rank}) ASC
        )`,
      })
      .from(tournamentDivisionTeams)
      .innerJoin(teams, eq(tournamentDivisionTeams.teamId, teams.id))
      .innerJoin(teamPlayers, eq(teams.id, teamPlayers.teamId))
      .innerJoin(
        playerProfiles,
        eq(teamPlayers.playerProfileId, playerProfiles.id)
      )
      .leftJoin(levels, eq(playerProfiles.levelId, levels.id))
      .innerJoin(
        tournamentDivisions,
        eq(tournamentDivisionTeams.tournamentDivisionId, tournamentDivisions.id)
      )
      .where(eq(tournamentDivisions.tournamentId, tournamentId))
      .groupBy(
        tournamentDivisionTeams.id,
        tournamentDivisionTeams.tournamentDivisionId
      )

    const seeded = await db.transaction(async (txn) => {
      return await Promise.all(
        updates.map(({ id, seed }) =>
          txn
            .update(tournamentDivisionTeams)
            .set({ seed })
            .where(eq(tournamentDivisionTeams.id, id))
            .returning({
              id: tournamentDivisionTeams.id,
              seed: tournamentDivisionTeams.seed,
            })
        )
      )
    })

    return seeded.flat()
  })

export const calculateSeedsMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof calculateSeedsSchema>) =>
      calculateSeedsFn({ data }),
  })
