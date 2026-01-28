import { FieldProps } from "./shared";

export type DivisionPickerFieldProps = FieldProps & {
	isDisabled?: boolean;
	selectedDivisionIds: number[];
	dateRange?: { startDate?: string; endDate?: string };
	divisionIds?: number[];
	venueIds?: number[];
};

export function DivisionPickerField({
	label,
	field,
	isDisabled,
	selectedDivisionIds,
	dateRange,
	divisionIds,
	venueIds,
}: DivisionPickerFieldProps) {
	// TODO: implement a tournament DivisionPickerField. Modify getTournamentDivisionsQueryOptions as necessary too.
	// It should be similar to the profile picker.
	// It should encapsulate fetching of all filter data such as venues, divisions, etc
	//
	// Filter on:
	// - date range
	// - divisions multiselect
	// - venues

	return null;
}
