import { useSuspenseQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useState, type ReactNode } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@/components/base/table";
import { TabPanel } from "@/components/base/tabs";
import { TeamsControls } from "@/components/teams/controls";
import { teamsQueryOptions } from "@/data/teams";
import type { TournamentDivision } from "@/db/schema";
import { getLevelDisplay } from "@/hooks/tournament";
import { playerName } from "@/utils/profiles";
import { SwapSeedsForm } from "@/components/teams/controls/swap-seeds";
import { EditPoolForm } from "@/components/teams/controls/edit-pool";
import { EditSeedForm } from "@/components/teams/controls/edit-seed";

export function TeamsPanel({
	tournamentDivisionId,
	teamSize,
}: {
	tournamentDivisionId: TournamentDivision["id"];
	teamSize: TournamentDivision["teamSize"];
}) {
	const { data } = useSuspenseQuery(
		teamsQueryOptions({ tournamentDivisionId }),
	);

	const lastSeed = Math.max(
		...(data?.map(({ seed }) => seed ?? Number.POSITIVE_INFINITY) ?? []),
	);

	const [edit, setEdit] = useState(false);

	return (
		<TabPanel id="teams">
			<div className="max-w-4xl mx-auto py-12 px-3 flex flex-col gap-3">
				<TeamsControls
					className="self-end"
					onEditPress={edit ? undefined : () => setEdit(true)}
					onDonePress={edit ? () => setEdit(false) : undefined}
				/>

				<div className="md:hidden border border-gray-300 rounded-lg">
					{data?.map(({ id, team: { players }, finish, seed, poolTeam }, i) => {
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
									i % 2 === 0 ? "bg-transparent" : "bg-content-background-alt",
								)}
							>
								{columns.map(([label, value]: [string, ReactNode], j) => (
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
					})}
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
						</TableHeader>
						<TableBody key={edit ? "edit" : "not-edit"} items={data || []}>
							{({ id, team: { players }, finish, seed, poolTeam }) => (
								<TableRow key={id}>
									<TableCell>{finish ?? "-"}</TableCell>
									<TableCell>
										<div className="flex flex-row items-center gap-4">
											<span>{seed ?? "-"}</span>
											{edit && seed && (
												<EditSeedForm
													tournamentDivisionTeamId={id}
													seed={seed}
													target="division"
												/>
											)}
										</div>
									</TableCell>
									<TableCell className="uppercase">
										<div className="flex flex-row items-center gap-4">
											<span>{poolTeam?.pool.name ?? "-"}</span>
											{edit && poolTeam?.pool.name && (
												<EditPoolForm
													tournamentDivisionTeamId={id}
													poolId={poolTeam.poolId}
												/>
											)}
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
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
			</div>
		</TabPanel>
	);
}
