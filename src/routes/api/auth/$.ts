import { createFileRoute } from "@tanstack/react-router";

import { auth } from "@/auth";

const serve = ({ request }: { request: Request }) => {
	console.log("here", request.destination);

	return auth.handler(request);
};

export const Route = createFileRoute("/api/auth/$")({
	server: {
		handlers: {
			GET: serve,
			POST: serve,
			PUT: serve,
			DELETE: serve,
			PATCH: serve,
			OPTIONS: serve,
			HEAD: serve,
		},
	},
});
