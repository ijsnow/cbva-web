import { createFileRoute } from "@tanstack/react-router";

import { DefaultLayout } from "@/layouts/default";
import { ProfileSearch } from "@/components/profiles/search";

export const Route = createFileRoute("/search")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<DefaultLayout classNames={{ content: "w-full max-w-lg mx-auto py-12" }}>
			<ProfileSearch />
		</DefaultLayout>
	);
}
