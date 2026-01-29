import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import {
	Button,
	composeRenderProps,
	DateField,
	DateInput,
	DateSegment,
	type DateValue,
	ListBox,
	ListBoxItem,
	MenuTrigger,
	Popover,
} from "react-aria-components";
import { tv } from "tailwind-variants";
import { divisionsQueryOptions } from "@/data/divisions";
import { venuesQueryOptions } from "@/data/venues";
import {
	searchTournamentDivisionsQueryOptions,
	type SearchTournamentDivisionsInput,
} from "@/functions/tournament-divisions/get-tournament-divisions";
import { focusRing } from "@/components/base/utils";
import {
	Description,
	Errors,
	type FieldProps,
	inputStyles,
	Label,
} from "./shared";
import { itemStyles, popoverStyles } from "./multi-select";

export type DivisionPickerFieldProps = FieldProps & {
	isDisabled?: boolean;
	selectedDivisionIds: number[];
	dateRange?: { startDate?: string; endDate?: string };
	divisionIds?: number[];
	venueIds?: number[];
};

const segmentStyles = tv({
	base: "inline p-0.5 type-literal:px-0 rounded-xs outline outline-0 forced-color-adjust-none caret-transparent text-gray-800 forced-colors:text-[ButtonText]",
	variants: {
		isPlaceholder: {
			true: "text-placeholder italic",
		},
		isDisabled: {
			true: "cursor-not-allowed text-gray-400 forced-colors:text-[GrayText]",
		},
		isFocused: {
			true: "bg-blue-200 text-black forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]",
		},
	},
});

function formatTournamentDivision(td: {
	gender: string;
	name: string | null;
	division: { display: string | null; name: string };
	tournament: {
		date: string;
		venue: { name: string; city: string };
	};
}) {
	const divisionDisplay = td.division.display ?? td.division.name.toUpperCase();
	const genderDisplay =
		td.gender === "male"
			? "Men's"
			: td.gender === "female"
				? "Women's"
				: "Coed";
	const name = td.name ? `${td.name} ` : "";
	const date = new Date(td.tournament.date).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	return `${genderDisplay} ${name}${divisionDisplay} - ${td.tournament.venue.name}, ${td.tournament.venue.city} - ${date}`;
}

type FilterDropdownProps<T extends number> = {
	label: string;
	options: { value: T; display: string }[];
	selectedValues: Set<T>;
	onSelectionChange: (values: Set<T>) => void;
};

function FilterDropdown<T extends number>({
	label,
	options,
	selectedValues,
	onSelectionChange,
}: FilterDropdownProps<T>) {
	return (
		<MenuTrigger>
			<Button
				className={(render) =>
					clsx(
						"flex items-center justify-between text-start gap-2 cursor-default px-2 py-1 hover:bg-gray-200 text-sm min-w-24",
						focusRing(render),
						inputStyles(render),
					)
				}
			>
				<span
					className={selectedValues.size === 0 ? "text-placeholder italic" : ""}
				>
					{selectedValues.size === 0
						? label
						: `${label} (${selectedValues.size})`}
				</span>
				<ChevronDown
					aria-hidden
					className="w-4 h-4 text-gray-600 forced-colors:text-[ButtonText] group-disabled:text-gray-200 forced-colors:group-disabled:text-[GrayText]"
				/>
			</Button>

			<Popover
				className={composeRenderProps(
					"min-w-(--trigger-width)",
					(className, render) => popoverStyles({ ...render, className }),
				)}
			>
				<ListBox
					aria-label={label}
					items={options}
					selectionMode="multiple"
					selectionBehavior="toggle"
					selectedKeys={selectedValues}
					onSelectionChange={(keys) => {
						if (keys === "all") {
							onSelectionChange(new Set(options.map((o) => o.value)));
						} else {
							onSelectionChange(keys as Set<T>);
						}
					}}
					className="border border-gray-300 outline-0 p-1 shadow-lg rounded-lg bg-popover outline-hidden max-h-60 overflow-auto [clip-path:inset(0_0_0_0_round_.75rem)]"
				>
					{options.map(({ value, display }) => (
						<ListBoxItem key={value} id={value} className={itemStyles}>
							{({ isSelected }) => (
								<>
									<span className="flex items-center flex-1 gap-2 font-normal truncate group-selected:font-semibold">
										{display}
									</span>
									<span className="flex items-center w-5">
										{isSelected && <Check className="w-4 h-4" />}
									</span>
								</>
							)}
						</ListBoxItem>
					))}
				</ListBox>
			</Popover>
		</MenuTrigger>
	);
}

