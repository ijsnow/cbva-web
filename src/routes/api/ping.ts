import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/ping")({
  server: {
    handlers: {
      // GET: async ({ request }: { request: Request }) => {
      // 	const url = new URL(request.url);
      // 	const id = url.searchParams.get("id");

      // 	if (!id) {
      // 		return new Response("Missing id parameter", { status: 400 });
      // 	}

      // 	const fileId = Number.parseInt(id, 10);
      // 	if (Number.isNaN(fileId)) {
      // 		return new Response("Invalid id parameter", { status: 400 });
      // 	}

      // 	const result = await db
      // 		.select({
      // 			bytes: files.bytes,
      // 		})
      // 		.from(files)
      // 		.where(eq(files.id, fileId));

      // 	if (result.length === 0) {
      // 		return new Response("File not found", { status: 404 });
      // 	}

      // 	const file = result[0];

      // 	return new Response(file.bytes, {
      // 		headers: {
      // 			"Content-Type": "image/jpeg",
      // 			"Cache-Control": "public, max-age=31536000",
      // 		},
      // 	})
      // },
      POST: async ({ request }: { request: Request }) => {
        const data = (await request.json()) as { message: string }

        return new Response(
          JSON.stringify({
            ping: `pong: ${data.message}`,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      },
    },
  },
})
