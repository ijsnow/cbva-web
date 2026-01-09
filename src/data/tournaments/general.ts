import { mutationOptions, queryOptions } from "@tanstack/react-query"
import { notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { and, eq, ne } from "drizzle-orm"
import z from "zod"
import { requirePermissions } from "@/auth/shared"
import { db } from "@/db/connection"
import {
  selectTournamentSchema,
  tournamentDirectors,
  tournamentDivisions,
  tournaments,
  venueDirectors,
} from "@/db/schema"
import { isNotNullOrUndefined } from "@/utils/types"

export const getTournament = createServerFn({
  method: "GET",
})
  .inputValidator(selectTournamentSchema.pick({ id: true }))
  .handler(async ({ data: { id } }) => {
    const res = await db.query.tournaments.findFirst({
      where: (table, { eq }) => eq(table.id, id),
      with: {
        venue: {
          with: {
            director: true,
          },
        },
        directors: {
          with: {
            director: {
              with: {
                profile: true,
              },
            },
          },
          orderBy: (t, { asc }) => asc(t.order),
        },
        tournamentDivisions: {
          with: {
            division: true,
            requirements: true,
          },
        },
      },
    })

    return res
  })

export const tournamentQueryOptions = (id?: number) =>
  queryOptions({
    queryKey: ["tournament", id],
    queryFn: () => {
      if (id) {
        return getTournament({ data: { id: id as number } })
      }

      return null
    },
  })

export const upsertTournamentSchema = selectTournamentSchema
  .pick({
    name: true,
    date: true,
    startTime: true,
    venueId: true,
  })
  .extend({
    id: z.number().optional(),
  })

export type UpsertTournamentParams = z.infer<typeof upsertTournamentSchema>

export const upsertTournamentFn = createServerFn({ method: "POST" })
  .middleware([
    requirePermissions({
      tournament: ["update"],
    }),
  ])
  .inputValidator(upsertTournamentSchema)
  .handler(
    async ({ data: { id: tournamentId, name, date, startTime, venueId } }) => {
      if (isNotNullOrUndefined(tournamentId)) {
        const results = await db
          .select({ venueId: tournaments.venueId })
          .from(tournaments)
          .where(eq(tournaments.id, tournamentId))
          .limit(1)

        if (!results.length) {
          throw notFound()
        }

        const [current] = results

        const [{ id }] = await db
          .update(tournaments)
          .set({
            name,
            date,
            startTime,
            venueId,
          })
          .where(eq(tournaments.id, tournamentId))
          .returning({
            id: tournaments.id,
          })

        if (venueId !== current.venueId) {
          await db
            .delete(tournamentDirectors)
            .where(eq(tournamentDirectors.tournamentId, tournamentId))

          const directors = await db
            .select()
            .from(venueDirectors)
            .where(eq(venueDirectors.venueId, venueId))

          await db.insert(tournamentDirectors).values(
            directors.map(({ id, venueId, ...values }) => ({
              ...values,
              tournamentId,
            }))
          )
        }

        return {
          success: true,
          data: { id },
        }
      }

      const [{ id }] = await db
        .insert(tournaments)
        .values({
          name,
          date,
          startTime,
          venueId,
        })
        .returning({
          id: tournaments.id,
        })

      const directors = await db
        .select()
        .from(venueDirectors)
        .where(eq(venueDirectors.venueId, venueId))

      await db.insert(tournamentDirectors).values(
        directors.map(({ id: _, venueId, ...values }) => ({
          ...values,
          tournamentId: id,
        }))
      )

      return {
        success: true,
        data: { id },
      }
    }
  )

export const upsertTournamentMutationOptions = () =>
  mutationOptions({
    mutationFn: async (data: UpsertTournamentParams) => {
      return upsertTournamentFn({ data })
    },
  })

export const editTournamentSchema = selectTournamentSchema
  .pick({
    id: true,
    date: true,
    startTime: true,
    venueId: true,
    name: true,
  })
  .extend({
    mergeDivisions: z.boolean(),
  })

export type EditTournamentParams = z.infer<typeof editTournamentSchema>

export const editTournamentFn = createServerFn({ method: "POST" })
  .middleware([
    requirePermissions({
      tournament: ["update"],
    }),
  ])
  .inputValidator(editTournamentSchema)
  .handler(
    async ({
      data: {
        id: tournamentId,
        name,
        date,
        startTime,
        venueId,
        mergeDivisions,
      },
    }) => {
      const results = await db
        .select({ venueId: tournaments.venueId })
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId))
        .limit(1)

      if (!results.length) {
        throw notFound()
      }

      const [current] = results

      await db.transaction(async (txn) => {
        await txn
          .update(tournaments)
          .set({
            name,
            date,
            startTime,
            venueId,
          })
          .where(eq(tournaments.id, tournamentId))

        if (venueId !== current.venueId) {
          await txn
            .delete(tournamentDirectors)
            .where(eq(tournamentDirectors.tournamentId, tournamentId))

          const directors = await txn
            .select()
            .from(venueDirectors)
            .where(eq(venueDirectors.venueId, venueId))

          if (directors.length) {
            await txn
              .insert(tournamentDirectors)
              .values(
                directors.map(({ id: _, venueId, ...values }) => ({
                  ...values,
                  tournamentId,
                }))
              )
              .returning({
                id: tournamentDirectors.id,
              })
          }
        }

        // If mergeDivisions is true, check for duplicate tournaments at same venue/date
        if (mergeDivisions) {
          const duplicates = await txn
            .select({ id: tournaments.id })
            .from(tournaments)
            .where(
              and(
                eq(tournaments.venueId, venueId),
                eq(tournaments.date, date),
                ne(tournaments.id, tournamentId)
              )
            )

          if (duplicates.length > 0) {
            const [duplicate] = duplicates

            // Get existing divisions in the target tournament
            const existingDivisions = await txn
              .select({
                divisionId: tournamentDivisions.divisionId,
                gender: tournamentDivisions.gender,
              })
              .from(tournamentDivisions)
              .where(eq(tournamentDivisions.tournamentId, tournamentId))

            // Get divisions from the duplicate tournament
            const duplicateDivisions = await txn
              .select({
                id: tournamentDivisions.id,
                divisionId: tournamentDivisions.divisionId,
                gender: tournamentDivisions.gender,
              })
              .from(tournamentDivisions)
              .where(eq(tournamentDivisions.tournamentId, duplicate.id))

            // Move divisions that don't conflict (different division or gender combination)
            for (const div of duplicateDivisions) {
              const hasConflict = existingDivisions.some(
                (existing) =>
                  existing.divisionId === div.divisionId &&
                  existing.gender === div.gender
              )

              if (hasConflict) {
                // Delete conflicting division from duplicate tournament
                await txn
                  .delete(tournamentDivisions)
                  .where(eq(tournamentDivisions.id, div.id))
              } else {
                // Move non-conflicting division to target tournament
                await txn
                  .update(tournamentDivisions)
                  .set({ tournamentId })
                  .where(eq(tournamentDivisions.id, div.id))
              }
            }

            // Delete the now-empty duplicate tournament
            await txn
              .delete(tournaments)
              .where(eq(tournaments.id, duplicate.id))
          }
        }
      })

      return {
        success: true,
      }
    }
  )

export const editTournamentMutationOptions = () =>
  mutationOptions({
    mutationFn: async (data: EditTournamentParams) => {
      return editTournamentFn({ data })
    },
  })

export const deleteTournamentSchema = selectTournamentSchema.pick({
  id: true,
})

export type DeleteTournamentParams = z.infer<typeof deleteTournamentSchema>

export const deleteTournamentFn = createServerFn({ method: "POST" })
  .middleware([
    requirePermissions({
      tournament: ["delete"],
    }),
  ])
  .inputValidator(deleteTournamentSchema)
  .handler(async ({ data: { id } }) => {
    // TODO: do checks to make sure the tournament is in the future and no one has signed up.

    await db.delete(tournaments).where(eq(tournaments.id, id))

    return {
      success: true,
    }
  })

export const deleteTournamentMutationOptions = () =>
  mutationOptions({
    mutationFn: async (data: EditTournamentParams) => {
      return deleteTournamentFn({ data })
    },
  })
