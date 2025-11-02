import { subtitle } from "@/components/base/primitives"
import { RichTextDisplay } from "@/components/base/rich-text-editor/display"
import { TabPanel } from "@/components/base/tabs"
import { AddDirector } from "@/components/directors/add"
import { RemoveDirector } from "@/components/directors/remove"
import { tournamentQueryOptions } from "@/data/tournaments"
import { useUpdateVenue } from "@/data/venues"
import type {
  Director,
  PlayerProfile,
  Tournament,
  TournamentDirector,
  Venue,
} from "@/db/schema"
import type { LexicalState } from "@/db/schema/shared"

export function InformationPanel({
  id,
  venue,
  directors,
}: {
  id: Tournament["id"]
  directors: (TournamentDirector & {
    director: Director & { profile: PlayerProfile }
  })[]
  venue: Pick<Venue, "name" | "city" | "description" | "directions" | "mapUrl">
}) {
  const tournamentQuery = tournamentQueryOptions(id)
  const { mutateAsync: updateVenue } = useUpdateVenue([
    tournamentQuery.queryKey,
  ])

  return (
    <TabPanel id="info">
      <div className="max-w-4xl mx-auto pt-12 px-3">
        <h4 className={subtitle()}>Director Notes</h4>

        <div className="flex flex-col sm:flex-row gap-3 pb-12">
          <RichTextDisplay
            name="venue-directions"
            content={
              typeof venue.description === "string"
                ? JSON.parse(venue.description)
                : venue.description
            }
            onSave={async (state) => {
              await updateVenue({
                description: state as LexicalState,
              })
            }}
          />

          <div className="relative flex flex-col space-y-3 min-w-3/12">
            <h5 className="font-semibold flex flex-row justify-between items-center">
              <span>Director</span>

              <AddDirector
                tournamentId={id}
                existingDirectorIds={directors.map((d) => d.directorId)}
              />
            </h5>

            <div className="flex flex-col space-y-2">
              {directors.map((td) => {
                const name = `${td.director.profile.preferredName || td.director.profile.firstName} ${td.director.profile.lastName}`

                return (
                  <ul key={td.id} className="relative">
                    <li className="flex flex-row justify-between items-center relative whitespace-nowrap overflow-ellipsis">
                      <span>{name}</span>
                      <RemoveDirector
                        id={td.id}
                        name={name}
                        tournamentId={id}
                        isDisabled={directors.length === 1}
                      />
                    </li>
                    <li>{td.director.email || "todo"}</li>
                    <li>{td.director.phone || "todo"}</li>
                  </ul>
                )
              })}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t py-12 border-gray-300">
          <h4 className={subtitle()}>Directions</h4>

          <RichTextDisplay
            name="venue-directions"
            content={
              typeof venue.directions === "string"
                ? JSON.parse(venue.directions)
                : venue.directions
            }
            onSave={async (state) => {
              await updateVenue({
                directions: state as LexicalState,
              })
            }}
          />
        </div>
      </div>
      {venue.mapUrl?.startsWith("https://www.google.com") && (
        <iframe
          title="google maps"
          loading="lazy"
          height={350}
          style={{ border: "none", width: "100%", outline: "none" }}
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={venue.mapUrl}
        />
      )}
    </TabPanel>
  )
}
