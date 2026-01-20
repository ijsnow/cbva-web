import { createFileRoute } from "@tanstack/react-router";

import { authClient } from "@/auth/client";
import { useNotLoggedInRedirect } from "@/hooks/auth";
import { DefaultLayout } from "@/layouts/default";

export const Route = createFileRoute("/log-out")({
	preload: false,
	beforeLoad: async () => {},
	loader: async () => {
		await authClient.signOut();
	},
	component: RouteComponent,
});

function RouteComponent() {
	useNotLoggedInRedirect("/log-in");

	return (
		<DefaultLayout classNames={{ content: "min-h-screen" }}>
			{null}
		</DefaultLayout>
	);
}
