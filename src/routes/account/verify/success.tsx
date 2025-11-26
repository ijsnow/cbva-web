import { createFileRoute } from "@tanstack/react-router";
import { useLoggedInRedirect, useNotLoggedInRedirect } from "@/hooks/auth";

export const Route = createFileRoute("/account/verify/success")({
	component: RouteComponent,
});

function RouteComponent() {
	useNotLoggedInRedirect("/log-in");

	// TODO: if both phone and email verified, redirect to /account/setup,
	// otherwise redirect to /account/verify
	useLoggedInRedirect("/account/setup");

	return <div />;
}
