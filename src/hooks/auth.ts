import { useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"

import type { Viewer } from "@/auth"
import { authClient } from "@/auth/client"
import type { FileRouteTypes } from "@/routeTree.gen"

export function useRedirect(
  to: FileRouteTypes["to"],
  predicate: boolean | undefined
) {
  const navigate = useNavigate()

  useEffect(() => {
    if (predicate === true) {
      navigate({
        replace: true,
        to,
      })
    }
  }, [predicate, navigate, to])
}

export function useViewer(): Viewer | null | undefined {
  const { data: session, isPending } = authClient.useSession()

  return isPending ? undefined : ((session?.user ?? null) as Viewer | null)
}

export function useLoggedInRedirect(to: FileRouteTypes["to"]) {
  const viewer = useViewer()

  useRedirect(to, Boolean(viewer))
}

export function useNotLoggedInRedirect(to: FileRouteTypes["to"]) {
  const viewer = useViewer()

  useRedirect(to, viewer === null)
}
