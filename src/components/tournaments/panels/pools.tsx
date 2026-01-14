import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { subtitle, title } from "@/components/base/primitives";
import {
	Table,
	TableBody,
	TableCell,
	TableColumn,
	TableHeader,
	TableRow,
} from "@/components/base/table";
import { TabPanel } from "@/components/base/tabs";
import { ProfileName } from "@/components/profiles/name";
import { poolsQueryOptions } from "@/data/pools";
import type { Tournament, TournamentDivision } from "@/db/schema";
import { getPoolStats } from "@/hooks/matches";
import { SetCourtForm } from "../controls/set-court";
import { EditSeedForm } from "@/components/teams/controls/edit-seed";
import { Toolbar } from "@/components/base/toolbar";
import { Group } from "react-aria-components";
import { Button } from "@/components/base/button";
import { CheckIcon, EditIcon } from "lucide-react";
import { useViewerHasPermission } from "@/auth/shared";
import { isNotNullOrUndefined } from "@/utils/types";
import { PoolFinishInfo } from "@/components/pools/finish-info";

export function PoolsPanel({
	id,
	tournamentDivisionId,
}: Pick<Tournament, "id"> & {
	tournamentDivisionId: TournamentDivision["id"];
}) {
	const canEdit = useViewerHasPermission({
		tournament: ["update"],
	});

	const [editPoolId, setEditPoolId] = useState<number | undefined>(undefined);

	const { data } = useSuspenseQuery(
		poolsQueryOptions({ tournamentDivisionId }),
	);

	const pools = useMemo(() => {
		return data?.map((pool) => ({
			pool,
			stats: getPoolStats(pool),
		}));
	}, [data]);

	return (
		<TabPanel id="pools">
			<div className="max-w-4xl mx-auto py-12 px-3 flex flex-col gap-12">
				{pools?.map(({ pool, stats }) => {
					if (stats) {
						pool.teams.sort((a, b) => {
							return stats[a.teamId]?.rank - stats[b.teamId]?.rank;
						});
					}

					const orderedTeams = pool.teams;

					return (
						<div key={pool.id} className="flex flex-col gap-6">
							<div>
								<h2
									className={title({
										size: "sm",
										className: "uppercase flex flex-row items-center space-x-3",
									})}
								>
									<span>Pool {pool.name}</span>
								</h2>

								<h3 className={subtitle()}>
									<SetCourtForm
										tournamentId={id}
										tournamentDivisionId={tournamentDivisionId}
										poolId={pool.id}
										name={`Pool ${pool.name.toUpperCase()}`}
										court={pool.court}
									/>
								</h3>
							</div>

							<div className="flex flex-col space-y-2 items-end">
								{canEdit && (
									<Toolbar
										aria-label="Text formatting"
										className="flex gap-4 w-fit"
									>
										<Group aria-label="Clipboard" className="flex gap-2">
											<Button
												variant="icon"
												onPress={() =>
													setEditPoolId((curr) =>
														isNotNullOrUndefined(curr) ? undefined : pool.id,
													)
												}
											>
												{editPoolId === pool.id ? (
													<CheckIcon size={12} />
												) : (
													<EditIcon size={12} />
												)}
											</Button>
										</Group>
									</Toolbar>
								)}

								<Table aria-label={`Pool ${pool.name.toUpperCase()}`}>
									<TableHeader className="bg-navbar-background">
										<TableColumn id="finish" allowsSorting minWidth={100}>
											Finish
										</TableColumn>
										<TableColumn
											id="seed"
											isRowHeader
											allowsSorting
											minWidth={100}
										>
											Seed
										</TableColumn>
										<TableColumn id="team" isRowHeader minWidth={90}>
											Team
										</TableColumn>
										<TableColumn id="wins" isRowHeader minWidth={90}>
											Wins
										</TableColumn>
										<TableColumn id="losses" isRowHeader minWidth={90}>
											Losses
										</TableColumn>
									</TableHeader>
									<TableBody items={orderedTeams} key={editPoolId}>
										{({
											id,
											seed,
											team: {
												id: teamId,
												team: { players },
											},
											finish,
										}) => {
											const teamStats = stats?.[teamId];

											const wins = teamStats?.wins.size;
											const losses = teamStats?.losses.size;

											return (
												<TableRow key={id}>
													<TableCell>
														<div className="flex flex-row items-center gap-2">
															<span>
																{finish ?? stats?.[teamId]?.rank ?? "-"}
															</span>
															{(finish ?? stats?.[teamId]?.rank) && (
																<PoolFinishInfo
																	poolId={pool.id}
																	activeTeamId={teamId}
																/>
															)}
														</div>
													</TableCell>
													<TableCell>
														<div className="flex flex-row items-center gap-4">
															<span>{seed ?? "-"}</span>
															{editPoolId === pool.id && seed && (
																<EditSeedForm
																	tournamentDivisionTeamId={teamId}
																	seed={seed}
																	target="pool"
																/>
															)}
														</div>
													</TableCell>
													<TableCell>
														<span className="flex flex-col md:flex-row gap-1">
															{players.map(({ profile }, i) => (
																<span key={profile.id}>
																	<ProfileName {...profile} />{" "}
																	{i === players.length - 1 ? null : (
																		<span className="hidden md:inline-block">
																			{" "}
																			&{" "}
																		</span>
																	)}
																</span>
															))}
														</span>
													</TableCell>
													<TableCell>{wins ?? "-"}</TableCell>
													<TableCell>{losses ?? "-"}</TableCell>
												</TableRow>
											);
										}}
									</TableBody>
								</Table>
							</div>
						</div>
					);
				})}
			</div>
		</TabPanel>
	);
}
