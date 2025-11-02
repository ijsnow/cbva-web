import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useCallback, useEffect } from "react"

import type { Viewer } from "@/auth"
import { authClient } from "@/auth/client"
import type { FileRouteTypes } from "@/routeTree.gen"

export async function fetchViewer() {
  const res = await fetch("/api/auth/viewer")

  const viewer = (await res.json()) as Viewer

  return viewer
}

export function useViewer(): Viewer | null | undefined {
  const { data: session, isPending } = authClient.useSession()

  return isPending ? undefined : ((session?.user ?? null) as Viewer | null)
}

export function useUpdateViewerCache() {
  const client = useQueryClient()

  return useCallback(
    (viewer: Viewer) => {
      client.setQueryData(["viewer"], () => viewer)
    },
    [client]
  )
}

export function useRedirect(to: FileRouteTypes["to"], predicate: boolean) {
  const navigate = useNavigate()

  useEffect(() => {
    if (predicate) {
      navigate({
        replace: true,
        to,
      })
    }
  }, [predicate, navigate, to])
}

export function useLoggedInRedirect(to: FileRouteTypes["to"]) {
  const viewer = useViewer()

  useRedirect(to, Boolean(viewer))
}

export function useNotLoggedInRedirect(to: FileRouteTypes["to"]) {
  const viewer = useViewer()

  useRedirect(to, viewer === null)
}

export function useViewerHasPermissions(
  ...permissions: string[]
): boolean | undefined {
  const viewer = useViewer()

  if (!viewer) {
    return undefined
  }

  throw new Error("not yet implemented")

  // return permissions.every((p) => viewer?.permissions.includes(p));
}
