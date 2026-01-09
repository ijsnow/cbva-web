import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm"
import z from "zod"
import { requirePermissions } from "@/auth/shared"
import { db } from "@/db/connection"
import { playerProfiles } from "@/db/schema/player-profiles"
import { tournamentDirectors } from "@/db/schema/tournament-directors"
import { tournaments } from "@/db/schema/tournaments"
import { venues } from "@/db/schema/venues"

export const getTournamentsByDirectorsSchema = z.object({
  directorIds: z.array(z.number()).optional(),
  past: z.boolean().optional(),
})

export const getTournamentsByDirectors = createServerFn()
  .middleware([
    requirePermissions({
      tournament: ["update"],
    }),
  ])
  .inputValidator(getTournamentsByDirectorsSchema)
  .handler(async ({ data: { directorIds, past }, context: { viewer } }) => {
    // Get director IDs to filter by
    let targetDirectorIds = directorIds

    // If no directorIds provided, get the current viewer's director ID
    if (!targetDirectorIds && viewer) {
      const directorRecord = await db.query.directors.findFirst({
        where: (table, { eq, exists }) =>
          exists(
            db
              .select()
              .from(playerProfiles)
              .where(
                and(
                  eq(playerProfiles.id, table.profileId),
                  eq(playerProfiles.userId, viewer.id)
                )
              )
          ),
      })

      if (directorRecord) {
        targetDirectorIds = [directorRecord.id]
      }
    }

    // If still no director IDs, return empty array
    if (!targetDirectorIds || targetDirectorIds.length === 0) {
      return []
    }

    // Build date filter
    const today = sql`CURRENT_DATE`
    const dateFilter = past
      ? lt(tournaments.date, today)
      : gte(tournaments.date, today)

    console.log({ past })

    // Query tournaments by director IDs
    const results = await db
      .selectDistinct({
        id: tournaments.id,
        name: tournaments.name,
        date: tournaments.date,
        startTime: tournaments.startTime,
        visible: tournaments.visible,
        venueId: tournaments.venueId,
        externalRef: tournaments.externalRef,
        venue: {
          id: venues.id,
          name: venues.name,
          city: venues.city,
        },
      })
      .from(tournaments)
      .innerJoin(
        tournamentDirectors,
        eq(tournaments.id, tournamentDirectors.tournamentId)
      )
      .innerJoin(venues, eq(tournaments.venueId, venues.id))
      .where(
        and(
          inArray(tournamentDirectors.directorId, targetDirectorIds),
          dateFilter
        )
      )
      .orderBy(tournaments.date)

    return results
  })

export const getTournamentsByDirectorsOptions = (
  data: z.infer<typeof getTournamentsByDirectorsSchema> = {}
) =>
  queryOptions({
    queryKey: ["getTournamentsByDirectors", JSON.stringify(data)],
    queryFn: () => getTournamentsByDirectors({ data }),
  })
