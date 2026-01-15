import { useSuspenseQuery } from "@tanstack/react-query";
import { tournamentQueryOptions } from "@/data/tournaments";
import type {
	Division,
	Level,
	Tournament,
	TournamentDivision,
	Venue,
} from "@/db/schema";
import { isDefined } from "@/utils/types";
import { DateFormatter, parseDate } from "@internationalized/date";
import { getDefaultTimeZone } from "@/lib/dates";

export function getLevelDisplay(level: Level | null, min?: number) {
	if (isDefined(min) && (!level || level.order <= min)) {
		return "";
	}

	return (level?.abbreviated || level?.name)?.toUpperCase() || "N";
}

const dateFormatter = new DateFormatter("EN-US", {
	dateStyle: "short",
});

export function getTournamentDisplay({
	name,
	date,
	venue,
}: Pick<Tournament, "name" | "date"> & {
	venue: Pick<Venue, "name" | "city">;
}) {
	return [
		name?.trim(),
		dateFormatter.format(parseDate(date).toDate(getDefaultTimeZone())),
		`${venue.name}, ${venue.city}`,
	]
		.filter(isDefined)
		.join(", ");
}

export function getTournamentDivisionDisplay({
	name,
	teamSize,
	gender,
	displayGender,
	displayDivision,
	division: { maxAge, name: divisionName, display: divisionDisplay },
}: Pick<TournamentDivision, "name" | "teamSize" | "gender"> & {
	displayGender?: boolean | null;
	displayDivision?: boolean | null;
	division: Pick<Division, "maxAge" | "name" | "display">;
}) {
	let display = `${name ?? ""}`;

	if (!name || displayGender) {
		if (display.length) {
			display += " ";
		}

		if (gender === "coed") {
			display += "Coed";
		} else {
			display += maxAge
				? gender === "male"
					? "Boy's"
					: "Girl's"
				: gender === "male"
					? "Men's"
					: "Women's";
		}
	}

	if (!name || displayDivision) {
		display += ` ${divisionDisplay ?? divisionName.toUpperCase()}`;
	}

	if (teamSize === 4) {
		display += " 4's";
	} else if (teamSize === 6) {
		display += " 6's";
	}

	return display;
}

export function useTournamentDivision(
	tournamentId: number,
	tournamentDivisionId: number,
) {
	return useSuspenseQuery({
		...tournamentQueryOptions(tournamentId),
		select: (data) =>
			data?.tournamentDivisions.find(({ id }) => id === tournamentDivisionId),
	});
}

export function useTournamentDivisionName(
	tournamentId: number,
	tournamentDivisionId: number,
) {
	const { data: division } = useTournamentDivision(
		tournamentId,
		tournamentDivisionId,
	);

	if (!division) {
		return null;
	}

	return getTournamentDivisionDisplay(division);
}
