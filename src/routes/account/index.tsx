import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useViewer } from "@/auth/shared";
import { profileOverviewQueryOptions } from "@/data/profiles";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/account/")({
	component: RouteComponent,
});

function RouteComponent() {
	const viewer = useViewer();

	return (
		<DefaultLayout
			classNames={{
				content: "py-12 w-full max-w-lg mx-auto",
			}}
		>
			<pre className="p-6 rounded-lg border border-gray-900 bg-white">
				{JSON.stringify(viewer, null, 2)}
			</pre>
		</DefaultLayout>
	);
}
