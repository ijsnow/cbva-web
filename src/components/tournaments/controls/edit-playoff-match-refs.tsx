import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import orderBy from "lodash-es/orderBy";
import { EditIcon } from "lucide-react";
import { useState } from "react";
import { Heading } from "react-aria-components";
import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { TeamNames } from "@/components/teams/names";
import { playoffsQueryOptions } from "@/data/playoffs";
import { poolsQueryOptions } from "@/data/pools";
import { teamsQueryOptions } from "@/data/teams";
import { editPlayoffMatchRefTeamSchema } from "@/data/tournaments/referee";
import { getPoolStats, type PoolTeamStats } from "@/hooks/matches";
import { isNotNullOrUndefined } from "@/utils/types";
import type { MatchTeam } from "../panels/games/pool-match-grid";
import { editMatchRefTeamMutationOptions } from "@/functions/refs/edit-match-ref-teams";

export type EditPlayoffMatchRefsFormProps = {
	tournamentDivisionId: number;
	opponent?: MatchTeam | null;
	playoffMatchId?: number;
	poolMatchId?: number;
};

// TODO: for pool, only show teams in pool
// TODO: Also show remove ref button
// TODO: undo abandon ref

export function EditMatchRefsForm({
	tournamentDivisionId,
	playoffMatchId,
	poolMatchId,
	opponent,
	...props
}: EditPlayoffMatchRefsFormProps) {
	const queryClient = useQueryClient();

	const [isOpen, setOpen] = useState(false);

	const { mutate, failureReason } = useMutation({
		...editMatchRefTeamMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(
				teamsQueryOptions({ tournamentDivisionId }),
			);

			queryClient.invalidateQueries(
				playoffsQueryOptions({ tournamentDivisionId }),
			);

			setOpen(false);
		},
	});

	const schema = editPlayoffMatchRefTeamSchema.pick({
		teamId: true,
	});

	const form = useAppForm({
		defaultValues: {
			teamId: null as unknown as number,
		},
		validators: {
			onMount: schema,
			onChange: schema,
		},
		onSubmit: ({ value: { teamId } }) => {
			mutate({
				poolMatchId,
				playoffMatchId,
				teamId,
			});
		},
	});

	const { data: teams } = useQuery({
		...teamsQueryOptions({ tournamentDivisionId }),
		// select: (data) =>
		// 	data.filter(
		// 		(team) =>
		// 			!playoffTeams?.has(team.id) &&
		// 			team.status === "confirmed" &&
		// 			team.poolTeam?.finish,
		// 	),
	});

	const { data: stats } = useQuery({
		...poolsQueryOptions({ tournamentDivisionId }),
		select: (data) => {
			const stats = new Map(
				data
					.map((pool) => {
						const stats = getPoolStats(pool);

						return stats ? { pool: pool.name, stats } : null;
					})
					.filter(isNotNullOrUndefined)
					.flatMap(({ stats }) =>
						Object.keys(stats).map(
							(teamId) =>
								[
									Number.parseInt(teamId, 10),
									stats[teamId as unknown as number],
								] as [number, PoolTeamStats],
						),
					),
			);

			return stats;
		},
	});

	const orderedTeams = orderBy(
		teams,
		[
			(team) => team.poolTeam?.finish,
			(team) => {
				const teamStats = stats?.get(team.id);

				if (teamStats) {
					return (
						teamStats.wins.size / teamStats.wins.size + teamStats.losses.size
					);
				}

				return 0;
			},
			(team) => stats?.get(team.id)?.totalPointDiff,
			(team) => team.poolTeam?.pool.name,
		],
		["asc", "asc", "desc", "asc"],
	);

	return (
		<>
			<Button
				size="xs"
				variant="text"
				className="text-blue-500 hover:text-blue-600"
				onPress={() => {
					setOpen(true);
				}}
			>
				<EditIcon size={12} />
			</Button>

			<Modal {...props} isOpen={isOpen} onOpenChange={setOpen}>
				<div className="p-3 flex flex-col space-y-4 relative">
					<Heading className={title({ size: "sm" })} slot="title">
						Assign Referee Duties
					</Heading>

					<form
						className="flex flex-col space-y-6"
						onSubmit={(e) => {
							e.preventDefault();

							form.handleSubmit();
						}}
					>
						{failureReason && (
							<form.AppForm>
								<form.Alert
									title={"Unable to create pools"}
									description={failureReason.message}
								/>
							</form.AppForm>
						)}

						<form.AppField
							name="teamId"
							children={(field) => (
								<div className="flex flex-col space-y max-h-96 overflow-y-scroll">
									<div className="grid grid-cols-9 gap-x-2 items-center w-full px-3">
										<span className="col-start-2 col-span-full">Team</span>
									</div>
									{orderedTeams.map((team) => (
										<label
											key={team.id}
											className="grid grid-cols-9 gap-x-2 items-center w-full p-2 rounded-md bg-white border-gray-300"
										>
											<input
												type="radio"
												className="col-span-1"
												name="team_url"
												onChange={({ currentTarget }) => {
													if (currentTarget.checked) {
														field.handleChange(team.id);
													}
												}}
											/>
											<span className="col-span-4 text-ellipsis overflow-x-hidden whitespace-nowrap">
												<TeamNames
													players={team.team.players}
													showFirst={false}
													separator="/"
													link={false}
												/>
											</span>
										</label>
									))}
								</div>
							)}
						/>

						<form.AppForm>
							<form.Footer>
								<Button onPress={() => setOpen(false)}>Cancel</Button>

								<form.SubmitButton>Create</form.SubmitButton>
							</form.Footer>
						</form.AppForm>
					</form>
				</div>
			</Modal>
		</>
	);
}
