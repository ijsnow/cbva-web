import {
  type QueryKey,
  queryOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { createServerFn, useServerFn } from "@tanstack/react-start"

import { db, type UpdateVenue, venues } from "@/db"

async function readVenues() {
  return await db.query.venues.findMany({
    where: (venues, { eq }) => eq(venues.status, "active"),
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

export function useVenues(
  // options: Omit<UseQueryOptions<Venue[], unknown>, "queryFn" | "queryKey">,
  options: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof readVenues>>, unknown>,
    "queryFn" | "queryKey"
  > = {}
) {
  const fetchVenues = useServerFn(getVenues)

  return useQuery({
    ...options,
    queryKey: ["venues"],
    queryFn: () => fetchVenues(),
  })
}

export const updateVenueFn = createServerFn({ method: "POST" })
  .inputValidator(({ directions, description }: UpdateVenue) => ({
    directions,
    description,
  }))
  .handler(async ({ data }) => {
    await db.update(venues).set(data)
  })

export function useUpdateVenueFn() {
  return useServerFn(updateVenueFn)
}

export function useUpdateVenue(deps: QueryKey[] = []) {
  const mutationFn = useServerFn(updateVenueFn)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateVenue) => {
      return mutationFn({ data: input })
    },
    onSuccess: () => {
      for (const key of deps) {
        queryClient.invalidateQueries({
          queryKey: key,
        })
      }
    },
  })
}
