import { requirePermissions } from "@/auth/shared"
import { db } from "@/db/connection"
import {
  selectTournamentDivisionSchema,
  tournamentDivisions,
} from "@/db/schema"
import { assertFound } from "@/lib/responses"
import { mutationOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import z from "zod"
import { promoteFromWaitlistTransaction } from "../teams/promote-from-waitlist"

export const setCapacitySchema = selectTournamentDivisionSchema
  .pick({
    id: true,
  })
  .extend({
    capacity: z.number().min(0),
    waitlistCapacity: z.number().min(0),
  })

export type SetCapacityParams = z.infer<typeof setCapacitySchema>

export const setCapacityFn = createServerFn({ method: "POST" })
  .middleware([
    requirePermissions({
      tournament: ["update"],
    }),
  ])
  .inputValidator(setCapacitySchema)
  .handler(async ({ data: { id, capacity, waitlistCapacity } }) => {
    const current = await db.query.tournamentDivisions.findFirst({
      with: {
        teams: {
          orderBy: (t, { asc }) => [asc(t.order), asc(t.createdAt)],
        },
      },
      where: (t, { eq }) => eq(t.id, id),
    })

    assertFound(current)

    await db.transaction(async (txn) => {
      await txn
        .update(tournamentDivisions)
        .set({
          capacity,
          waitlistCapacity,
        })
        .where(eq(tournamentDivisions.id, id))

      const waitlist = current.teams.filter(
        ({ status }) => status === "waitlisted"
      )

      if (capacity && capacity > current.capacity) {
        const promoteTeams = waitlist.slice(0, capacity - current.capacity)

        await promoteFromWaitlistTransaction(
          txn,
          promoteTeams.map(({ id }) => id)
        )
      }
    })

    return {
      success: true,
    }
  })

export const setCapacityMutationOptions = () =>
  mutationOptions({
    mutationFn: async (data: SetCapacityParams) => {
      return setCapacityFn({ data })
    },
  })
