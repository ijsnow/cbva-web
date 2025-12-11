import { parseDate, parseTime } from "@internationalized/date";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import { roleHasPermission, viewerQueryOptions } from "@/auth/shared";
import { card, title } from "@/components/base/primitives";
import { TournamentFormsGroup } from "@/components/tournaments/forms";
import { tournamentQueryOptions } from "@/data/tournaments";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/tournaments/$tournamentId/edit")({
	loader: async ({ params: { tournamentId }, context: { queryClient } }) => {
		const data = await queryClient.ensureQueryData(viewerQueryOptions());

		console.log("viewer", data);

		const canCreate =
			data &&
			roleHasPermission(data.role, {
				tournament: ["create"],
			});

		if (!canCreate) {
			throw redirect({
				to: "/not-found",
			});
		}

		if (tournamentId) {
			await queryClient.ensureQueryData(
				tournamentQueryOptions(Number.parseInt(tournamentId, 10)),
			);
		}
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { tournamentId } = Route.useParams();

	const { data: tournament } = useSuspenseQuery(
		tournamentQueryOptions(Number.parseInt(tournamentId, 10)),
	);

	return (
		<DefaultLayout
			classNames={{
				content: "py-12 flex flex-col items-center space-y-16",
			}}
		>
			<Suspense>
				<h1 className={title({ class: "mx-auto text-center" })}>
					Edit Tournament
				</h1>

				<TournamentFormsGroup tournament={tournament} />
			</Suspense>
		</DefaultLayout>
	);
}
