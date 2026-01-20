import { parseDate } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import clsx from "clsx";
import { ConstructionIcon } from "lucide-react";
import { Pagination } from "@/components/base/pagination";
import {
	TournamentListFilters,
	tournamentListFilterSchema,
} from "@/components/tournaments/filters";
import type {
	Division,
	Tournament,
	TournamentDivision,
	Venue,
} from "@/db/schema";
import { tournamentsQueryOptions } from "@/functions/tournaments/get-tournaments";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";
import { DefaultLayout } from "@/layouts/default";
import { getDefaultTimeZone } from "@/lib/dates";

export const Route = createFileRoute("/tournaments/")({
	component: RouteComponent,
	validateSearch: zodValidator(tournamentListFilterSchema),
	loaderDeps: ({ search }) => search,
	loader: async ({
		deps: { page, pageSize, divisions, venues, genders, past },
		context: { queryClient },
	}) => {
		await queryClient.ensureQueryData(
			tournamentsQueryOptions({
				page,
				pageSize,
				divisions,
				venues,
				genders,
				past,
			}),
		);
	},
});

function RouteComponent() {
	const search = Route.useSearch();

	const { page, pageSize, divisions, venues, genders, past } = search;

	const { data } = useSuspenseQuery(
		tournamentsQueryOptions({
			page,
			pageSize,
			divisions,
			venues,
			genders,
			past,
		}),
	);

	const { data: tournaments, pageInfo } = data;

	return (
		<DefaultLayout classNames={{ content: "pb-12 space-y-12 w-full relative" }}>
			<div className="py-8 w-full bg-slate-300 scroll-ref">
				<TournamentListFilters {...search} />
			</div>
			<div className="flex flex-col space-y-6 max-w-xl mx-auto pb-6">
				{tournaments.length ? (
					tournaments.map((tournament) => (
						<TournamentListItem key={tournament.id} {...tournament} />
					))
				) : (
					<div>
						No tournaments to show. Either update your filters or{" "}
						<Link
							className="text-blue-500 hover:underline"
							to="/tournaments"
							search={{
								page: page - 1,
								pageSize,
								divisions,
								venues,
								genders,
								past,
							}}
						>
							go back.
						</Link>
					</div>
				)}

				<Pagination
					to={Route.fullPath}
					page={page}
					pageSize={pageSize}
					pageInfo={pageInfo}
				/>
			</div>
		</DefaultLayout>
	);
}

function TournamentListItem({
	id,
	name,
	date,
	venue,
	visible,
	tournamentDivisions,
}: Pick<Tournament, "id" | "name" | "date" | "visible"> & {
	venue: Pick<Venue, "id" | "name" | "city">;
} & {
	tournamentDivisions: (Pick<
		TournamentDivision,
		"id" | "name" | "teamSize" | "gender" | "displayDivision" | "displayGender"
	> & {
		division: Pick<Division, "name" | "maxAge" | "display">;
	})[];
}) {
	const parsedDate = parseDate(date);

	const dateFormatter = useDateFormatter();

	return (
		<div className="rounded-md overflow-hidden">
			<div
				className={clsx(
					"w-full px-2 py-1 ",
					visible
						? "bg-navbar-background text-navbar-foreground"
						: "bg-orange-300 text-content-foreground",
				)}
			>
				<Link
					className="hover:underline w-full flex flex-col"
					to="/tournaments/$tournamentId/"
					params={{ tournamentId: id.toString() }}
				>
					{name && (
						<span className="flex flex-row items-center space-x-2">
							{!visible && <ConstructionIcon size={18} />}
							<span>{name}</span>
						</span>
					)}

					<span className="flex flex-row justify-between font-semibold">
						<span className="flex flex-row gap-2 items-center">
							{!visible && !name && <ConstructionIcon size={18} />}
							<span>
								{venue?.name}, {venue?.city}
							</span>
						</span>
						<span
							className={clsx(
								visible ? "text-gray-300" : "text-content-foreground",
							)}
						>
							{dateFormatter.format(parsedDate.toDate(getDefaultTimeZone()))}
						</span>
					</span>
				</Link>
			</div>
			<div className="relative px-2 py-3 bg-white">
				<ul>
					{tournamentDivisions?.map(({ id: tdid, ...info }) => {
						return (
							<li key={tdid} className="px-2 py-0.5">
								<Link
									className="underline text-navbar-background hover:no-underline w-full inline-block"
									to="/tournaments/$tournamentId/$divisionId/{-$tab}"
									params={{
										tournamentId: id.toString(),
										divisionId: tdid.toString(),
									}}
								>
									{getTournamentDivisionDisplay(info)}
								</Link>
							</li>
						);
					})}
				</ul>
			</div>
		</div>
	);
}
