import { mutationOptions, queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { and, eq, sql } from "drizzle-orm"
import type z from "zod"
import { requirePermissions } from "@/auth/shared"
import { db } from "@/db/connection"
import {
  createTournamentDirectorSchema,
  createVenueDirectorSchema,
  selectTournamentDirectorSchema,
  selectVenueDirectorSchema,
  tournamentDirectors,
  venueDirectors,
} from "@/db/schema"

async function readDirectors() {
  return await db._query.directors.findMany({
    with: {
      profile: true,
    },
  })
}

const getDirectors = createServerFn({
  method: "GET",
}).handler(() => readDirectors())

export const directorsQueryOptions = () =>
  queryOptions({
    queryKey: ["directors"],
    queryFn: () => getDirectors(),
  })

export const insertTournamentDirectorFn = createServerFn({ method: "POST" })
  .inputValidator(createTournamentDirectorSchema)
  .handler(async ({ data: { tournamentId, directorId } }) => {
    const [res] = await db
      .insert(tournamentDirectors)
      .values({
        tournamentId,
        directorId,
        order: sql`(SELECT COALESCE(MAX("order"), 0) + 1 FROM ${tournamentDirectors} WHERE "tournament_id" = ${tournamentId})`,
      })
      .returning({
        id: tournamentDirectors.id,
      })

    const created = await db._query.tournamentDirectors.findFirst({
      where: (t, { eq }) => eq(t.id, res.id),
      with: {
        director: {
          with: {
            profile: true,
          },
        },
      },
    })

    if (!created) {
      throw new Error("Expected to find newly created TournamentDirector.")
    }

    return created
  })

export const insertTournamentDirectorMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof createTournamentDirectorSchema>) =>
      insertTournamentDirectorFn({ data }),
  })

const deleteTournamentDirectorSchema = selectTournamentDirectorSchema.pick({
  id: true,
  tournamentId: true,
})

export const deleteTournamentDirectorFn = createServerFn({ method: "POST" })
  .middleware([
    requirePermissions({
      tournament: ["update"],
    }),
  ])
  .inputValidator(deleteTournamentDirectorSchema)
  .handler(async ({ data }) => {
    const remainingDirectors = await db
      .select()
      .from(tournamentDirectors)
      .where(eq(tournamentDirectors.tournamentId, data.tournamentId))

    if (remainingDirectors.length <= 1) {
      throw new Error(
        "Cannot delete the last tournament director for a tournament"
      )
    }

    await db
      .delete(tournamentDirectors)
      .where(
        and(
          eq(tournamentDirectors.id, data.id),
          eq(tournamentDirectors.tournamentId, data.tournamentId)
        )
      )
  })

export const deleteTournamentDirectorMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof deleteTournamentDirectorSchema>) =>
      deleteTournamentDirectorFn({ data }),
  })

export const insertVenueDirectorFn = createServerFn({ method: "POST" })
  .inputValidator(createVenueDirectorSchema)
  .handler(async ({ data }) => {
    const [res] = await db.insert(venueDirectors).values(data).returning({
      id: venueDirectors.id,
    })

    const created = await db._query.venueDirectors.findFirst({
      where: (t, { eq }) => eq(t.id, res.id),
      with: {
        director: {
          with: {
            profile: true,
          },
        },
      },
    })

    if (!created) {
      throw new Error("Expected to find newly created VenueDirector.")
    }

    return created
  })

export const insertVenueDirectorMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof createVenueDirectorSchema>) =>
      insertVenueDirectorFn({ data }),
  })

const deleteVenueDirectorSchema = selectVenueDirectorSchema.pick({
  id: true,
  venueId: true,
})

export const deleteVenueDirectorFn = createServerFn({ method: "POST" })
  .middleware([
    requirePermissions({
      tournament: ["update"],
    }),
  ])
  .inputValidator(deleteVenueDirectorSchema)
  .handler(async ({ data }) => {
    const remainingDirectors = await db
      .select()
      .from(venueDirectors)
      .where(eq(venueDirectors.venueId, data.venueId))

    if (remainingDirectors.length <= 1) {
      throw new Error(
        "Cannot delete the last tournament director for a tournament"
      )
    }

    await db
      .delete(venueDirectors)
      .where(
        and(
          eq(venueDirectors.id, data.id),
          eq(venueDirectors.venueId, data.venueId)
        )
      )
  })

export const deleteVenueDirectorMutationOptions = () =>
  mutationOptions({
    mutationFn: (data: z.infer<typeof deleteVenueDirectorSchema>) =>
      deleteVenueDirectorFn({ data }),
  })
