import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import clsx from "clsx";
import { ChevronLeftIcon, MinusIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { tv } from "tailwind-variants";
import { Button } from "@/components/base/button";
import { subtitle, title } from "@/components/base/primitives";
import { Tab, TabList, TabPanel, Tabs } from "@/components/base/tabs";
import { TournamentDirectorMatchControls } from "@/components/matches/director-controls";
import { RefereeControls } from "@/components/matches/referee-controls";
import { poolMatchQueryOptions } from "@/data/matches";
import {
	applyMatchSetAction,
	updateScoreMutationOptions,
} from "@/functions/matches";
import { DefaultLayout } from "@/layouts/default";
import { playerNames } from "@/utils/profiles";
import { isNotNull } from "@/utils/types";
import { RefsList } from "@/components/refs/refs-list";
import { ScoreBoard } from "@/components/matches/score-board";

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
// - N to switch
// - Side switch modal
// - Serve order tracker
//
// - Referees for permission

function RouteComponent() {
	const { matchId: matchIdStr } = Route.useParams();

	const matchId = Number.parseInt(matchIdStr, 10);

	const { data, isLoading } = useSuspenseQuery(poolMatchQueryOptions(matchId));

	return (
		<DefaultLayout>
			<ScoreBoard {...data} />
		</DefaultLayout>
	);
}
