import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useViewerHasPermission } from "@/auth/shared"
import { EditableImage } from "@/components/base/editable-image"
import { subtitle, title } from "@/components/base/primitives"
import { VenueDisplay } from "@/components/venues/display"
import { VenueHeader } from "@/components/venues/header"
import { venueQueryOptions } from "@/data/venues"
import { DefaultLayout } from "@/layouts/default"

export const Route = createFileRoute("/venues/$venueId")({
  loader: async ({ params: { venueId }, context: { queryClient } }) => {
    return await queryClient.ensureQueryData(
      venueQueryOptions(Number.parseInt(venueId, 10))
    )
  },
  component: RouteComponent,
})

function RouteComponent() {
  const params = Route.useParams()

  const queryOptions = venueQueryOptions(Number.parseInt(params.venueId, 10))

  const { data: venue } = useSuspenseQuery(queryOptions)

  return (
    <DefaultLayout classNames={{ content: "bg-white" }}>
      <VenueHeader {...venue} />

      <div className="text-center border-b-2 border-gray-300 py-16">
        <h1 className={title()}>{venue.name}</h1>
        <h2 className={subtitle({ class: "font-bold" })}>{venue.city}</h2>
      </div>

      <VenueDisplay venue={venue} />
    </DefaultLayout>
  )
}
