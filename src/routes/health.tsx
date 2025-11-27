import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { db } from "@/db/connection";

const checkHealthFn = createServerFn().handler(async () => {
	try {
		const [res] = await db.execute("select 1 as one");

		return res.one === 1 ? "ok" : "what";
	} catch (error) {
		return {
			message: `failed to connect to db: ${error}`,
			dbUrl: process.env.DATABASE_URL,
		};
	}
});

const checkHealthOptions = () =>
	queryOptions({
		queryKey: ["health"],
		queryFn: () => checkHealthFn(),
	});

export const Route = createFileRoute("/health")({
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(checkHealthOptions());
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { data } = useQuery(checkHealthOptions());

	return JSON.stringify(data, null, 2);
}
