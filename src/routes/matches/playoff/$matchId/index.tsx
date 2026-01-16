import { createFileRoute, notFound } from "@tanstack/react-router";
import { DefaultLayout } from "@/layouts/default";
import { playerNames } from "@/utils/profiles";
import { isNotNull } from "@/utils/types";
import { ScoreBoard } from "@/components/matches/score-board";
import { getMatchQueryOptions } from "@/functions/matches/get-match";

export const Route = createFileRoute("/matches/playoff/$matchId/")({
	loader: async ({ params: { matchId }, context: { queryClient } }) => {
		const match = await queryClient.ensureQueryData(
			getMatchQueryOptions({ playoffMatchId: Number.parseInt(matchId, 10) }),
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

function RouteComponent() {
	const { matchId: matchIdStr } = Route.useParams();

	const playoffMatchId = Number.parseInt(matchIdStr, 10);

	return (
		<DefaultLayout>
			<ScoreBoard playoffMatchId={playoffMatchId} />
		</DefaultLayout>
	);
}
