import { mutationOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { setResponseStatus } from "@tanstack/react-start/server"
import { eq } from "drizzle-orm"
import range from "lodash-es/range"
import z from "zod"

import { requirePermissions } from "@/auth/shared"
import { db } from "@/db/connection"
import {
  type CreatePoolTeam,
  pools,
  poolTeams,
  selectTournamentDivisionSchema,
} from "@/db/schema"
import { badRequest } from "@/lib/responses"
import { snake } from "@/lib/snake-draft"

export const createPoolsSchema = selectTournamentDivisionSchema
  .pick({
    id: true,
  })
  .extend({
    count: z.number(),
    overwrite: z.boolean(),
  })

export const createPoolsFn = createServerFn()
  .middleware([
    requirePermissions({
      tournament: ["update"],
    }),
  ])
  .inputValidator(createPoolsSchema)
  .handler(async ({ data: { id: tournamentDivisionId, count, overwrite } }) => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz"

    if (count > alphabet.length) {
      setResponseStatus(400)

      throw new Error("Pool count exceeds limit")
    }

    await db.transaction(async (txn) => {
      if (overwrite) {
        await txn
          .delete(pools)
          .where(eq(pools.tournamentDivisionId, tournamentDivisionId))
      }

      const createdPools = await txn
        .insert(pools)
        .values(
          range(0, count).map((i) => ({
            tournamentDivisionId,
            name: alphabet[i],
          }))
        )
        .returning({
          id: pools.id,
          name: pools.name,
        })

      const teams = await txn.query.tournamentDivisionTeams.findMany({
        columns: {
          id: true,
          seed: true,
        },
        where: (t, { eq, inArray, and }) =>
          and(
            eq(t.tournamentDivisionId, tournamentDivisionId),
            inArray(t.status, ["confirmed", "registered"])
          ),
        orderBy: (t, { asc }) => asc(t.seed),
      })

      const draft = snake(teams.length, createdPools.length)

      const poolTeamValues: CreatePoolTeam[] = []

      for (const [poolIdx, pool] of draft.entries()) {
        for (const [seedIdx, seed] of pool.entries()) {
          const team = teams.find((team) => team.seed === seed)

          if (!team) {
            throw badRequest(
              "Missing team with seed. Have you calculated seeds yet?"
            )
          }

          poolTeamValues.push({
            teamId: team.id,
            poolId: createdPools[poolIdx].id,
            seed: seedIdx + 1,
          })
        }
      }

      await txn.insert(poolTeams).values(poolTeamValues)
    })
  })

export const createPoolsMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof createPoolsSchema>) =>
      createPoolsFn({ data }),
  })
