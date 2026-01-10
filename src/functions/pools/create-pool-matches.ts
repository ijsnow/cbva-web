import { mutationOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { setResponseStatus } from "@tanstack/react-start/server"
import { eq, inArray } from "drizzle-orm"
import range from "lodash-es/range"
import z from "zod"

import { requirePermissions } from "@/auth/shared"
import { db } from "@/db/connection"
import {
  type CreateMatchSet,
  type CreatePoolMatch,
  type CreatePoolTeam,
  matchSets,
  type PoolTeam,
  poolMatches,
  pools,
  poolTeams,
  selectPoolSchema,
  selectTournamentDivisionSchema,
} from "@/db/schema"
import { matchRefTeams } from "@/db/schema/match-ref-teams"
import { getPoolStats } from "@/hooks/matches"
import { badRequest, internalServerError } from "@/lib/responses"
import { snake } from "@/lib/snake-draft"

const POOL_MATCH_SETTINGS: {
  [teamCount: number]: { sets: number[]; matches: [number, number, number][] }
} = {
  3: {
    sets: [21, 21, 15],
    matches: [
      [2, 3, 1],
      [1, 3, 2],
      [1, 2, 3],
    ],
  },
  4: {
    sets: [28],
    matches: [
      [2, 4, 3],
      [1, 3, 4],
      [2, 3, 1],
      [1, 4, 3],
      [3, 4, 2],
      [1, 2, 4],
    ],
  },
  5: {
    sets: [21],
    matches: [
      [3, 5, 2],
      [1, 4, 3],
      [2, 5, 4],
      [3, 1, 5],
      [4, 2, 3],
      [5, 1, 4],
      [3, 2, 1],
      [4, 5, 3],
      [1, 2, 5],
      [3, 4, 2],
    ],
  },
  6: {
    sets: [21],
    matches: [
      [3, 4, 2],
      [1, 5, 2],
      [1, 6, 3],
      [2, 5, 3],
      [2, 4, 5],
      [3, 6, 5],
      [1, 4, 6],
      [2, 3, 6],
      [5, 6, 4],
      [1, 3, 4],
      [2, 6, 1],
      [4, 5, 1],
      [1, 2, 4],
      [3, 5, 6],
      [4, 6, 5],
    ],
  },
  7: {
    sets: [21],
    matches: [
      [3, 4, 6],
      [1, 5, 6],
      [2, 7, 5],
      [1, 6, 5],
      [2, 5, 3],
      [4, 7, 3],
      [2, 4, 1],
      [3, 6, 1],
      [5, 7, 2],
      [1, 4, 2],
      [2, 3, 4],
      [1, 7, 4],
      [5, 6, 7],
      [1, 3, 7],
      [2, 6, 5],
      [3, 7, 1],
      [4, 5, 7],
      [1, 2, 6],
      [6, 7, 2],
      [3, 5, 4],
      [4, 6, 3],
    ],
  },
}

export const createPoolMatchesSchema = selectTournamentDivisionSchema
  .pick({
    tournamentId: true,
  })
  .extend({
    overwrite: z.boolean(),
  })

export const createPoolMatchesFn = createServerFn()
  .middleware([
    requirePermissions({
      tournament: ["update"],
    }),
  ])
  .inputValidator(createPoolMatchesSchema)
  .handler(async ({ data: { tournamentId, overwrite } }) => {
    const divisions = await db._query.tournamentDivisions.findMany({
      with: {
        tournament: {
          columns: {
            startTime: true,
          },
        },
        pools: {
          with: {
            teams: true,
          },
        },
      },
      where: (t, { eq }) => eq(t.tournamentId, tournamentId),
    })

    // const pools = await db._query.pools.findMany({
    //   with: {
    //     teams: true,
    //   },
    //   where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId)
    // })

    if (overwrite) {
      await db
        .delete(poolMatches)
        // TODO: consider delete pool matches where pool.tournamentDivisionId eq to ensure no dangling matches
        .where(
          inArray(
            poolMatches.poolId,
            divisions.flatMap((division) => division.pools.map(({ id }) => id))
          )
        )
    }

    const matchValues: CreatePoolMatch[] = []
    const refValues: {
      poolId: number
      matchNumber: number
      refTeamId: number
    }[] = []

    const poolMatchSetsSettings: { [id: number]: number[] } = {}

    for (const division of divisions) {
      for (const { id, teams } of division.pools) {
        if (![3, 4, 5, 6, 7].includes(teams.length)) {
          throw badRequest("Invalid pool size; expected 3, 4, 5, 6, or 7.")
        }

        const { sets, matches } =
          POOL_MATCH_SETTINGS[teams.length as 3 | 4 | 5 | 6 | 7]

        poolMatchSetsSettings[id] = sets

        for (const [
          matchIdx,
          [teamASeed, teamBSeed, refTeamSeed],
        ] of matches.entries()) {
          const teamAId = teams.find((team) => teamASeed === team.seed)?.teamId
          const teamBId = teams.find((team) => teamBSeed === team.seed)?.teamId
          const refTeamId = teams.find(
            (team) => refTeamSeed === team.seed
          )?.teamId

          if (!(teamAId && teamBId && refTeamId)) {
            throw internalServerError(
              `Could not find teams for seeds while creating pool matches; pool_size=${teams.length}`
            )
          }

          const matchNumber = matchIdx + 1

          matchValues.push({
            poolId: id,
            matchNumber,
            teamAId,
            teamBId,
            scheduledTime:
              matchIdx === 0 ? division.tournament.startTime : null,
          })

          refValues.push({
            poolId: id,
            matchNumber,
            refTeamId,
          })
        }
      }
    }

    // Create pool matches first and get their IDs
    const createdMatches = await db
      .insert(poolMatches)
      .values(matchValues)
      .returning({
        id: poolMatches.id,
        poolId: poolMatches.poolId,
        matchNumber: poolMatches.matchNumber,
      })

    await db.insert(matchRefTeams).values(
      refValues.map(({ poolId, matchNumber, refTeamId }) => ({
        poolMatchId: createdMatches.find(
          (match) =>
            match.poolId === poolId && match.matchNumber === matchNumber
        )?.id,
        teamId: refTeamId,
      }))
    )

    // Now create match sets with correct poolMatchId references
    const setValues: CreateMatchSet[] = createdMatches.flatMap(
      ({ id, poolId }) =>
        poolMatchSetsSettings[poolId].map((winScore, setIdx) => ({
          poolMatchId: id,
          setNumber: setIdx + 1,
          winScore,
        }))
    )

    await db.insert(matchSets).values(setValues)

    return {
      success: true as true,
    }
  })

export const createPoolMatchesMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof createPoolMatchesSchema>) =>
      createPoolMatchesFn({ data }),
  })
