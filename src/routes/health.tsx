import {
	mutationOptions,
	queryOptions,
	useMutation,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Suspense } from "react";
import z from "zod";
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

const pingFn = createServerFn({ method: "POST" })
	.inputValidator(z.object({ message: z.string() }))
	.handler(async ({ data: { message } }) => {
		return `pong: ${message}`;
	});

const pingOptions = () =>
	mutationOptions({
		mutationFn: (message: string) => pingFn({ data: { message } }),
	});

export const Route = createFileRoute("/health")({
	loader: async ({ context: { queryClient } }) => {
		await queryClient.ensureQueryData(checkHealthOptions());
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { data } = useSuspenseQuery(checkHealthOptions());

	const { mutate: ping, data: pingData } = useMutation(pingOptions());

	// const [pingApiData, setPingApiData] = useState<string | undefined>(undefined);

	const { mutate: pingApi, data: pingApiData } = useMutation(
		mutationOptions({
			mutationFn: async (message: string) => {
				console.log("calling");

				const res = await fetch("/api/ping", {
					body: JSON.stringify({ message }),
					method: "POST",
				});

				const data = (await res.json()) as { ping: string };

				// setPingApiData(data.message);

				return data.ping;
			},
			// onSuccess: (data) => {
			// 	setPingApiData(dbg(data));
			// },
		}),
	);

	return (
		<div className="flex flex-col space-y-2">
			<Suspense>{JSON.stringify(data, null, 2)}</Suspense>

			<button
				onClick={() => {
					ping("Hello");
				}}
			>
				Ping Fn
			</button>

			{pingData && <p>{pingData}</p>}

			<button
				onClick={() => {
					pingApi("Hello");
				}}
			>
				Ping API
			</button>

			{pingApiData && <p>{pingApiData}</p>}
		</div>
	);

	// return "ok";
}
