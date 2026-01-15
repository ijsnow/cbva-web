import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import orderBy from "lodash-es/orderBy";
import { Heading } from "react-aria-components";

import { Button } from "@/components/base/button";
import { useAppForm } from "@/components/base/form";
import { Modal } from "@/components/base/modal";
import { title } from "@/components/base/primitives";
import { TeamNames } from "@/components/teams/names";
import { playoffsQueryOptions } from "@/functions/playoffs/get-playoffs";
import { getPoolsQueryOptions } from "@/functions/pools/get-pools";
import { teamsQueryOptions } from "@/functions/teams/get-teams";
import {
	assignWildcardMutationOptions,
	assignWildcardSchema,
} from "@/data/tournaments/playoffs";
import type { Division, TournamentDivision } from "@/db/schema";
import { getPoolStats, type PoolTeamStats } from "@/hooks/matches";
import { getTournamentDivisionDisplay } from "@/hooks/tournament";
import { formatOrdinals } from "@/lib/numbers";
import { isNotNullOrUndefined } from "@/utils/types";
import type { MatchTeam } from "../panels/games/pool-match-grid";

export type AssignWildcardFormProps = {
	tournamentId: number;
	division: TournamentDivision & { division: Division };
	matchId: number;
	opponent?: MatchTeam | null;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
};

export function AssignWildcardForm({
	tournamentId,
	division,
	matchId,
	opponent,
	onOpenChange,
	...props
}: AssignWildcardFormProps) {
	const queryClient = useQueryClient();

	const { mutate, failureReason } = useMutation({
		...assignWildcardMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: teamsQueryOptions({ tournamentDivisionId: division.id })
					.queryKey,
			});

			queryClient.invalidateQueries(
				playoffsQueryOptions({ tournamentDivisionId: division.id }),
			);

			onOpenChange(false);
		},
	});

	const schema = assignWildcardSchema.pick({
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
				id: matchId,
				teamId,
			});
		},
	});

	const { data: playoffTeams } = useQuery({
		...playoffsQueryOptions({ tournamentDivisionId: division.id }),
		select: (data) =>
			new Set(
				data
					.flatMap(({ teamAId, teamBId }) => [teamAId, teamBId])
					.filter(isNotNullOrUndefined),
			),
	});

	const { data: teams } = useQuery({
		...teamsQueryOptions({ tournamentDivisionId: division.id }),
		select: (data) =>
			data.filter(
				(team) =>
					!playoffTeams?.has(team.id) &&
					team.status === "confirmed" &&
					team.poolTeam?.finish,
			),
	});

	const { data: stats } = useQuery({
		...getPoolsQueryOptions({ tournamentDivisionId: division.id }),
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
		<Modal {...props} onOpenChange={onOpenChange}>
			<div className="p-3 flex flex-col space-y-4 relative">
				<Heading className={title({ size: "sm" })} slot="title">
					Assign Wildcard
				</Heading>

				<p className="text-sm text-gray-700 mb-6">
					Assign wildcard{" "}
					{opponent ? (
						<>
							to play against{" "}
							<span className="font-semibold italic">
								{isNotNullOrUndefined(opponent?.poolTeam.finish) &&
									formatOrdinals(opponent.poolTeam.finish)}{" "}
							</span>{" "}
							from{" "}
							<span className="font-semibold italic">
								Pool {opponent.poolTeam.pool.name.toUpperCase()}{" "}
							</span>
							in the
						</>
					) : (
						<>for the</>
					)}{" "}
					<span className="font-bold italic">
						{getTournamentDivisionDisplay(division)}
					</span>{" "}
					division.
				</p>

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
									<span className="col-start-2 col-span-4">Team</span>
									<span className="col-span-2">Pool</span>
									<span className="col-span-1 text-center">W/L</span>
									<span className="col-span-1">Diff</span>
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
										<span className="col-span-2">
											<span className="uppercase">
												{team.poolTeam.pool.name}
											</span>
											{team.poolTeam.finish}
										</span>
										<span className="col-span-1 text-center">
											{stats?.get(team.id)?.wins.size}/
											{stats?.get(team.id)?.losses.size}
										</span>
										<span className="col-span-1">
											{stats?.get(team.id)?.totalPointDiff}
										</span>
									</label>
								))}
							</div>
						)}
					/>

					<form.AppForm>
						<form.Footer>
							<Button onPress={() => onOpenChange(false)}>Cancel</Button>

							<form.SubmitButton>Create</form.SubmitButton>
						</form.Footer>
					</form.AppForm>
				</form>
			</div>
		</Modal>
	);
}
