import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import clsx from "clsx";
import { MinusIcon, PlusIcon } from "lucide-react";
import { tv } from "tailwind-variants";

import { Button } from "@/components/base/button";
import { subtitle, title } from "@/components/base/primitives";
import { Tab, TabList, TabPanel, Tabs } from "@/components/base/tabs";
import { poolMatchQueryOptions } from "@/data/matches";
import { DefaultLayout } from "@/layouts/default";
import { playerNames } from "@/utils/profiles";
import { isNotNull } from "@/utils/types";
import {
	applyMatchSetAction,
	updateScoreMutationOptions,
} from "@/data/tournaments/matches";
import { dbg } from "@/utils/dbg";

export const Route = createFileRoute("/matches/pool/$matchId/")({
	loader: async ({ params: { matchId }, context: { queryClient } }) => {
		const match = await queryClient.ensureQueryData(
			poolMatchQueryOptions(Number.parseInt(matchId, 10)),
		);

		if (!match) {
			throw notFound();
		}

		return match;
	},
	head: ({ loaderData }) => ({
		meta: loaderData
			? [
					{
						title: `Match ${loaderData.matchNumber}: ${[
							loaderData.teamA,
							loaderData.teamB,
						]
							.filter(isNotNull)
							.map(({ team }) =>
								playerNames(team.players.map(({ profile }) => profile)).join(
									" & ",
								),
							)
							.join(" vs ")}`,
					},
				]
			: undefined,
	}),
	component: RouteComponent,
});

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
// - Side switch modal
// - Serve order tracker
//
// - Referees for permission

function RouteComponent() {
	const { matchId } = Route.useParams();

	const queryClient = useQueryClient();

	const poolMatchQuery = poolMatchQueryOptions(Number.parseInt(matchId, 10));

	const { mutate, isPending } = useMutation({
		// TODO: optimistically update score
		...updateScoreMutationOptions(),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: poolMatchQuery.queryKey,
			});
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

			queryClient.setQueryData(poolMatchQuery.queryKey, (data) => {
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

	const { data, isLoading } = useSuspenseQuery(poolMatchQuery);

	const isDone = data?.status === "completed";

	const isActionDisabled = isLoading || isPending;

	return (
		<DefaultLayout>
			<div>
				{data?.court && <h1 className={title()}>Court {data.court}</h1>}

				<div className="flex flex-row items-center">
					<div className="flex-1 flex items-center justify-center">
						<span
							className={title({
								size: "sm",
								className: clsx(
									"text-center max-w-lg leading-tight",
									isDone &&
										data?.winnerId === data?.teamAId &&
										"font-normal text-gray-500",
								),
							})}
						>
							{data?.teamA?.team.players
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
										data?.winnerId === data?.teamBId &&
										"font-normal text-gray-500",
								),
							})}
						>
							{data?.teamB?.team.players
								.map(
									({ profile: { firstName, preferredName, lastName } }) =>
										`${preferredName || firstName} ${lastName}`,
								)
								.join(" & ")}
						</span>
					</div>
				</div>
			</div>

			<Tabs defaultSelectedKey={data?.sets.at(1)?.id}>
				<div
					className={clsx("overflow-x-auto", data?.sets.length === 1 && "h-0")}
				>
					<TabList aria-label="Match Sets" className="px-6 min-w-max">
						{data?.sets.map((s, i) => (
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

				{data?.sets
					.sort((a, b) => a.setNumber - b.setNumber)
					.map((s) => (
						<TabPanel key={s.id} id={s.id}>
							<div className="flex flex-row justify-around py-18">
								{[
									[data?.teamAId, s.teamAScore],
									[data?.teamBId, s.teamBScore],
								].map(([key, score], i) => (
									<div key={key} className="flex flex-row gap-3">
										<div
											className={scoreStyles({ variant: i === 0 ? "a" : "b" })}
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
						</TabPanel>
					))}
			</Tabs>
		</DefaultLayout>
	);
}
