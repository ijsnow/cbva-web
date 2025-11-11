import {
	DateFormatter,
	getLocalTimeZone,
	parseDate,
} from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { CheckIcon } from "lucide-react";
import { match, P } from "ts-pattern";
import {
	DropdownMenu,
	DropdownMenuItemLink,
} from "@/components/base/dropdown-menu";
import { subtitle, title } from "@/components/base/primitives";
import { Tab, TabList, Tabs } from "@/components/base/tabs";
import { TournamentControls } from "@/components/tournaments/controls";
import { GamesPanel } from "@/components/tournaments/panels/games";
import { InformationPanel } from "@/components/tournaments/panels/information";
import { PlayoffsPanel } from "@/components/tournaments/panels/playoffs";
import { PoolsPanel } from "@/components/tournaments/panels/pools";
import { TeamsPanel } from "@/components/tournaments/panels/teams";
import { playoffsQueryOptions } from "@/data/playoffs";
import { poolsQueryOptions } from "@/data/pools";
import { teamsQueryOptions } from "@/data/teams";
import { tournamentQueryOptions } from "@/data/tournaments";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";
import { DefaultLayout } from "@/layouts/default";
import { dbg } from "@/utils/dbg";

const dateFormatter = new DateFormatter("EN-US", {
	dateStyle: "short",
});

export const Route = createFileRoute("/tournaments/$tournamentId/$divisionId")({
	component: RouteComponent,
	validateSearch: (
		search: Record<string, unknown>,
	): {
		pools?: number[];
		courts?: string[];
	} => {
		return {
			pools: Array.isArray(search?.pools) ? search.pools : undefined,
			courts: Array.isArray(search?.courts) ? search.courts : undefined,
		};
	},
	loader: async ({ params: { tournamentId }, context: { queryClient } }) => {
		const tournament = await queryClient.ensureQueryData(
			tournamentQueryOptions(Number.parseInt(tournamentId, 10)),
		);

		if (!tournament) {
			throw new Error("not found");
		}

		return tournament;
	},
	head: ({ loaderData }) => ({
		meta: loaderData
			? [
					{
						title: [
							dateFormatter.format(
								parseDate(loaderData.date).toDate(getLocalTimeZone()),
							),
							loaderData.name,
							`${loaderData.venue.name}, ${loaderData.venue.city}`,
						].join(" "),
					},
				]
			: undefined,
	}),
});

function RouteComponent() {
	const { tournamentId, divisionId } = Route.useParams();

	const { data } = useSuspenseQuery(
		tournamentQueryOptions(Number.parseInt(tournamentId, 10)),
	);

	const tournament = data!;

	const parsedDate = parseDate(tournament.date);

	const activeDivision =
		tournament.tournamentDivisions.find(
			({ id }) => id.toString() === divisionId,
		) ?? tournament.tournamentDivisions[0];

	const { data: hasTeams } = useQuery({
		...teamsQueryOptions(activeDivision.id),
		select: (data) => data.length > 0,
	});

	const { data: hasPools } = useQuery({
		...poolsQueryOptions({
			tournamentDivisionId: activeDivision.id,
		}),
		select: (data) => data.length > 0,
	});

	const { data: hasGames } = useQuery({
		...poolsQueryOptions({
			tournamentDivisionId: activeDivision.id,
		}),
		select: (data) => dbg(data).some((pool) => pool.matches.length > 0),
	});

	const { data: hasPlayoffs } = useQuery({
		...playoffsQueryOptions({
			tournamentDivisionId: activeDivision.id,
		}),
		select: (data) => data.length > 0,
	});

	const { name, venue } = tournament || {};

	const dateFormatter = useDateFormatter({
		dateStyle: "full",
	});

	const formattedDate = dateFormatter.format(
		parsedDate.toDate(getLocalTimeZone()),
	);

	const { venueClassName, dateClassName } = match({
		name: tournament.name,
		venueName: tournament.venue.name,
		venueCity: tournament.venue.city,
	})
		.with(
			{
				name: null,
				venueName: P.select("venueName"),
				venueCity: P.select("venueCity"),
			},
			() => ({
				venueClassName: title(),
				dateClassName: subtitle({ class: "font-bold my-3" }),
			}),
		)
		.with(
			{
				name: P.select("name"),
				venueName: P.select("venueName"),
				venueCity: P.select("venueCity"),
			},
			() => ({
				venueClassName: subtitle({ class: "font-bold my-0" }),
				dateClassName: subtitle({ class: "my-0" }),
			}),
		)
		.exhaustive();

	return (
		<DefaultLayout classNames={{ content: "bg-white relative" }}>
			<TournamentControls
				tournamentId={Number.parseInt(tournamentId, 10)}
				division={activeDivision}
			/>

			<div>
				<div className="py-12 max-w-lg mx-auto flex flex-col space-y-6">
					<div className="text-center flex flex-col space-y-2">
						{name && <h1 className={title()}>{name}</h1>}

						<div className="flex flex-col">
							<h2
								className={venueClassName}
							>{`${venue.name}, ${venue.city}`}</h2>
							<h3 className={dateClassName}>{formattedDate}</h3>
						</div>
					</div>

					<DropdownMenu
						buttonContent={
							<span className={subtitle({ className: "w-auto!" })}>
								{activeDivision && getTournamentDivisionDisplay(activeDivision)}
							</span>
						}
					>
						{tournament.tournamentDivisions.map(({ id, ...division }) => (
							<DropdownMenuItemLink
								key={id}
								to="/tournaments/$tournamentId/$divisionId"
								params={{
									tournamentId,
									divisionId: id.toString(),
								}}
								search={{ pools: [], courts: [] }}
								className={clsx(
									"w-full flex flex-row justify-between",
									id === activeDivision?.id && "font-semibold",
								)}
							>
								<span>{getTournamentDivisionDisplay(division)}</span>
								{id === activeDivision?.id && <CheckIcon />}
							</DropdownMenuItemLink>
						))}
					</DropdownMenu>
				</div>

				<Tabs defaultSelectedKey="info">
					<div className="overflow-x-auto">
						<TabList
							aria-label="Tournament Overview"
							className="px-6 min-w-max"
						>
							<Tab id="info">Information</Tab>
							<Tab id="teams" isDisabled={!hasTeams}>
								Teams
							</Tab>
							<Tab id="pools" isDisabled={!hasPools}>
								Pools
							</Tab>
							<Tab id="games" isDisabled={!hasGames}>
								Games
							</Tab>
							<Tab id="playoffs" isDisabled={!hasPlayoffs}>
								Playoffs
							</Tab>
						</TabList>
					</div>
					<InformationPanel {...tournament} />
					<TeamsPanel
						{...tournament}
						tournamentDivisionId={activeDivision.id}
						teamSize={activeDivision.teamSize}
					/>
					<PoolsPanel
						{...tournament}
						tournamentDivisionId={activeDivision.id}
					/>
					<GamesPanel
						{...tournament}
						tournamentDivisionId={activeDivision.id}
					/>
					<PlayoffsPanel
						{...tournament}
						tournamentDivisionId={activeDivision.id}
					/>
				</Tabs>
			</div>
		</DefaultLayout>
	);
}
