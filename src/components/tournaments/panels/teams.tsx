import { useViewerHasPermission } from "@/auth/shared";
import { title } from "@/components/base/primitives";
import {
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@/components/base/table";
import { TabPanel } from "@/components/base/tabs";
import { TeamsControlsToolbar } from "@/components/teams/controls/toolbar";
import { TeamControlsDropdown } from "@/components/teams/controls/dropdown";
import { teamsQueryOptions } from "@/functions/teams/get-teams";
import type { TournamentDivision } from "@/db/schema";
import { getLevelDisplay } from "@/hooks/tournament";
import { playerName } from "@/utils/profiles";
import { useSuspenseQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { orderBy } from "lodash-es";
import { useState, type ReactNode } from "react";
import { assert } from "@/utils/assert";

export function TeamsPanel({
	tournamentDivisionId,
	teamSize,
}: {
	tournamentDivisionId: TournamentDivision["id"];
	teamSize: TournamentDivision["teamSize"];
}) {
	const canEdit = useViewerHasPermission({
		tournament: ["update"],
	});

	const { data } = useSuspenseQuery(
		teamsQueryOptions({ tournamentDivisionId }),
	);

	const [edit, setEdit] = useState(false);

	const activeTeams = orderBy(
		data.filter(({ status }) => status !== "waitlisted"),
		["finish", "seed", "order", "createdAt"],
		["asc", "asc", "asc", "asc"],
	);

	const waitlist = orderBy(
		data.filter(({ status }) => status === "waitlisted"),
		["order", "createdAt"],
		["asc", "asc"],
	);

	return (
		<TabPanel id="teams">
			<div className="max-w-4xl mx-auto py-12 px-3 flex flex-col gap-3">
				<TeamsControlsToolbar className="self-end" />

				<div className="md:hidden border border-gray-300 rounded-lg">
					{activeTeams?.map(
						({ id, team: { players }, finish, seed, poolTeam }, i) => {
							const columns: [string, ReactNode][] = [
								["Finish", finish ?? "-"],
								["Seed", seed ?? "-"],
								["Pool", poolTeam?.pool.name.toUpperCase() ?? "-"],
								...players.map(({ profile }, j): [string, ReactNode] => [
									`Player ${j + 1}`,
									playerName(profile),
								]),
							];

							return (
								<div
									key={id}
									className={clsx(
										"flex flex-col items-stretch border-b border-gray-300 last:border-b-0",
										i % 2 === 0
											? "bg-transparent"
											: "bg-content-background-alt",
									)}
								>
									{columns.map(([label, value]: [string, ReactNode]) => (
										<div
											key={label}
											className={clsx(
												"p-2 flex flex-row justify-between items-center border-b border-gray-300 last:border-b-0",
											)}
										>
											<span className="font-semibold uppercase">{label}</span>
											<span>{value}</span>
										</div>
									))}
								</div>
							);
						},
					)}
				</div>
				<div className="hidden md:block">
					<Table aria-label="Teams">
						<TableHeader>
							<TableColumn id="finish" allowsSorting>
								Finish
							</TableColumn>
							<TableColumn id="seed" isRowHeader allowsSorting>
								Seed
							</TableColumn>
							<TableColumn id="pool" isRowHeader>
								Pool
							</TableColumn>
							{Array.from({ length: teamSize }).map((_, i) => (
								<TableColumn key={i} id={`player-${i}`} isRowHeader>
									Player {i + 1}
								</TableColumn>
							))}
							{canEdit && (
								<TableColumn id="actions" isRowHeader width={50}>
									Actions
								</TableColumn>
							)}
						</TableHeader>
						<TableBody
							key={edit ? "edit" : "not-edit"}
							items={activeTeams || []}
							renderEmptyState={() => (
								<div className="p-2 text-center w-full">No teams to show.</div>
							)}
						>
							{({
								id,
								team: { players },
								order,
								finish,
								seed,
								poolTeam,
								status,
							}) => {
								assert(
									players.length === teamSize,
									`players.length and teamSize should never be different: ${players.length} !== ${teamSize}`,
								);

								return (
									<TableRow key={id} data-order={order}>
										<TableCell>{finish ?? "-"}</TableCell>
										<TableCell>
											<div className="flex flex-row items-center gap-4">
												<span>{seed ?? "-"}</span>
											</div>
										</TableCell>
										<TableCell className="uppercase">
											<div className="flex flex-row items-center gap-4">
												<span>{poolTeam?.pool.name ?? "-"}</span>
											</div>
										</TableCell>

										{players.map(
											({
												id: playerId,
												profile: { firstName, preferredName, lastName, level },
											}) => (
												<TableCell key={playerId}>
													{preferredName ?? firstName} {lastName} (
													{getLevelDisplay(level)})
												</TableCell>
											),
										)}

										{/* {Array.from({ length: teamSize }).map((_, i) => { */}
										{/* 	const { */}
										{/* 		id: playerId, */}
										{/* 		profile: { firstName, preferredName, lastName, level }, */}
										{/* 	} = players[i]; */}
										{/**/}
										{/* 	return ( */}
										{/* 		<TableCell key={playerId}> */}
										{/* 			{preferredName ?? firstName} {lastName} ( */}
										{/* 			{getLevelDisplay(level)}) */}
										{/* 		</TableCell> */}
										{/* 	); */}
										{/* })} */}

										{canEdit && (
											<TableCell>
												<div className="flex flex-row flex-wrap">
													<TeamControlsDropdown
														tournamentDivisionTeamId={id}
														status={status}
														seed={seed}
														poolTeam={poolTeam}
													/>
												</div>
											</TableCell>
										)}
									</TableRow>
								);
							}}
						</TableBody>
					</Table>
				</div>
				{canEdit && waitlist.length > 0 && (
					<div className="hidden md:flex flex-col space-y-3 mt-6">
						<h3 className={title({ size: "sm" })}>Waitlist</h3>

						<Table aria-label="Waitlisted Teams">
							<TableHeader>
								{Array.from({ length: teamSize }).map((_, i) => (
									<TableColumn key={i} id={`player-${i}`} isRowHeader>
										Player {i + 1}
									</TableColumn>
								))}
								{canEdit && (
									<TableColumn id="actions" isRowHeader width={50}>
										Actions
									</TableColumn>
								)}
							</TableHeader>
							<TableBody
								key={edit ? "edit" : "not-edit"}
								items={waitlist || []}
							>
								{({ id, team: { players }, seed, poolTeam }) => (
									<TableRow key={id}>
										{players.map(
											({
												id: playerId,
												profile: { firstName, preferredName, lastName, level },
											}) => (
												<TableCell key={playerId}>
													{preferredName ?? firstName} {lastName} (
													{getLevelDisplay(level)})
												</TableCell>
											),
										)}

										{canEdit && (
											<TableCell>
												<div className="flex flex-row flex-wrap">
													<TeamControlsDropdown
														tournamentDivisionTeamId={id}
														status="waitlisted"
														seed={seed}
														poolTeam={poolTeam}
													/>
												</div>
											</TableCell>
										)}
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>
				)}
			</div>
		</TabPanel>
	);
}
