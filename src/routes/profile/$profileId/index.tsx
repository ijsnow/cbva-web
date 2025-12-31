import { parseDate } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { round } from "lodash-es";
import { CircleCheckIcon, EditIcon } from "lucide-react";
import { Suspense } from "react";
import { titleCase } from "title-case";
import { useViewer, useViewerHasPermission } from "@/auth/shared";
import { button } from "@/components/base/button";
import { ComboBox, ComboBoxItem } from "@/components/base/combo-box";
import { Link } from "@/components/base/link";
import { Pagination } from "@/components/base/pagination";
import { pill, title } from "@/components/base/primitives";
import { Select } from "@/components/base/select";
import {
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@/components/base/table";
import { ImpersonateButton } from "@/components/impersonator/impersonate-button";
import { ProfileName } from "@/components/profiles/name";
import { ProfilePhoto } from "@/components/profiles/photo";
import { TeamNames } from "@/components/teams/names";
import { useDivisionFilterOptions } from "@/data/divisions";
import {
	profileOverviewQueryOptions,
	profileResultsQueryOptions,
} from "@/data/profiles";
import { useVenueFilterOptions } from "@/data/venues";
import { DefaultLayout } from "@/layouts/default";
import { getDefaultTimeZone } from "@/lib/dates";
import { isNotNullOrUndefined } from "@/utils/types";

export const Route = createFileRoute("/profile/$profileId/")({
	validateSearch: (
		search: Record<string, unknown>,
	): {
		page: number;
		// pageSize: number;
		divisions: number[];
		venues: number[];
	} => {
		return {
			page: Math.max(Number(search?.page ?? 1), 1),
			// pageSize: Math.max(Number(search?.pageSize ?? 25), 25),
			divisions: Array.isArray(search?.divisions) ? search.divisions : [],
			venues: Array.isArray(search?.venues) ? search.venues : [],
		};
	},
	loader: async ({ params: { profileId }, context: { queryClient } }) => {
		const result = await queryClient.ensureQueryData(
			profileOverviewQueryOptions(Number.parseInt(profileId, 10)),
		);

		return result;
	},
	head: () => ({
		meta: [{ title: "Player Profile" }],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { profileId } = Route.useParams();
	const { page, venues, divisions } = Route.useSearch();
	const pageSize = 25;

	const { data: profile } = useSuspenseQuery({
		...profileOverviewQueryOptions(Number.parseInt(profileId, 10)),
	});

	const dateFormatter = useDateFormatter({
		dateStyle: "short",
	});

	const { data: resultData } = useSuspenseQuery({
		...profileResultsQueryOptions({
			id: Number.parseInt(profileId, 10),
			venues,
			divisions,
			paging: {
				page,
				size: pageSize,
			},
		}),
		select: (data) => ({
			...data,
			data: data.data.map(({ date, ...rest }) => ({
				date: dateFormatter.format(
					parseDate(date).toDate(getDefaultTimeZone()),
				),
				...rest,
			})),
		}),
	});

	const accolades = [
		{
			label: "Rating",
			value: profile?.level?.display ?? profile?.level?.name,
		},
		{
			label: "Rank",
			value: profile?.rank,
		},
		{
			label: "Points",
			value: round(profile?.ratedPoints),
		},
		{
			label: "Junior Points",
			value: profile?.juniorsPoints ? round(profile?.juniorsPoints) : null,
		},
	].filter(({ value }) => isNotNullOrUndefined(value));

	const venueOptions = useVenueFilterOptions(true);
	const divisionOptions = useDivisionFilterOptions(true);

	const info = [
		{
			label: "Bio",
			className: "col-span-full",
			value: profile.bio,
		},
		{
			label: "Dominant Arm",
			value: profile.dominantArm,
			transform: (v: string) => titleCase(v),
		},
		{
			label: "Preferred Role",
			value: profile.preferredRole,
			transform: (v: string) => titleCase(v),
		},
		{
			label: "Height",
			value: profile.heightFeet
				? `${profile.heightFeet}'${profile.heightInches ? `${profile.heightInches}"` : ""}`
				: null,
		},
		{
			label: "Preferred Side",
			value: profile.preferredSide,
			transform: (v: string) => titleCase(v),
		},
		{
			label: "Club",
			value: profile.club,
		},
		{
			label: "College Team",
			value: profile.collegeTeam
				? `${profile.collegeTeam} ${profile.collegeTeamYearsParticipated ? `(${profile.collegeTeamYearsParticipated}	year(s))` : ""}`
				: null,
		},
	].filter(({ value }) => value !== null);

	const viewer = useViewer();

	const isViewer = viewer && viewer.id === profile.userId;

	const canEdit = useViewerHasPermission({
		user: ["update"],
	});

	return (
		<DefaultLayout
			classNames={{
				content: "pt-18 w-full relative bg-white",
			}}
		>
			<div className="flex flex-row gap-2 absolute top-6 right-6">
				<ImpersonateButton userId={profile?.userId} />
				{(isViewer || canEdit) && (
					<Link
						className={button({ color: "secondary" })}
						to="/profile/$profileId/edit"
						params={{
							profileId: profile.id.toString(),
						}}
					>
						<EditIcon size={14} className="mr -ml" />
						Edit
					</Link>
				)}
			</div>

			<Suspense>
				<div className="px-4 pb-18 max-w-5xl mx-auto flex flex-col md:flex-row items-center md:space-x-8">
					<div>
						<ProfilePhoto
							{...profile}
							className="w-48 min-w-48 h-48 min-h-48 mx-auto"
						/>
					</div>

					<div className="flex flex-col space-y-4 w-full items-start sm:items-stretch">
						<div className="py-2 flex flex-col space-y-3 md:space-y-0 md:flex-row md:space-x-6 items-center w-full">
							<h1 className={title({ size: "sm", class: "text-center" })}>
								<ProfileName {...profile} link={false} />
							</h1>

							<span className={pill({ class: "font-semibold", size: "sm" })}>
								<CircleCheckIcon size={16} /> <span>Active Member</span>
							</span>
						</div>

						<div className="mx-auto md:mx-0 max-w-fit grid grid-cols-2 sm:flex sm:flex-row sm:justify-start gap-4 sm:gap-12 sm:w-full">
							{accolades.map(({ label, value }) => (
								<div key={label}>
									<span className="font-semibold">{label}</span>
									<div className="uppercase text-5xl font-semibold">
										{value}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
				{info.length > 0 && (
					<div className="bg-content-background-alt">
						<div className="max-w-5xl mx-auto px-4 py-16 grid grid-cols-1 sm:grid-cols-9 gap-y-8 gap-4 text-center sm:text-left">
							{info.map(
								({ label, className = "col-span-3", value, transform }) => (
									<div className={className} key={label}>
										<span className="font-semibold mb-2">{label}</span>
										<p>{transform ? transform(value as string) : value}</p>
									</div>
								),
							)}
						</div>
					</div>
				)}
			</Suspense>

			<Suspense>
				<div className="flex flex-col space-y-12 bg-content-background w-full py-16">
					<div className="px-4 max-w-5xl w-full mx-auto flex flex-col space-y-12">
						<h2 className={title()}>Results</h2>

						<div className="flex flex-col space-y-3">
							<div className="gap-3 flex flex-col sm:flex-row">
								<Suspense>
									<ComboBox
										selectedKeys={venues}
										value={venues}
										multi={true}
										items={venueOptions}
										placeholder="All Beaches"
										className="w-full sm:max-w-xs"
									>
										{({ value, display, link }) => (
											<ComboBoxItem id={value} link={link}>
												{display}
											</ComboBoxItem>
										)}
									</ComboBox>
								</Suspense>

								<Suspense>
									<Select
										defaultValue={divisions}
										value={divisions}
										selectionMode="multiple"
										options={divisionOptions}
										placeholder="All Divisions"
										className="bg-white"
										containerClassName="w-full sm:max-w-xs"
									/>
								</Suspense>
							</div>

							<Table aria-label="Player's tournament results">
								<TableHeader className="bg-navbar-background">
									<TableColumn id="date" allowsSorting minWidth={100}>
										Date
									</TableColumn>
									<TableColumn id="tournament" isRowHeader minWidth={100}>
										Event
									</TableColumn>
									<TableColumn id="venue" isRowHeader minWidth={90}>
										Beach
									</TableColumn>
									<TableColumn id="division" isRowHeader minWidth={90}>
										Division
									</TableColumn>
									<TableColumn id="players" isRowHeader minWidth={90}>
										Players
									</TableColumn>
									<TableColumn id="finish" isRowHeader minWidth={90}>
										Finish
									</TableColumn>
									<TableColumn id="rating" isRowHeader minWidth={90}>
										Rating
									</TableColumn>
									<TableColumn id="points" isRowHeader minWidth={90}>
										Points
									</TableColumn>
								</TableHeader>

								<TableBody items={resultData.data}>
									{({
										id,
										tournamentId,
										tournamentDivisionId,
										date,
										event,
										venue,
										division,
										players,
										finish,
										rating,
										points,
									}) => {
										return (
											<TableRow key={id}>
												<TableCell>
													<Link
														className="no-underline hover:underline"
														to="/tournaments/$tournamentId/$divisionId/{-$tab}"
														params={{
															tournamentId: tournamentId.toString(),
															divisionId: tournamentDivisionId.toString(),
														}}
													>
														{date}
													</Link>
												</TableCell>
												<TableCell>
													<Link
														className="no-underline hover:underline"
														to="/tournaments/$tournamentId/$divisionId/{-$tab}"
														params={{
															tournamentId: tournamentId.toString(),
															divisionId: tournamentDivisionId.toString(),
														}}
													>
														{event}
													</Link>
												</TableCell>
												<TableCell>{venue}</TableCell>
												<TableCell>{division}</TableCell>
												<TableCell>
													<TeamNames players={players} />
												</TableCell>
												<TableCell>{finish}</TableCell>
												<TableCell>{rating}</TableCell>
												<TableCell>{points}</TableCell>
											</TableRow>
										);
									}}
								</TableBody>
							</Table>

							<Pagination
								to={Route.fullPath}
								page={page}
								pageSize={pageSize}
								pageInfo={resultData.pageInfo}
							/>
						</div>
					</div>
				</div>
			</Suspense>
		</DefaultLayout>
	);
}
