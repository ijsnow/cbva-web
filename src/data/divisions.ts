import { queryOptions, useSuspenseQuery } from "@tanstack/react-query"
import { linkOptions, useRouterState } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import type { Option } from "@/components/base/select"
import { db } from "@/db/connection"

async function readDivisions(includeJuniors = true) {
  return await db._query.divisions.findMany({
    where: includeJuniors ? undefined : (t, { isNull }) => isNull(t.maxAge),
  })
}

const getDivisions = createServerFn({
  method: "GET",
})
  .inputValidator(
    (data: { includeJuniors?: boolean } = { includeJuniors: true }) => data
  )
  .handler(async ({ data: { includeJuniors } }) => {
    return await readDivisions(includeJuniors)
  })

export const divisionsQueryOptions = (includeJuniors?: boolean) =>
  queryOptions({
    queryKey: ["divisions", includeJuniors],
    queryFn: () => {
      return getDivisions({ data: { includeJuniors } })
    },
  })

export function useDivisionFilterOptions<Link extends boolean>(
  link?: Link
): Option<number>[] {
  const { location } = useRouterState()

  const { data: divisions } = useSuspenseQuery({
    ...divisionsQueryOptions(),
    select: (divisions) =>
      divisions.map(({ id, display, name }) => ({
        value: id,
        display: display ?? name.toUpperCase(),
        link: link
          ? linkOptions({
              to: location.pathname,
              search: (search) => {
                const values = search.divisions ?? []

                return {
                  ...search,
                  page: 1,
                  divisions: values.includes(id)
                    ? values.filter((v) => v !== id)
                    : values.concat(id),
                }
              },
            })
          : undefined,
      })),
  })

  return divisions
}
