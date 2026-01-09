import { useSuspenseQuery } from "@tanstack/react-query"
import { TabPanel } from "@/components/base/tabs"
import { playoffsQueryOptions } from "@/data/playoffs"
import type { Tournament, TournamentDivision } from "@/db/schema"
import { Bracket } from "./bracket"

export function PlayoffsPanel({
  tournamentDivisionId,
}: Pick<Tournament, "id"> & {
  tournamentDivisionId: TournamentDivision["id"]
}) {
  const { data } = useSuspenseQuery(
    playoffsQueryOptions({ tournamentDivisionId })
  )

  return (
    <TabPanel id="playoffs">
      <Bracket matches={data || []} />
    </TabPanel>
  )
}
