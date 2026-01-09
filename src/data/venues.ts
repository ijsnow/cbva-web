import {
  mutationOptions,
  queryOptions,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { linkOptions, notFound, useRouterState } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import z from "zod"
import { authMiddleware, requirePermissions } from "@/auth/shared"
import { db } from "@/db/connection"
import { selectVenueSchema, updateVenueSchema, venues } from "@/db/schema"

async function readVenues() {
  return await db.query.venues.findMany({
    where: (venues, { eq }) => eq(venues.status, "active"),
    orderBy: (venues, { asc }) => [asc(venues.city), asc(venues.name)],
  })
}

const getVenues = createServerFn({
  method: "GET",
}).handler(() => readVenues())

export const venuesQueryOptions = () =>
  queryOptions({
    queryKey: ["venues"],
    queryFn: () => getVenues(),
  })

export function useVenueFilterOptions(link?: boolean) {
  const { location } = useRouterState()

  const { data: venues } = useSuspenseQuery({
    ...venuesQueryOptions(),
    select: (data) =>
      data.map(({ id, name, city }) => ({
        value: id,
        display: `${name}, ${city}`,
        link: link
          ? linkOptions({
              to: location.pathname,
              search: (search) => {
                const values = search.venues ?? []

                return {
                  ...search,
                  page: 1,
                  venues: values.includes(id)
                    ? values.filter((v) => v !== id)
                    : values.concat(id),
                }
              },
            })
          : undefined,
      })),
  })

  return venues
}

export const updateVenueFnSchema = updateVenueSchema
  .pick({
    directions: true,
    description: true,
    headerImageSource: true,
    thumbnailImageSource: true,
  })
  .extend({
    id: z.number(),
  })

export const updateVenueFn = createServerFn({ method: "POST" })
  .middleware([
    requirePermissions({
      venues: ["update"],
    }),
  ])
  .inputValidator(updateVenueFnSchema)
  .handler(async ({ data: { id, ...values } }) => {
    await db.update(venues).set(values).where(eq(venues.id, id))
  })

export const updateVenueMutationOptions = () =>
  mutationOptions({
    mutationFn: async (input: z.infer<typeof updateVenueFnSchema>) => {
      return updateVenueFn({ data: input })
    },
  })

export const getVenue = createServerFn({
  method: "GET",
})
  .middleware([authMiddleware])
  .inputValidator(selectVenueSchema.pick({ id: true }))
  .handler(async ({ data: { id }, context: { viewer } }) => {
    const venue = await db.query.venues.findFirst({
      with: {
        directors: {
          with: {
            director: {
              with: {
                profile: true,
              },
            },
          },
        },
      },
      where: (venues, { and, eq }) => {
        const filters = [eq(venues.id, id)]

        if (viewer?.role === "admin") {
          filters.push(eq(venues.status, "active"))
        }

        return and(...filters)
      },
      orderBy: (venues, { asc }) => asc(venues.city),
    })

    if (!venue) {
      throw notFound()
    }

    return venue
  })

export const venueQueryOptions = (id: number) =>
  queryOptions({
    queryKey: ["venue", id],
    queryFn: () => getVenue({ data: { id } }),
  })
