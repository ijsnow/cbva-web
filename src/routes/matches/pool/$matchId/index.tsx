import { createFileRoute, notFound } from "@tanstack/react-router";
import { DefaultLayout } from "@/layouts/default";
import { playerNames } from "@/utils/profiles";
import { isNotNull } from "@/utils/types";
import { ScoreBoard } from "@/components/matches/score-board";
import { getMatchQueryOptions } from "@/functions/matches/get-match";

export const Route = createFileRoute("/matches/pool/$matchId/")({
	loader: async ({ params: { matchId }, context: { queryClient } }) => {
		const match = await queryClient.ensureQueryData(
			getMatchQueryOptions({ poolMatchId: Number.parseInt(matchId, 10) }),
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

	const poolMatchId = Number.parseInt(matchIdStr, 10);

	return (
		<DefaultLayout>
			<ScoreBoard poolMatchId={poolMatchId} />
		</DefaultLayout>
	);
}
