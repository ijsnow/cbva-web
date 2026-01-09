import { createFileRoute, notFound, redirect } from "@tanstack/react-router"
import { roleHasPermission } from "@/auth/shared"
import { tournamentQueryOptions } from "@/data/tournaments"

export const Route = createFileRoute("/tournaments/$tournamentId/")({
  component: RouteComponent,
  validateSearch: (
    search: Record<string, unknown>
  ): {
    pools?: number[]
    courts?: string[]
  } => {
    return {
      pools: Array.isArray(search?.pools) ? search.pools : undefined,
      courts: Array.isArray(search?.courts) ? search.courts : undefined,
    }
  },
  loader: async ({
    params: { tournamentId },
    context: { queryClient, viewer },
  }) => {
    const tournament = await queryClient.ensureQueryData(
      tournamentQueryOptions(Number.parseInt(tournamentId, 10))
    )

    if (!tournament) {
      throw notFound()
    }

    if (tournament.tournamentDivisions.length) {
      const activeDivision = tournament.tournamentDivisions[0]

      throw redirect({
        to: "/tournaments/$tournamentId/$divisionId/{-$tab}",
        params: {
          tournamentId,
          divisionId: activeDivision.id.toString(),
        },
      })
    }

    const canEdit =
      viewer &&
      roleHasPermission(viewer.role, {
        tournament: ["update"],
      })

    if (canEdit) {
      throw redirect({
        to: "/tournaments/$tournamentId/edit",
        params: {
          tournamentId,
        },
      })
    }

    throw notFound()
  },
})

function RouteComponent() {
  return null
}
