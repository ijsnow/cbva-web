import { db } from "@/db/connection"
import {
  PoolTeam,
  poolTeams,
  selectTournamentDivisionTeamSchema,
  TournamentDivisionTeam,
  tournamentDivisionTeams,
  Transaction,
} from "@/db/schema"
import { notFound } from "@/lib/responses"
import { mutationOptions } from "@tanstack/react-query"
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start"
import { and, eq, gte, lt, lte, gt, sql, not } from "drizzle-orm"
import z from "zod"

export const editSeedSchema = selectTournamentDivisionTeamSchema
  .pick({
    id: true,
  })
  .extend({
    seed: z.number().int().positive(),
    target: z.enum(["division", "pool"]),
  })

export const editSeedTransaction = createServerOnlyFn(
  async (
    txn: Transaction,
    team: TournamentDivisionTeam & { poolTeam: PoolTeam },
    seed: number,
    target: "division" | "pool"
  ) => {
    const currentSeed = target === "division" ? team.seed : team.poolTeam.seed

    const groupFilter =
      target === "division"
        ? eq(
            tournamentDivisionTeams.tournamentDivisionId,
            team.tournamentDivisionId
          )
        : eq(poolTeams.poolId, team.poolTeam.poolId)

    const targetTable =
      target === "division" ? tournamentDivisionTeams : poolTeams

    const targetId = target === "division" ? team.id : team.poolTeam.id

    if (currentSeed) {
      if (seed < currentSeed) {
        // Moving up (to a lower seed number): shift teams down
        // Teams with seeds >= new seed AND < current seed move down by 1
        await txn
          .update(targetTable)
          .set({
            seed: sql`${targetTable.seed} + 1`,
          })
          .where(
            and(
              groupFilter,
              not(eq(targetTable.id, targetId)),
              gte(targetTable.seed, seed),
              lt(targetTable.seed, currentSeed)
            )
          )
      } else {
        // Moving down (to a higher seed number): shift teams up
        // Teams with seeds > current seed AND <= new seed move up by 1
        await txn
          .update(targetTable)
          .set({
            seed: sql`${targetTable.seed} - 1`,
          })
          .where(
            and(
              groupFilter,
              not(eq(targetTable.id, targetId)),
              gt(targetTable.seed, currentSeed),
              lte(targetTable.seed, seed)
            )
          )
      }
    }

    await txn
      .update(targetTable)
      .set({ seed })
      .where(eq(targetTable.id, targetId))
  }
)

export const editSeed = createServerFn()
  .inputValidator(editSeedSchema)
  .handler(async ({ data: { id, seed, target } }) => {
    const targetTeam = await db._query.tournamentDivisionTeams.findFirst({
      with: {
        poolTeam: true,
      },
      where: (table, { eq }) => eq(table.id, id),
    })

    if (!targetTeam) {
      throw notFound()
    }

    await db.transaction((txn) =>
      editSeedTransaction(txn, targetTeam, seed, target)
    )

    return {
      success: true,
    }
  })

export const editSeedMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof editSeedSchema>) => editSeed({ data }),
  })
