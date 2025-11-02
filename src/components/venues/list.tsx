import { useSuspenseQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"

import { useViewerHasPermission } from "@/auth/shared"
import { DropdownMenu, DropdownMenuItem } from "@/components/base/dropdown-menu"
import { venuesQueryOptions } from "@/data/venues"

export function VenuesList() {
  const { data: venues } = useSuspenseQuery(venuesQueryOptions())

  const canCreateVenue = useViewerHasPermission({
    venues: ["create"],
  })

  return (
    <div className={"m1ax-w-4xl m-auto flex flex-col space-y-12 py-8"}>
      <div className="px-8 flex flex-col space-y-3">
        <div className="flex flex-row justify-between items-center">
          <h2 className="text-4xl font-bold mb-8">
            Find
            <br /> Tournaments
          </h2>

          {canCreateVenue && (
            <DropdownMenu>
              <DropdownMenuItem href="/venue/create">
                Create New
              </DropdownMenuItem>
            </DropdownMenu>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-6">
          {venues?.map(({ id, name, city, imageSource }) => (
            <Link
              key={id}
              to={"/venues/$venueId"}
              params={{ venueId: id.toString() }}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:underline"
            >
              <img
                className="w-full min-h-80 max-h-80 object-cover"
                src={imageSource ? imageSource : undefined}
                alt={`${name}, ${city}`}
              />
              <div className="bg-white py-3 px-4 text-2xl text-navy-500 font-extrabold font-panton uppercase">
                {name},<br />
                {city}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
