import { db } from "@/db/connection"
import {
  type Transaction,
  type PoolTeam,
  poolTeams,
  selectMatchRefTeamSchema,
  type TournamentDivisionTeam,
  tournamentDivisionTeams,
  poolMatches,
} from "@/db/schema"
import { assertFound } from "@/lib/responses"
import { mutationOptions } from "@tanstack/react-query"
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start"
import { eq, isNotNull } from "drizzle-orm"
import z from "zod"
import { promoteFromWaitlistTransaction } from "./promote-from-waitlist"
import { requirePermissions } from "@/auth/shared"
import { isDefined } from "@/utils/types"

const replaceTeamTransaction = createServerOnlyFn(
  async (
    txn: Transaction,
    originalTeam: TournamentDivisionTeam & { poolTeam: PoolTeam },
    replacementTeamId: number
  ) => {
    const replacementTeam = await db._query.tournamentDivisionTeams.findFirst({
      where: (t, { eq }) => eq(t.id, replacementTeamId),
    })

    assertFound(replacementTeam)

    await txn
      .update(tournamentDivisionTeams)
      .set({
        seed: originalTeam.seed,
        status: "confirmed",
      })
      .where(eq(tournamentDivisionTeams.id, replacementTeamId))

    await txn
      .update(poolTeams)
      .set({
        teamId: replacementTeamId,
      })
      .where(eq(poolTeams.id, originalTeam.poolTeam.id))

    await txn
      .update(poolMatches)
      .set({
        teamAId: replacementTeamId,
      })
      .where(eq(poolMatches.teamAId, originalTeam.id))

    await txn
      .update(poolMatches)
      .set({
        teamBId: replacementTeamId,
      })
      .where(eq(poolMatches.teamBId, originalTeam.id))
  }
)

export const removeTeamSchema = selectMatchRefTeamSchema
  .pick({
    id: true,
  })
  .extend({
    late: z.boolean().optional(),
    replace: z.boolean().optional(),
    replacementTeamId: z.number().nullable().optional(),
  })

export const removeTeam = createServerFn()
  .middleware([
    requirePermissions({
      tournament: ["update"],
    }),
  ])
  .inputValidator(removeTeamSchema)
  .handler(async ({ data: { id, late, replacementTeamId } }) => {
    const team = await db._query.tournamentDivisionTeams.findFirst({
      with: {
        poolTeam: true,
        tournamentDivision: {
          columns: {
            tournamentId: true,
            capacity: true,
            autopromoteWaitlist: true,
          },
        },
      },
      where: (t, { eq }) => eq(t.id, id),
    })

    assertFound(team)

    await db.transaction(async (txn) => {
      await txn
        .update(tournamentDivisionTeams)
        .set({
          status: late ? "late-withdraw" : "withdraw",
        })
        .where(eq(tournamentDivisionTeams.id, id))

      if (isDefined(replacementTeamId)) {
        return await replaceTeamTransaction(txn, team, replacementTeamId)
      }

      // Check if autopromoteWaitlist is enabled, if so, promote a team
      if (
        !late &&
        ["registered", "confirmed"].includes(team.status) &&
        team.tournamentDivision.autopromoteWaitlist
      ) {
        const seededCount = await txn.$count(
          tournamentDivisionTeams,
          isNotNull(tournamentDivisionTeams.seed)
        )

        if (seededCount === 0) {
          const nextWaitlistedTeam =
            await txn.query.tournamentDivisionTeams.findFirst({
              where: (t, { eq, and }) =>
                and(
                  eq(t.tournamentDivisionId, team.tournamentDivisionId),
                  eq(t.status, "waitlisted")
                ),
              orderBy: (t, { asc }) => [asc(t.order), asc(t.createdAt)],
            })

          if (nextWaitlistedTeam) {
            await promoteFromWaitlistTransaction(txn, [nextWaitlistedTeam.id])
          }
        }
      }

      await txn.delete(poolTeams).where(eq(poolTeams.teamId, id))
    })

    return {
      success: true,
    }
  })

export const removeTeamMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof removeTeamSchema>) =>
      removeTeam({ data }),
  })
