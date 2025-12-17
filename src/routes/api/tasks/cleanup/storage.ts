import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/tasks/cleanup/storage")({
	server: {
		handlers: {
			POST: async ({ request }: { request: Request }) => {
				// TODO:
				// - read all objects in each bucket
				// - check each location a file is stored to see if it is referenced
				// - if not, delete the objects

				return new Response(JSON.stringify({ success: true }), {
					headers: {
						"Content-Type": "application/json",
					},
				});
			},
		},
	},
});
