import { roleHasPermission } from "@/auth/shared";
import { Button } from "@/components/base/button";
import { Checkbox } from "@/components/base/checkbox";
import { Link } from "@/components/base/link";
import { Pagination } from "@/components/base/pagination";
import { title } from "@/components/base/primitives";
import {
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@/components/base/table";
import { Toolbar } from "@/components/base/toolbar";
import { createDemoTournamentMuationOptions } from "@/functions/tournaments/create-demo-tournament";
import { deleteDemoTournamentMuationOptions } from "@/functions/tournaments/delete-demo-tournament";
import {
	getTournamentsByDirectorsOptions,
	getTournamentsByDirectorsSchema,
} from "@/functions/tournaments/get-tournaments-by-directors";
import { DefaultLayout } from "@/layouts/default";
import { getDefaultTimeZone } from "@/lib/dates";
import { parseDate } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Gamepad2Icon, XIcon } from "lucide-react";

export const Route = createFileRoute("/td/")({
	validateSearch: getTournamentsByDirectorsSchema,
	loaderDeps: ({ search }) => search,
	loader: async ({ context: { queryClient, ...context }, deps: search }) => {
		const viewer = context.viewer;

		const hasPermission =
			viewer &&
			roleHasPermission(viewer.role, {
				tournament: ["update"],
			});

		if (!hasPermission) {
			throw redirect({ to: "/not-found" });
		}

		await queryClient.ensureQueryData(
			getTournamentsByDirectorsOptions({
				past: search.past,
				page: search.page,
				pageSize: search.pageSize,
			}),
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const search = Route.useSearch();

	const { data: tournamentsResponse, refetch } = useSuspenseQuery(
		getTournamentsByDirectorsOptions({
			past: search.past,
			page: search.page,
			pageSize: search.pageSize,
		}),
	);

	const tournaments = tournamentsResponse.data;
	const pageInfo = tournamentsResponse.pageInfo;

	const dateFormatter = useDateFormatter({
		dateStyle: "short",
	});

	const navigate = useNavigate();

	const { mutate: copyAsDemo } = useMutation({
		...createDemoTournamentMuationOptions(),
		onSuccess: ({ data }) => {
			navigate({
				to: "/tournaments/$tournamentId",
				params: {
					tournamentId: data.id.toString(),
				},
			});
		},
	});

	const { mutate: deleteDemo } = useMutation({
		...deleteDemoTournamentMuationOptions(),
		onSuccess: () => {
			refetch();
		},
	});

	return (
		<DefaultLayout
			classNames={{
				content: "flex flex-col space-y-12 max-w-2xl px-3 py-12 mx-auto",
			}}
		>
			<div className="flex flex-col space-y-2">
				<h2 className={title({ size: "sm" })}>Your Tournaments</h2>

				<Toolbar className="self-end">
					<Checkbox
						label="Previous"
						isSelected={search.past}
						onChange={(value) => {
							navigate({
								search: (prev) => ({
									...prev,
									past: value,
									page: 1, // Reset to first page when toggling past/future
								}),
							});
						}}
					/>
				</Toolbar>

				<div className="flex flex-col space-y-6 items-center">
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
							<TableColumn id="status" isRowHeader minWidth={100}>
								Status
							</TableColumn>
							<TableColumn id="actions">Actions</TableColumn>
						</TableHeader>

						<TableBody items={tournaments}>
							{({ id, name, date, venue, visible, demo }) => {
								return (
									<TableRow
										key={id}
										onAction={() =>
											navigate({
												to: "/tournaments/$tournamentId",
												params: {
													tournamentId: id.toString(),
												},
											})
										}
									>
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
										<TableCell>
											{visible ? "Published" : "Unpublished"}
										</TableCell>
										<TableCell>
											<Toolbar>
												{demo ? (
													<Button
														variant="icon"
														color="default"
														tooltip="Delete demo tournament"
														radius="md"
														onPress={() => {
															deleteDemo({
																id,
															});
														}}
													>
														<XIcon className="text-red-500" size={16} />
													</Button>
												) : (
													<Button
														variant="icon"
														color="default"
														tooltip="Copy as demo"
														radius="md"
														onPress={() => {
															copyAsDemo({
																id,
															});
														}}
													>
														<Gamepad2Icon
															className="text-green-500"
															size={16}
														/>
													</Button>
												)}
											</Toolbar>
										</TableCell>
									</TableRow>
								);
							}}
						</TableBody>
					</Table>

					<Pagination
						to="/td"
						page={search.page}
						pageSize={search.pageSize}
						pageInfo={pageInfo}
					/>
				</div>
			</div>
		</DefaultLayout>
	);
}
