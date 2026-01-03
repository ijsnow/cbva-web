import { roleHasPermission } from "@/auth/shared";
import { Link } from "@/components/base/link";
import { title } from "@/components/base/primitives";
import {
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@/components/base/table";
import {
	getTournamentsByDirectorsOptions,
	getTournamentsByDirectorsSchema,
} from "@/functions/get-tournaments-by-directors";
import { DefaultLayout } from "@/layouts/default";
import { getDefaultTimeZone } from "@/lib/dates";
import { parseDate } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/td/")({
	validateSearch: getTournamentsByDirectorsSchema,
	loader: async ({ context: { queryClient, ...context } }) => {
		const viewer = context.viewer;

		const hasPermission =
			viewer &&
			roleHasPermission(viewer.role, {
				tournament: ["update"],
			});

		if (!hasPermission) {
			throw redirect({ to: "/not-found" });
		}

		await queryClient.ensureQueryData(getTournamentsByDirectorsOptions());
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { data: tournaments } = useSuspenseQuery(
		getTournamentsByDirectorsOptions(),
	);

	const dateFormatter = useDateFormatter({
		dateStyle: "short",
	});

	return (
		<DefaultLayout
			classNames={{
				content: "flex flex-col space-y-12 max-w-2xl px-3 py-12 mx-auto",
			}}
		>
			<div className="flex flex-col space-y-8">
				<h2 className={title({ size: "sm" })}>Your Tournaments</h2>

				<Table aria-label="Player's tournament results">
					<TableHeader className="bg-navbar-background">
						<TableColumn id="date" allowsSorting minWidth={100}>
							Date
						</TableColumn>
						<TableColumn id="tournament" isRowHeader minWidth={100}>
							Event
						</TableColumn>
						<TableColumn id="location" isRowHeader minWidth={100}>
							Location
						</TableColumn>
						<TableColumn id="location" isRowHeader minWidth={100}>
							Status
						</TableColumn>
					</TableHeader>

					<TableBody items={tournaments}>
						{({ id, name, date, venue, visible }) => {
							return (
								<TableRow key={id}>
									<TableCell>
										<Link
											variant="alt"
											to="/tournaments/$tournamentId"
											params={{
												tournamentId: id.toString(),
											}}
										>
											{dateFormatter.format(
												parseDate(date).toDate(getDefaultTimeZone()),
											)}
										</Link>
									</TableCell>
									<TableCell>{name ?? "-"}</TableCell>
									<TableCell>
										{venue.name}, {venue.city}
									</TableCell>
									<TableCell>{visible ? "Published" : "Unpublished"}</TableCell>
								</TableRow>
							);
						}}
					</TableBody>
				</Table>
			</div>
		</DefaultLayout>
	);
}
