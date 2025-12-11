import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import { roleHasPermission } from "@/auth/shared";
import { Link } from "@/components/base/link";
import { title } from "@/components/base/primitives";
import { TournamentFormsGroup } from "@/components/tournaments/forms";
import { tournamentQueryOptions } from "@/data/tournaments";
import { DefaultLayout } from "@/layouts/default";
import { isDefined } from "@/utils/types";

export const Route = createFileRoute("/tournaments/$tournamentId/edit")({
	loader: async ({
		params: { tournamentId },
		context: { viewer, queryClient },
	}) => {
		const canCreate =
			viewer &&
			roleHasPermission(viewer.role, {
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
				<div className="mx-auto text-center">
					<h1 className={title({ class: "mx-auto mb-2" })}>Edit Tournament</h1>

					{(tournament?.tournamentDivisions.length ?? 0) > 0 && (
						<Link
							className="mx-auto text-center"
							to="/tournaments/$tournamentId"
							params={{ tournamentId: tournamentId }}
							isDisabled={!tournament?.tournamentDivisions.length}
						>
							View tournament page
						</Link>
					)}
				</div>

				<TournamentFormsGroup tournament={tournament} />
			</Suspense>
		</DefaultLayout>
	);
}
