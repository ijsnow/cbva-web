import { useSuspenseQuery } from "@tanstack/react-query";
import { tournamentQueryOptions } from "@/data/tournaments";
import type { Division, Level, TournamentDivision } from "@/db/schema";

export function getLevelDisplay(level: Level | null) {
	return (level?.abbreviated || level?.name)?.toUpperCase() || "N";
}

export function getTournamentDivisionDisplay({
	teamSize,
	gender,
	division: { maxAge, name, display: divisionDisplay },
}: Pick<TournamentDivision, "name" | "teamSize" | "gender"> & {
	division: Pick<Division, "maxAge" | "name" | "display">;
}) {
	let display = maxAge
		? gender === "male"
			? "Boy's"
			: "Girl's"
		: gender === "male"
			? "Men's"
			: "Women's";

	display += ` ${divisionDisplay ?? name.toUpperCase()}`;

	if (teamSize === 4) {
		display += " quads";
	} else if (teamSize === 6) {
		display += " sixes";
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
