import { db } from "@/db/connection"
import {
  pools,
  poolTeams,
  selectTournamentDivisionTeamSchema,
  tournamentDivisions,
  tournamentDivisionTeams,
  Transaction,
} from "@/db/schema"
import { mutationOptions } from "@tanstack/react-query"
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start"
import { and, eq, inArray } from "drizzle-orm"
import z from "zod"
import { editSeedTransaction } from "./edit-seed"
import { assertFound, notFound } from "@/lib/responses"
import { updatePoolTransaction } from "./update-pool"
import { calculateSeedsFn } from "./calculate-seeds"
import { createPoolsFn } from "../pools"

export const promoteFromWaitlistSchema = selectTournamentDivisionTeamSchema
  .pick({
    id: true,
    seed: true,
  })
  .extend({
    automatic: z.boolean(),
    poolId: z.number().optional().nullable(),
    poolSeed: z.number().optional().nullable(),
  })

export const promoteFromWaitlistTransaction = createServerOnlyFn(
  async (txn: Transaction, teamIds: number[]) => {
    await txn
      .update(tournamentDivisionTeams)
      .set({
        status: "confirmed",
      })
      .where(inArray(tournamentDivisionTeams.id, teamIds))
  }
)

export const promoteFromWaitlist = createServerFn()
  .inputValidator(promoteFromWaitlistSchema)
  .handler(async ({ data: { id, automatic, seed, poolId, poolSeed } }) => {
    const team = await db.query.tournamentDivisionTeams.findFirst({
      with: {
        poolTeam: true,
        tournamentDivision: {
          columns: {
            tournamentId: true,
            capacity: true,
          },
        },
      },
      where: (t, { eq }) => eq(t.id, id),
    })

    assertFound(!team)

    await db.transaction(async (txn) => {
      await promoteFromWaitlistTransaction(txn, [team.id])

      const requiredCapacity = await txn.$count(
        tournamentDivisionTeams,
        and(
          eq(
            tournamentDivisionTeams.tournamentDivisionId,
            team.tournamentDivisionId
          ),
          inArray(tournamentDivisionTeams.status, ["registered", "confirmed"])
        )
      )

      if (requiredCapacity > team.tournamentDivision.capacity) {
        await txn
          .update(tournamentDivisions)
          .set({
            capacity: requiredCapacity,
          })
          .where(eq(tournamentDivisions.id, team.tournamentDivisionId))
      }

      if (automatic) {
        return
      }

      if (seed) {
        await editSeedTransaction(txn, team, seed, "division")
      }

      if (poolId) {
        await txn.insert(poolTeams).values({
          teamId: id,
          poolId,
        })

        await updatePoolTransaction(txn, team, poolId, poolSeed)
      }
    })

    if (automatic) {
      await calculateSeedsFn({
        data: {
          id: team.tournamentDivision.tournamentId,
          tournamentDivisionIds: [team.tournamentDivisionId],
          overwrite: true,
        },
      })

      const poolCount = await db.$count(
        pools,
        eq(pools.tournamentDivisionId, team.tournamentDivisionId)
      )

      if (poolCount > 0) {
        await createPoolsFn({
          data: {
            id: team.tournamentDivisionId,
            count: poolCount,
            overwrite: true,
          },
        })
      }
    }

    return {
      success: true,
    }
  })

export const promoteFromWaitlistMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof promoteFromWaitlistSchema>) =>
      promoteFromWaitlist({ data }),
  })
