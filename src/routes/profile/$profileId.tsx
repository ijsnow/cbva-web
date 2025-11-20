import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { title } from "@/components/base/primitives";
import { ImpersonateButton } from "@/components/impersonator/impersonate-button";
import { ProfileName } from "@/components/profiles/name";
import { ProfilePhoto } from "@/components/profiles/photo";
import { profileOverviewQueryOptions } from "@/data/profiles";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/profile/$profileId")({
	loader: async ({ params: { profileId }, context: { queryClient } }) => {
		const result = await queryClient.ensureQueryData(
			profileOverviewQueryOptions(Number.parseInt(profileId, 10)),
		);

		return result;
	},
	head: () => ({
		// TODO: persons name
		meta: [{ title: "Player Profile" }],
	}),
	component: RouteComponent,
});

function RouteComponent() {
	const { profileId } = Route.useParams();

	const { data: profile } = useSuspenseQuery({
		...profileOverviewQueryOptions(Number.parseInt(profileId, 10)),
	});

	return (
		<DefaultLayout
			classNames={{
				content: "py-12 w-full relative",
			}}
		>
			<ImpersonateButton userId={profile?.userId} />

			<Suspense fallback={<>Nope</>}>
				<div className="px-4 max-w-2xl mx-auto flex flex-row space-x-4">
					<ProfilePhoto {...profile} className="w-28 h-28" />

					<div className="py-2">
						<h1 className={title({ size: "sm" })}>
							<ProfileName {...profile} link={false} />
						</h1>
					</div>
				</div>

				<pre>{JSON.stringify(profile, null, 2)}</pre>
			</Suspense>
		</DefaultLayout>
	);
}
