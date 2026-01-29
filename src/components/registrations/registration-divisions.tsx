import { getTournamentDivisionDisplay } from "@/hooks/tournament";
import {
	useCartDivisions,
	useIsSeasonOpen as useIsSeasonOpen,
} from "./context";
import { getDefaultTimeZone } from "@/lib/dates";
import { parseDate } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { RegistrationTeam } from "./registration-team";

export function RegistrationDivisions() {
	const divisions = useCartDivisions();
	const dateFormatter = useDateFormatter();

	const isSeasonOpen = useIsSeasonOpen();

	if (!isSeasonOpen) {
		return (
			<div className="py-6 px-2 text-center border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
				Tournament registration not open.
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-y-4">
			{divisions.map(
				({ divisionId, teams, tournament: { venue, date }, ...division }) => (
					<div key={divisionId} className="flex flex-col gap-y-4">
						<span className="font-semibold">
							{getTournamentDivisionDisplay(division)} {venue.name},{" "}
							{venue.city}:{" "}
							{dateFormatter.format(
								parseDate(date).toDate(getDefaultTimeZone()),
							)}
						</span>
						<div className="flex flex-col gap-y-4">
							{teams.map(({ id, profileIds }, i) => (
								<RegistrationTeam
									key={id}
									{...division}
									id={id}
									name={`Team ${i + 1}`}
									profileIds={profileIds}
								/>
							))}
						</div>
					</div>
				),
			)}
		</div>
	);
}
