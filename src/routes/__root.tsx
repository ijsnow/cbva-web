import type { QueryClient } from "@tanstack/query-core";
import {
	createRootRouteWithContext,
	HeadContent,
	Outlet,
	redirect,
	Scripts,
} from "@tanstack/react-router";
import type * as React from "react";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { FormDevtoolsPanel } from "@tanstack/react-form-devtools";

import {
	getViewerFn,
	viewerIdQueryOptions,
	viewerQueryOptions,
} from "@/auth/shared";
import { Provider } from "@/providers";
import appCss from "../styles.css?url";

interface RouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	beforeLoad: async ({ context: { queryClient }, location }) => {
		const viewer = await getViewerFn();

		if (viewer) {
			queryClient.setQueryData(viewerQueryOptions().queryKey, viewer);
			queryClient.setQueryData(viewerIdQueryOptions().queryKey, viewer.id);
		}

		if (
			!["/account/change-password", "/log-out"].includes(location.pathname) &&
			viewer?.needsPasswordChange
		) {
			throw redirect({
				to: "/account/change-password",
			});
		}

		return {
			viewer,
		};
	},
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "CBVA",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
		],
	}),
	shellComponent: RootDocument,
	component: () => (
		<>
			<Outlet />
			<TanStackDevtools
				plugins={[
					{
						name: "Query",
						render: <ReactQueryDevtoolsPanel />,
						defaultOpen: false,
					},
					{
						name: "Router",
						render: <TanStackRouterDevtoolsPanel />,
						defaultOpen: false,
					},
					// {
					// 	name: "Form",
					// 	render: <FormDevtoolsPanel />,
					// 	defaultOpen: false,
					// },
				]}
			/>
		</>
	),
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const { queryClient } = Route.useRouteContext();

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<Provider queryClient={queryClient}>{children}</Provider>
				<Scripts />
			</body>
		</html>
	);
}
