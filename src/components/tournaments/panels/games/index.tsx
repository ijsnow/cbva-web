import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useRouterState, useSearch } from "@tanstack/react-router";
import sortBy from "lodash/sortBy";
import unionBy from "lodash/unionBy";
import { MinusIcon, PlusIcon, Undo2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import {
	Button as AriaButton,
	Disclosure,
	DisclosureGroup,
	DisclosurePanel,
	Heading,
} from "react-aria-components";
import { button } from "@/components/base/button";
import { MultiSelect } from "@/components/base/multi-select";
import { title } from "@/components/base/primitives";
import { TabPanel } from "@/components/base/tabs";
import { poolsQueryOptions } from "@/data/pools";
import type { Tournament, TournamentDivision } from "@/db/schema";
import { isNotNull } from "@/utils/types";
import { PoolMatchGrid } from "./pool-match-grid";

export function GamesPanel({
	tournamentDivisionId,
}: Pick<Tournament, "id"> & {
	tournamentDivisionId: TournamentDivision["id"];
}) {
	const search = useSearch({
		from: "/tournaments/$tournamentId/$divisionId",
	});

	const state = useRouterState();

	const { data, refetch } = useSuspenseQuery(
		poolsQueryOptions({
			tournamentDivisionId,
		}),
	);

	const poolFilterOptions = useMemo(() => {
		return (
			data?.map((pool) => {
				return {
					display: pool.name.toUpperCase(),
					value: pool.id,
				};
			}) ?? []
		);
	}, [data]);

	const courtFilterOptions = useMemo(() => {
		return sortBy(data?.map((p) => p.court).filter(isNotNull) ?? [], (v) => {
			if (Number.isNaN(v)) {
				return v;
			}

			return Number.parseInt(v, 10);
		}).map((court) => {
			return {
				display: court,
				value: court,
			};
		});
	}, [data]);

	const poolFilterValues = new Set(search.pools);
	const courtFilterValues = new Set(search.courts);

	const [filterOpen, setFilterOpen] = useState(false);

	const visiblePools = useMemo(() => {
		const hasFilters = poolFilterValues.size > 0 || courtFilterValues.size > 0;

		const byPool =
			data?.filter((pool) =>
				hasFilters ? poolFilterValues.has(pool.id) : true,
			) ?? [];

		const byCourt =
			data?.filter((pool) =>
				hasFilters
					? pool.court
						? courtFilterValues.has(pool.court)
						: false
					: true,
			) ?? [];

		return unionBy(byPool, byCourt, (pool) => pool.id);
	}, [data, poolFilterValues, courtFilterValues]);

	return (
		<TabPanel id="games">
			<div className="bg-gray-100 py-12 px-3">
				<DisclosureGroup
					className="max-w-2xl mx-auto"
					defaultExpandedKeys={filterOpen ? ["filter"] : []}
				>
					<Disclosure
						id="filter"
						onExpandedChange={(v) => setFilterOpen(v)}
						className="flex flex-col space-y-2"
					>
						<Heading>
							<AriaButton
								slot="trigger"
								className={title({
									class: "flex flex-row space-x-2 items-center cursor-pointer",
									size: "xs",
								})}
							>
								<span>Filter</span>
								{filterOpen ? <MinusIcon size={18} /> : <PlusIcon size={18} />}
							</AriaButton>
						</Heading>
						<DisclosurePanel className="flex flex-col space-y-2">
							<MultiSelect
								label="Pools"
								searchKey="pools"
								options={poolFilterOptions}
								values={poolFilterValues}
							/>

							<MultiSelect
								label="Courts"
								searchKey="courts"
								options={courtFilterOptions}
								values={courtFilterValues}
							/>

							<Link
								to={state.location.pathname}
								className={button({ color: "accent", class: "self-end" })}
							>
								Reset <Undo2Icon size={12} />
							</Link>
						</DisclosurePanel>
					</Disclosure>
				</DisclosureGroup>
			</div>
			<div className="max-w-4xl mx-auto py-12 flex flex-col gap-12">
				{visiblePools.map((pool) => (
					<div
						key={pool.id}
						className="flex flex-col space-y-6 bg-content-background-alt px-3 md:rounded-lg overflow-hidden"
					>
						<h2
							className={title({
								size: "sm",
								className:
									"uppercase bg-content-background text-center py-2 -mx-3",
							})}
						>
							Pool {pool.name.toUpperCase()}
							{pool.court ? <> — Court {pool.court}</> : null}
						</h2>

						<div className="flex flex-col space-y-6 w-full max-w-xl pb-8 mx-auto content-center">
							{sortBy(pool.matches, (m) => m.matchNumber).map((match) => (
								<PoolMatchGrid key={match.id} {...match} refetch={refetch} />
							))}
						</div>
					</div>
				))}
			</div>
		</TabPanel>
	);
}
