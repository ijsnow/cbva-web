import { createFileRoute } from "@tanstack/react-router";
import { useLoggedInRedirect, useNotLoggedInRedirect } from "@/hooks/auth";

export const Route = createFileRoute("/account/verify/success")({
	component: RouteComponent,
});

function RouteComponent() {
	useNotLoggedInRedirect("/log-in");
	useLoggedInRedirect("/account/setup");

	return <div />;
}
