import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { DefaultLayout } from "@/layouts/default";
import { RadioGroup, RadioLink } from "@/components/base/radio-group";
import { title } from "@/components/base/primitives";
import type { Gender } from "@/db/schema/shared";
import { useQuery } from "@tanstack/react-query";
import {
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@/components/base/table";
import { ProfileName } from "@/components/profiles/name";
import { getLeaderboardQueryOptions } from "@/functions/profiles/get-leaderboard";
import { zodValidator } from "@tanstack/zod-adapter";
import z from "zod";
import { Pagination } from "@/components/base/pagination";
import { levelsQueryOptions } from "@/data/levels";
import { ToggleButtonGroup } from "@/components/base/toggle-button-group";
import { ToggleButtonLink } from "@/components/base/toggle-button";
import { withoutItem } from "@/lib/array";
import { SearchField } from "@/components/base/search-field";

function displayToGender(display: string): Gender | null {
	const gender: Gender | null =
		display === "mens" ? "male" : display === "womens" ? "female" : null;

	return gender;
}

export const Route = createFileRoute("/leaderboard/$gender")({
	validateSearch: zodValidator(
		z.object({
			levels: z.array(z.number()).default([]),
			query: z.string().default(""),
			page: z.number().default(1),
			pageSize: z.number().default(25),
		}),
	),
	loaderDeps: ({ search }) => search,
	loader: async ({
		params: { gender: genderStr },
		deps: { page, pageSize, query, levels },
		context: { queryClient },
	}) => {
		const gender = displayToGender(genderStr);

		if (!gender) {
			throw redirect({
				to: "/not-found",
			});
		}

		const profiles = await queryClient.ensureQueryData(
			getLeaderboardQueryOptions({
				query,
				gender,
				levels,
				page,
				pageSize,
			}),
		);

		return profiles;
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { gender: genderStr } = Route.useParams();
	const { levels: selectedLevels, query, page, pageSize } = Route.useSearch();

	const gender = displayToGender(genderStr) as Gender;

	const navigate = useNavigate();

	const { data } = useQuery(
		getLeaderboardQueryOptions({
			gender,
			query,
			levels: selectedLevels,
			page,
			pageSize,
		}),
	);

	const profiles = data?.data ?? [];
	const pageInfo = data?.pageInfo ?? { totalItems: 0, totalPages: 0 };

	const { data: levels } = useQuery({
		...levelsQueryOptions(),
		select: (data) =>
			data
				.filter(({ order }) => order > 0)
				.map((level) => ({
					...level,
					selected: selectedLevels.includes(level.id),
				})),
	});

	return (
		<DefaultLayout
			classNames={{
				content:
					"w-full max-w-lg mx-auto py-12 px-3 flex flex-col items-center space-y-6",
			}}
		>
			<h1 className={title()}>Rated Leaderboard</h1>

			<div className="flex flex-col items-center space-y-3">
				<RadioGroup defaultValue={gender} orientation="horizontal">
					<RadioLink
						to="/leaderboard/$gender"
						params={{ gender: "mens" }}
						value="male"
					>
						Men's
					</RadioLink>
					<RadioLink
						to="/leaderboard/$gender"
						params={{ gender: "womens" }}
						value="female"
					>
						Women's
					</RadioLink>
				</RadioGroup>

				<ToggleButtonGroup>
					{levels?.map(({ id, name, abbreviated, selected }) => (
						<ToggleButtonLink
							key={id}
							to="/leaderboard/$gender"
							params={{ gender: genderStr }}
							search={{
								page: 1,
								pageSize,
								levels: selected
									? withoutItem(selectedLevels, id)
									: selectedLevels.concat(id),
							}}
							isSelected={selected}
						>
							{(abbreviated ?? name).toUpperCase()}
						</ToggleButtonLink>
					))}
				</ToggleButtonGroup>
				<SearchField
					value={query}
					onChange={(value) => {
						navigate({
							replace: true,
							search: (search) => ({
								...search,
								page: 1,
								query: value,
							}),
						});
					}}
				/>
			</div>
			<Table aria-label="Teams">
				<TableHeader>
					<TableColumn id="rank" width={1}>
						Rank
					</TableColumn>
					<TableColumn id="points" width={1} isRowHeader>
						Points
					</TableColumn>
					<TableColumn id="player" isRowHeader>
						Player
					</TableColumn>
					<TableColumn id="level" width={1} isRowHeader />
				</TableHeader>
				<TableBody
					items={profiles || []}
					renderEmptyState={() => (
						<div className="p-2 text-center text-sm">
							Nothing to show. Try modifying your filters.
						</div>
					)}
				>
					{(profile) => {
						return (
							<TableRow key={profile.id}>
								<TableCell className="whitespace-nowrap">
									{profile.rank}
								</TableCell>
								<TableCell className="whitespace-nowrap">
									{Math.round(profile.ratedPoints)}
								</TableCell>
								<TableCell>
									<ProfileName {...profile} />
								</TableCell>
								<TableCell className="whitespace-nowrap">
									{(
										profile.level?.abbreviated ??
										profile.level?.name ??
										""
									).toUpperCase()}
								</TableCell>
							</TableRow>
						);
					}}
				</TableBody>
			</Table>
			<Pagination
				to="/leaderboard/$gender"
				page={page}
				pageSize={pageSize}
				pageInfo={pageInfo}
			/>
		</DefaultLayout>
	);
}
