import { createFileRoute } from "@tanstack/react-router"
import { useViewerHasPermission } from "@/auth/shared"
import { useRedirect } from "@/hooks/auth"
import { DefaultLayout } from "@/layouts/default"

export const Route = createFileRoute("/tournaments/create")({
  validateSearch: (
    search: Record<string, unknown>
  ): {
    template?: number
  } => {
    return {
      template: search.template ? Number(search.template) : undefined,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const canCreate = useViewerHasPermission({
    tournament: ["create"],
  })

  useRedirect("/", !canCreate)

  return <DefaultLayout>Hello /tournaments/create! </DefaultLayout>
}
