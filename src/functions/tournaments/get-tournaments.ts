import { authMiddleware, type SessionViewer } from "@/auth/shared"
import { tournamentListFilterSchema } from "@/components/tournaments/filters"
import { db } from "@/db/connection"
import { findPaged } from "@/db/pagination"
import { type TournamentDivision, tournamentDivisions } from "@/db/schema"
import { isNotNull } from "@/utils/types"
import { queryOptions } from "@tanstack/react-query"
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start"
import { sql } from "drizzle-orm"
import type z from "zod"

const getTournamentsSchema = tournamentListFilterSchema.pick({
  divisions: true,
  venues: true,
  past: true,
  page: true,
  pageSize: true,
  genders: true,
})

export const getTournamentsHandler = createServerOnlyFn(
  async (
    {
      page,
      pageSize,
      divisions,
      venues,
      genders,
      past,
    }: z.infer<typeof getTournamentsSchema>,
    viewer: SessionViewer | undefined
  ) => {
    const data = await findPaged("tournaments", {
      paging: { page, size: pageSize },
      config: {
        with: {
          venue: {
            columns: {
              id: true,
              name: true,
              city: true,
            },
          },
          tournamentDivisions: {
            with: {
              division: true,
              requirements: true,
            },
            where: (tournamentDivisions, { inArray, and }) => {
              const filters = []

              if (divisions.length) {
                filters.push(inArray(tournamentDivisions.divisionId, divisions))
              }

              if (genders.length) {
                filters.push(inArray(tournamentDivisions.gender, genders))
              }

              if (!filters.length) {
                return undefined
              }

              return and(...filters)
            },
          },
        },
        where: (tournaments, { sql, gt, lt, and, eq, inArray, exists }) => {
          const filters = [
            eq(tournaments.demo, false),
            viewer?.role === "admin" ? null : eq(tournaments.visible, true),
            past
              ? lt(
                  tournaments.date,
                  sql`current_date at time zone 'america/los_angeles'`
                )
              : gt(
                  tournaments.date,
                  sql`current_date at time zone 'america/los_angeles'`
                ),
          ].filter(isNotNull)

          if (divisions.length) {
            filters.push(
              exists(
                db
                  .select()
                  .from(tournamentDivisions)
                  .where(
                    and(
                      eq(tournaments.id, tournamentDivisions.tournamentId),
                      inArray(tournamentDivisions.divisionId, divisions)
                    )
                  )
              )
            )
          }

          if (genders.length) {
            filters.push(
              exists(
                db
                  .select()
                  .from(tournamentDivisions)
                  .where(
                    and(
                      eq(tournaments.id, tournamentDivisions.tournamentId),
                      inArray(tournamentDivisions.gender, genders)
                    )
                  )
              )
            )
          }

          if (venues.length) {
            filters.push(inArray(tournaments.venueId, venues))
          }

          return and(...filters)
        },
        orderBy: (table, { desc, asc }) => {
          const venueLocation = sql`(SELECT city || ' ' || name FROM venues WHERE id = ${table.venueId})`

          return past
            ? [desc(table.date), asc(venueLocation), desc(table.id)]
            : [asc(table.date), asc(venueLocation), asc(table.id)]
        },
      },
    })

    return data
  }
)

export const getTournaments = createServerFn({
  method: "GET",
})
  .inputValidator(getTournamentsSchema)
  .middleware([authMiddleware])
  .handler(async ({ data, context: { viewer } }) =>
    getTournamentsHandler(data, viewer)
  )

export const tournamentsQueryOptions = (data: {
  divisions: number[]
  venues: number[]
  past: boolean
  page: number
  pageSize: number
  genders: TournamentDivision["gender"][]
}) =>
  queryOptions({
    queryKey: ["tournaments", JSON.stringify(data)],
    queryFn: () => getTournaments({ data }),
  })
