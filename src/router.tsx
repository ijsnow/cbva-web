import { createRouter as createTanstackRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";

import { routeTree } from "./routeTree.gen";

import "./styles.css";

import { QueryClient } from "@tanstack/query-core";
// import { initSentry } from "./services/sentry";

export function getRouter() {
	const queryClient = new QueryClient();

	const router = createTanstackRouter({
		scrollRestoration: true,
		scrollToTopSelectors: ["#scroll-ref"],
		routeTree,
		context: { queryClient: queryClient },
		defaultPreload: "intent",
		// Wrap: (props: { children: React.ReactNode }) => {
		// 	return <Provider>{props.children}</Provider>;
		// },
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient,
	});

	// if (!router.isServer) {
	// 	initSentry();
	// }

	return router;
}
