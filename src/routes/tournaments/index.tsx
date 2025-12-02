import { getLocalTimeZone, parseDate } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { ConstructionIcon } from "lucide-react";
import { button } from "@/components/base/button";
import { Checkbox } from "@/components/base/checkbox";
import { Pagination } from "@/components/base/pagination";
import { FilterDivisions } from "@/components/tournaments/filters/divisions";
import { FilterGender } from "@/components/tournaments/filters/gender";
import { FilterVenues } from "@/components/tournaments/filters/venues";
import { tournamentsQueryOptions } from "@/data/tournaments";
import type {
	Division,
	Tournament,
	TournamentDivision,
	Venue,
} from "@/db/schema";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/tournaments/")({
	component: RouteComponent,
	validateSearch: (
		search: Record<string, unknown>,
	): {
		page: number;
		pageSize: number;
		divisions: number[];
		venues: number[];
		genders: ("male" | "female" | "coed")[];
		past: boolean;
	} => {
		return {
			page: Math.max(Number(search?.page ?? 1), 1),
			pageSize: Math.max(Number(search?.pageSize ?? 25), 25),
			divisions: Array.isArray(search?.divisions) ? search.divisions : [],
			venues: Array.isArray(search?.venues) ? search.venues : [],
			genders: Array.isArray(search?.genders) ? search.genders : [],
			past: Boolean(search?.past ?? false),
		};
	},
	loaderDeps: ({
		search: { page, pageSize, divisions, venues, genders, past },
	}) => ({
		page,
		pageSize,
		divisions,
		venues,
		genders,
		past,
	}),
	loader: async ({
		deps: { page, pageSize, divisions, venues, genders, past },
		context: { queryClient },
	}) => {
		queryClient.ensureQueryData(
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
	const { page, pageSize, divisions, venues, genders, past } =
		Route.useSearch();

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

	const navigate = useNavigate();

	return (
		<DefaultLayout classNames={{ content: "pb-12 space-y-12 w-full" }}>
			<div className="py-8 w-full bg-slate-300 scroll-ref">
				<div className="max-w-xl mx-auto flex flex-col space-y-2 px-2">
					<FilterVenues values={new Set(venues)} />
					<FilterDivisions values={new Set(divisions)} />
					<FilterGender values={new Set(genders)} />
					<Checkbox
						isSelected={past}
						onChange={(value) => {
							navigate({
								to: "/tournaments",
								search: {
									page,
									pageSize,
									divisions,
									venues,
									genders,
									past: value,
								},
							});
						}}
						label={<>Past Tournaments Only</>}
					/>
					<Link
						className={button({ class: "mt-2" })}
						to="/tournaments"
						search={{}}
					>
						Clear Filters
					</Link>
				</div>
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
		"id" | "name" | "teamSize" | "gender"
	> & {
		division: Pick<Division, "name" | "maxAge">;
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
					className="font-semibold hover:underline w-full flex flex-col"
					to="/tournaments/$tournamentId/"
					params={{ tournamentId: id.toString() }}
				>
					{name && <span className="font-semibold text-lg">{name}</span>}
					<span className="flex flex-row justify-between">
						<span className="flex flex-row gap-2 items-center">
							{!visible && <ConstructionIcon size={18} />}
							<span className="font-semibold">
								{venue?.name}, {venue?.city}
							</span>
						</span>
						<span
							className={clsx(
								visible ? "text-gray-300" : "text-content-foreground",
							)}
						>
							{dateFormatter.format(parsedDate.toDate(getLocalTimeZone()))}
						</span>
					</span>
				</Link>
			</div>
			<div className="px-2 py-3 bg-white">
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
