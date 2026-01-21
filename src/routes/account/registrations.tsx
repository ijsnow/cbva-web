import { UnderConstruction } from "@/components/under-construction";
import { DefaultLayout } from "@/layouts/default";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/account/registrations")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<DefaultLayout>
			<UnderConstruction />
		</DefaultLayout>
	);
}
