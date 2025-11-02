import { queryOptions, useSuspenseQuery } from "@tanstack/react-query"
import { createMiddleware, createServerFn } from "@tanstack/react-start"
import { getViewer } from "./server"

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const viewer = await getViewer()

  return await next({
    context: {
      viewer: viewer
        ? {
            id: viewer.id,
          }
        : undefined,
    },
  })
})

export const getViewerId = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return context?.viewer?.id ?? null
  })

export const viewerIdQueryOptions = () =>
  queryOptions({
    queryKey: ["viewer", "id"],
    queryFn: () => getViewerId(),
  })

export function useViewerId() {
  const { data: id } = useSuspenseQuery(viewerIdQueryOptions())

  return id
}

export function useIsLoggedIn() {
  const { data: isLoggedIn } = useSuspenseQuery({
    ...viewerIdQueryOptions(),
    select: (id) => typeof id === "string",
  })

  return isLoggedIn
}

// export const getAvatar = createServerFn({ method: "GET" })
//   .middleware([authMiddleware])
//   .handler(async ({ context }) => {
//     return context?.user?.image;
//   });
