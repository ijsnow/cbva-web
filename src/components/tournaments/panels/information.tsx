import { useQueryClient } from "@tanstack/react-query";
import { TabPanel } from "@/components/base/tabs";
import { VenueDisplay } from "@/components/venues/display";
import { tournamentQueryOptions } from "@/data/tournaments";
import type {
	Director,
	PlayerProfile,
	Tournament,
	TournamentDirector,
	Venue,
} from "@/db/schema";

export function InformationPanel({
	id,
	venue,
	directors,
}: {
	id: Tournament["id"];
	directors: (TournamentDirector & {
		director: Director & { profile: PlayerProfile };
	})[];
	venue: Pick<
		Venue,
		"id" | "name" | "city" | "description" | "directions" | "mapUrl"
	>;
}) {
	const queryClient = useQueryClient();
	const tournamentQuery = tournamentQueryOptions(id);

	return (
		<TabPanel id="info">
			<VenueDisplay
				tournamentId={id}
				venue={{
					...venue,
					directors,
				}}
				onEditSuccess={() => {
					queryClient.invalidateQueries(tournamentQuery);
				}}
			/>
		</TabPanel>
	);
}
