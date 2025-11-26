import { createFileRoute } from "@tanstack/react-router";
import { useViewer } from "@/auth/shared";
import { Link } from "@/components/base/link";
import { useNotLoggedInRedirect } from "@/hooks/auth";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/account/")({
	component: RouteComponent,
});

function RouteComponent() {
	const viewer = useViewer();

	useNotLoggedInRedirect("/log-in");

	return (
		<DefaultLayout
			classNames={{
				content: "py-12 w-full max-w-lg mx-auto flex flex-col space-y-6",
			}}
		>
			<Link to="/log-out" preload={false}>
				Log Out
			</Link>

			<pre className="p-6 rounded-lg border border-gray-900 bg-white">
				{JSON.stringify(viewer, null, 2)}
			</pre>
		</DefaultLayout>
	);
}
