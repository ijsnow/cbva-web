import { tournamentsQueryOptions } from "@/functions/tournaments/get-tournaments";
import { useSuspenseQuery } from "@tanstack/react-query";
import { SelectField } from "./select";
import type { FieldProps } from "./shared";

export type TournamentDivisionPickerFieldProps = FieldProps & {
	isDisabled?: boolean;
	excludeIds?: number[];
};

export function TournamentDivisionPickerField({
	label,
	field,
	isDisabled,
	excludeIds = [],
}: TournamentDivisionPickerFieldProps) {
	const { data } = useSuspenseQuery(
		tournamentsQueryOptions({
			divisions: [],
			venues: [],
			genders: [],
			past: false,
			page: 1,
			pageSize: 50,
		}),
	);

	const options = data.data.flatMap((tournament) =>
		tournament.tournamentDivisions
			.filter((division) => !excludeIds.includes(division.id))
			.map((division) => ({
				value: division.id,
				label: `${tournament.name || tournament.venue.name} - ${division.division.name} (${division.gender})`,
				description: `${tournament.date} - ${tournament.venue.city}`,
			})),
	);

	return (
		<SelectField
			label={label}
			field={field}
			isDisabled={isDisabled}
			placeholder="Select a tournament..."
			options={options}
		/>
	);
}
