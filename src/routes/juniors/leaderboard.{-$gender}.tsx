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
import {
	getJuniorsLeaderboardQueryOptions,
	getJuniorsLeaderboardSchema,
} from "@/functions/profiles/get-juniors-leaderboard";
import { zodValidator } from "@tanstack/zod-adapter";
import z from "zod";
import { Pagination } from "@/components/base/pagination";
import { ToggleButtonGroup } from "@/components/base/toggle-button-group";
import { ToggleButtonLink } from "@/components/base/toggle-button";
import { SearchField } from "@/components/base/search-field";
import { assert } from "@/utils/assert";
import { useDebounce } from "ahooks";
import { Information } from "@/components/base/information";

function displayToGender(display: string): Gender | null {
	const gender: Gender | null =
		display === "mens" ? "male" : display === "womens" ? "female" : null;

	return gender;
}

export const Route = createFileRoute("/juniors/leaderboard/{-$gender}")({
	validateSearch: zodValidator(
		z.object({
			query: z.string().default(""),
			division: getJuniorsLeaderboardSchema.shape.juniors.default(true),
			page: z.number().default(1),
			pageSize: z.number().default(25),
		}),
	),
	loaderDeps: ({ search }) => search,
	loader: async ({
		params: { gender: genderStr },
		deps: { page, pageSize, query, division },
		context: { queryClient },
	}) => {
		if (!genderStr) {
			throw redirect({
				to: "/juniors/leaderboard/{-$gender}",
				params: {
					gender: "womens",
				},
			});
		}

		const gender = displayToGender(genderStr);

		if (!gender) {
			throw redirect({
				to: "/not-found",
			});
		}

		const profiles = await queryClient.ensureQueryData(
			getJuniorsLeaderboardQueryOptions({
				query,
				gender,
				juniors: division,
				page,
				pageSize,
			}),
		);

		return profiles;
	},
	component: RouteComponent,
});

const divisions = [
	{ value: 12, label: "12U" },
	{ value: 14, label: "14U" },
	{ value: 16, label: "16U" },
	{ value: 18, label: "18U" },
] as const;

function RouteComponent() {
	const { gender: genderStr } = Route.useParams();
	const { query, division, page, pageSize } = Route.useSearch();

	assert(genderStr, "expected gender param");

	const gender = displayToGender(genderStr) as Gender;

	const navigate = useNavigate();

	const { data } = useQuery(
		getJuniorsLeaderboardQueryOptions({
			gender,
			query,
			juniors: division,
			page,
			pageSize,
		}),
	);

	const profiles = useDebounce(data?.data, {
		wait: data?.data.length === 0 ? 0 : 250,
	});

	const pageInfo = data?.pageInfo ?? { totalItems: 0, totalPages: 0 };

	return (
		<DefaultLayout
			classNames={{
				content:
					"w-full max-w-lg mx-auto py-12 px-3 flex flex-col items-center space-y-6",
			}}
		>
			<h1 className={title()}>Juniors Leaderboard</h1>

			<div className="flex flex-col items-center space-y-3">
				<RadioGroup defaultValue={gender} orientation="horizontal">
					<RadioLink
						to="/juniors/leaderboard/{-$gender}"
						params={{ gender: "mens" }}
						value="male"
					>
						Boys
					</RadioLink>
					<RadioLink
						to="/juniors/leaderboard/{-$gender}"
						params={{ gender: "womens" }}
						value="female"
					>
						Girls
					</RadioLink>
				</RadioGroup>

				<div className="relative">
					<ToggleButtonGroup>
						{divisions.map(({ value, label }) => (
							<ToggleButtonLink
								key={value}
								to="/juniors/leaderboard/{-$gender}"
								params={{ gender: genderStr }}
								search={(prev) => ({
									...prev,
									page: 1,
									division: division === value ? undefined : value,
								})}
								isSelected={division === true ? true : division >= value}
							>
								{label}
							</ToggleButtonLink>
						))}
					</ToggleButtonGroup>
					<Information triggerClassName="absolute left-full top-1/2 -translate-y-1/2 ml-2">
						Each division includes the younger divisions.
					</Information>
				</div>

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
					<TableColumn id="hsgy" width={1} isRowHeader>
						Year
					</TableColumn>
				</TableHeader>
				<TableBody
					items={profiles || []}
					renderEmptyState={() => (
						<div className="p-2 text-center text-sm">
							Nothing to show. Try modifying your filters.
						</div>
					)}
				>
					{(profile) => (
						<TableRow key={profile.id}>
							<TableCell className="whitespace-nowrap">
								{profile.odRank}
							</TableCell>
							<TableCell className="whitespace-nowrap">
								{Math.round(profile.juniorsPoints)}
							</TableCell>
							<TableCell>
								<span className="mr-2">
									<ProfileName {...profile} />
								</span>
								<span>
									(
									{(
										profile.level?.abbreviated ??
										profile.level?.name ??
										""
									).toUpperCase()}
									)
								</span>
							</TableCell>
							<TableCell className="whitespace-nowrap">
								{profile.highSchoolGraduationYear}
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
			<Pagination
				to="/juniors/leaderboard/{-$gender}"
				page={page}
				pageSize={pageSize}
				pageInfo={pageInfo}
			/>
		</DefaultLayout>
	);
}
