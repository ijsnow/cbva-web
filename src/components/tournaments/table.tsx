import { useMemo, useState } from "react";
import type { SortDescriptor } from "react-aria-components";

import {
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@/components/table";
import type { TournamentSummary } from "@/generated/TournamentSummary";
import type { TournamentsSortColumns } from "@/generated/TournamentsSortColumns";

export function TournamentsTable({
	tournaments,
}: {
	tournaments: TournamentSummary[];
}) {
	const [sortDescriptor, setSortDescriptor] = useState<
		Omit<SortDescriptor, "column"> & { column: TournamentsSortColumns }
	>({
		column: "date",
		direction: "ascending",
	});

	const hasNames = useMemo(
		() => tournaments?.some(({ name }) => Boolean(name)),
		[tournaments],
	);

	return (
		<Table
			aria-label="Tournaments"
			sortDescriptor={sortDescriptor}
			onSortChange={({ column, direction }) => {
				setSortDescriptor({
					column: column as TournamentsSortColumns,
					direction,
				});
			}}
		>
			<TableHeader>
				<TableColumn id="date" allowsSorting>
					Date
				</TableColumn>
				{hasNames && (
					<TableColumn id="name" isRowHeader allowsSorting>
						Name
					</TableColumn>
				)}
				<TableColumn id="divisions" isRowHeader>
					Divisions
				</TableColumn>
			</TableHeader>
			<TableBody items={tournaments}>
				{({ name, date }) => (
					<TableRow>
						<TableCell>{date}</TableCell>
						{hasNames && <TableCell>{name}</TableCell>}
						<TableCell>{renderDivisionNames(divisions)}</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	);
}
