import { getTournamentDivisionDisplay } from "@/hooks/tournament";
import { useCartDivisions } from "./context";
import { getDefaultTimeZone } from "@/lib/dates";
import { parseDate } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { dbg } from "@/utils/dbg";
import { RegistrationTeam } from "./registration-team";
import { uniqueId } from "lodash-es";

export function RegistrationDivisions() {
	const divisions = useCartDivisions();
	const dateFormatter = useDateFormatter();

	return (
		<div>
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
							{teams.map(({ profileIds }, i) => (
								<RegistrationTeam
									key={uniqueId()}
									{...division}
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