export function DivisionPickerField({
	label,
	description,
	field,
	isDisabled,
	selectedDivisionIds,
	dateRange,
	divisionIds: initialDivisionIds,
	venueIds: initialVenueIds,
}: DivisionPickerFieldProps) {
	const [filterDivisionIds, setFilterDivisionIds] = useState<Set<number>>(
		() => new Set(initialDivisionIds ?? []),
	);
	const [filterVenueIds, setFilterVenueIds] = useState<Set<number>>(
		() => new Set(initialVenueIds ?? []),
	);
	const [filterStartDate, setFilterStartDate] = useState<DateValue | null>(
		null,
	);
	const [filterEndDate, setFilterEndDate] = useState<DateValue | null>(null);

	const { data: divisions } = useSuspenseQuery({
		...divisionsQueryOptions(),
		select: (divisions) =>
			divisions.map(({ id, display, name }) => ({
				value: id,
				display: display ?? name.toUpperCase(),
			})),
	});

	const { data: venues } = useSuspenseQuery({
		...venuesQueryOptions(),
		select: (venues) =>
			venues.map(({ id, name, city }) => ({
				value: id,
				display: `${name}, ${city}`,
			})),
	});

	const searchParams: SearchTournamentDivisionsInput = {
		divisionIds: Array.from(filterDivisionIds),
		venueIds: Array.from(filterVenueIds),
		startDate: filterStartDate?.toString() ?? dateRange?.startDate,
		endDate: filterEndDate?.toString() ?? dateRange?.endDate,
		excludeIds: selectedDivisionIds,
	};

	const { data: tournamentDivisions, isLoading } = useQuery(
		searchTournamentDivisionsQueryOptions(searchParams),
	);

	return (
		<div className="flex flex-col gap-2">
			{label && <Label>{label}</Label>}

			<div className="flex flex-wrap gap-2 items-center">
				<DateField
					aria-label="Start date"
					value={filterStartDate}
					onChange={setFilterStartDate}
					isDisabled={isDisabled}
					className="flex-shrink-0"
				>
					<DateInput
						className={(renderProps) =>
							inputStyles({ ...renderProps, class: "px-2 py-1 text-sm" })
						}
					>
						{(segment) => (
							<DateSegment segment={segment} className={segmentStyles} />
						)}
					</DateInput>
				</DateField>

				<span className="text-gray-500">to</span>

				<DateField
					aria-label="End date"
					value={filterEndDate}
					onChange={setFilterEndDate}
					isDisabled={isDisabled}
					className="flex-shrink-0"
				>
					<DateInput
						className={(renderProps) =>
							inputStyles({ ...renderProps, class: "px-2 py-1 text-sm" })
						}
					>
						{(segment) => (
							<DateSegment segment={segment} className={segmentStyles} />
						)}
					</DateInput>
				</DateField>

				<FilterDropdown
					label="Divisions"
					options={divisions}
					selectedValues={filterDivisionIds}
					onSelectionChange={setFilterDivisionIds}
				/>

				<FilterDropdown
					label="Venues"
					options={venues}
					selectedValues={filterVenueIds}
					onSelectionChange={setFilterVenueIds}
				/>
			</div>

			<ListBox
				aria-label="Tournament divisions"
				selectionMode="single"
				disallowEmptySelection={false}
				selectedKeys={
					field.state.value != null ? new Set([field.state.value]) : new Set()
				}
				onSelectionChange={(keys) => {
					if (keys !== "all" && keys.size > 0) {
						const selectedId = Array.from(keys)[0] as number;
						field.handleChange(selectedId);
					}
				}}
				className={clsx(
					"border border-gray-300 rounded-lg p-1 max-h-64 overflow-auto bg-white",
					(isDisabled || isLoading) && "opacity-50 pointer-events-none",
				)}
				renderEmptyState={() => (
					<div className="p-4 text-center text-gray-500 italic">
						{isLoading ? "Loading..." : "No tournament divisions found"}
					</div>
				)}
			>
				{(tournamentDivisions ?? []).map((td) => {
					const displayText = formatTournamentDivision(td);
					return (
						<ListBoxItem
							key={td.id}
							id={td.id}
							className={itemStyles}
							textValue={displayText}
						>
							{({ isSelected }) => (
								<>
									<span className="flex items-center flex-1 gap-2 font-normal truncate group-selected:font-semibold">
										{displayText}
									</span>
									<span className="flex items-center w-5">
										{isSelected && <Check className="w-4 h-4" />}
									</span>
								</>
							)}
						</ListBoxItem>
					);
				})}
			</ListBox>

			{description && <Description>{description}</Description>}
			<Errors field={field} />
		</div>
	);
}
