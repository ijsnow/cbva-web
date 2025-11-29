import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { Header } from "react-aria-components";
import { useViewer } from "@/auth/shared";
import { Link } from "@/components/base/link";
import { card, title } from "@/components/base/primitives";
import { ProfileList } from "@/components/profiles/list";
import { viewerProfileQueryOptions } from "@/data/profiles";
import { useNotLoggedInRedirect } from "@/hooks/auth";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/account/")({
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(viewerProfileQueryOptions());
	},
	component: RouteComponent,
});

function RouteComponent() {
	const viewer = useViewer();

	useNotLoggedInRedirect("/log-in");

	const { data: profiles } = useSuspenseQuery(viewerProfileQueryOptions());

	return (
		<DefaultLayout
			classNames={{
				content: "py-12 w-full max-w-lg mx-auto flex flex-col space-y-12",
			}}
		>
			<Link to="/log-out" preload={false}>
				Log Out
			</Link>

			<Suspense>
				<pre className="p-6 rounded-lg border border-gray-900 bg-white">
					{JSON.stringify(viewer, null, 2)}
				</pre>
			</Suspense>

			<Suspense>
				<div className="flex flex-col space-y-6">
					<h2 className={title({ size: "sm" })}>Your profiles</h2>

					{profiles && <ProfileList className={card()} profiles={profiles} />}
				</div>
			</Suspense>
		</DefaultLayout>
	);
}
