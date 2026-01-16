import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import clsx from "clsx";
import { ChevronLeftIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { tv } from "tailwind-variants";
import { Button } from "@/components/base/button";
import { subtitle, title } from "@/components/base/primitives";
import { Tab, TabList, TabPanel, Tabs } from "@/components/base/tabs";
import { TournamentDirectorMatchControls } from "@/components/matches/director-controls";
import { RefereeControls } from "@/components/matches/referee-controls";
import {
	applyMatchSetAction,
	updateScoreMutationOptions,
} from "@/functions/matches";
import { RefsList } from "@/components/refs/refs-list";
import { getMatchQueryOptions } from "@/functions/matches/get-match";

const scoreStyles = tv({
	base: "bg-blue-500 text-white h-36 w-36 rounded-md flex items-center justify-center text-5xl font-bold",
	variants: {
		variant: {
			a: "bg-blue-500",
			b: "bg-red-500",
		},
	},
});

// TODOs:
//
// - Start match
// - Undo complete match (subtrack 1 from winning score and change status)
// - N to switch
// - Side switch modal
// - Serve order tracker
//
// - Referees for permission

export type ScoreBoardProps = {
	poolMatchId?: number;
	playoffMatchId?: number;
};

export function ScoreBoard({ poolMatchId, playoffMatchId }: ScoreBoardProps) {
	const queryClient = useQueryClient();

	const queryOptions = getMatchQueryOptions({
		poolMatchId,
		playoffMatchId,
	});

	const { data: match, isLoading } = useSuspenseQuery(queryOptions);

	const { mutate, isPending } = useMutation({
		// TODO: optimistically update score
		...updateScoreMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries(queryOptions);
		},
	});

	const makeUpdateScoreHandler =
		(action: "increment" | "decrement") =>
		(matchSetId: number, teamA: boolean) => {
			const actionPayload = {
				id: matchSetId,
				action,
				teamA,
			};

			mutate(actionPayload);

			queryClient.setQueryData(queryOptions.queryKey, (data) => {
				if (!data) {
					return undefined;
				}

				return {
					...data,
					sets: data?.sets.map((set) =>
						set.id === matchSetId
							? applyMatchSetAction(actionPayload, set)
							: set,
					),
				};
			});
		};

	const handleIncrement = makeUpdateScoreHandler("increment");
	const handleDecrement = makeUpdateScoreHandler("decrement");

	const [activeTabKey, setActiveTabKey] = useState<number | undefined>(
		match?.sets[0]?.id,
	);

	const isDone = match?.status === "completed";

	const isActionDisabled = isLoading || isPending;

	return (
		<div>
			{match && activeTabKey && (
				<TournamentDirectorMatchControls
					tournamentDivisionId={match.tournamentDivisionId}
					poolMatchId={poolMatchId}
					playoffMatchId={playoffMatchId}
					setId={activeTabKey}
				/>
			)}

			<Link
				className="absolute top-6 left-6 flex flex-row space-x-2 items-center"
				to="/tournaments/$tournamentId/$divisionId/{-$tab}"
				params={{
					tournamentId: match?.tournamentId.toString(),
					divisionId: match?.tournamentDivisionId.toString(),
				}}
			>
				<ChevronLeftIcon size={16} /> <span>Back to tournament</span>
			</Link>

			<div className="w-full max-w-3xl mx-auto flex flex-col space-y-8">
				<div className="flex flex-row items-center">
					<div className="flex-1 flex items-center justify-center">
						<span
							className={title({
								size: "sm",
								className: clsx(
									"text-center max-w-lg leading-tight",
									isDone &&
										match?.winnerId === match?.teamAId &&
										"font-normal text-gray-500",
								),
							})}
						>
							{match?.teamA?.team.players
								.map(
									({ profile: { firstName, preferredName, lastName } }) =>
										`${preferredName || firstName} ${lastName}`,
								)
								.join(" & ")}
						</span>
					</div>
					<span className={subtitle({ class: "flex-0 italic" })}>vs</span>
					<div className="flex-1 flex items-center justify-center">
						<span
							className={title({
								size: "sm",
								className: clsx(
									"text-center max-w-lg leading-tight",
									isDone &&
										match?.winnerId === match?.teamBId &&
										"font-normal text-gray-500",
								),
							})}
						>
							{match?.teamB?.team.players
								.map(
									({ profile: { firstName, preferredName, lastName } }) =>
										`${preferredName || firstName} ${lastName}`,
								)
								.join(" & ")}
						</span>
					</div>
				</div>
				{match?.court && (
					<h2 className={title({ size: "xs", class: "text-center" })}>
						Court {match.court}
					</h2>
				)}
				<div>
					{match && (
						<RefsList
							tournamentDivisionId={match.tournamentDivisionId}
							poolMatchId={match.poolMatchId}
							playoffMatchId={match.playoffMatchId}
							matchStatus={match.status}
							refs={match.refs}
						/>
					)}
				</div>
			</div>

			<Tabs
				defaultSelectedKey={match.sets.at(1)?.id}
				onSelectionChange={(key) => setActiveTabKey(key)}
			>
				<div
					className={clsx("overflow-x-auto", match.sets.length === 1 && "h-0")}
				>
					<TabList aria-label="Match Sets" className="px-6 min-w-max">
						{match.sets.map((s, i) => (
							<Tab
								key={s.id}
								id={s.id}
								isDisabled={Boolean(isDone && !s.startedAt)}
							>
								Set {i + 1}
							</Tab>
						))}
					</TabList>
				</div>

				{match.sets
					.sort((a, b) => a.setNumber - b.setNumber)
					.map((s) => (
						<TabPanel key={s.id} id={s.id}>
							<div className="flex flex-row justify-around py-18 w-full max-w-3xl mx-auto">
								{[
									[match.teamAId, s.teamAScore],
									[match.teamBId, s.teamBScore],
								].map(([key, score], i) => (
									<div key={key} className="flex flex-row gap-3">
										<div
											className={scoreStyles({
												variant: i === 0 ? "a" : "b",
											})}
										>
											{score ?? "-"}
										</div>
										{s.status === "in_progress" && (
											<div className="flex flex-col gap-3 justify-center">
												<Button
													onPress={() => handleIncrement(s.id, i === 0)}
													isDisabled={isActionDisabled}
												>
													<PlusIcon size={28} />
												</Button>
												<Button
													onPress={() => handleDecrement(s.id, i === 0)}
													isDisabled={isActionDisabled}
												>
													<MinusIcon size={28} />
												</Button>
											</div>
										)}
									</div>
								))}
							</div>

							<RefereeControls
								match={match}
								set={s}
								queryKey={queryOptions.queryKey}
							/>
						</TabPanel>
					))}
			</Tabs>
		</div>
	);
}
