import { GenericContainer } from "testcontainers";

export async function startApp(databaseUrl: string) {
	process.env.DATABASE_URL = databaseUrl;

	console.log(databaseUrl);

	// Start application container
	const appContainer = await new GenericContainer("node:18")
		.withCopyFilesToContainer([
			{ source: "./package.json", target: "/app/" },
			{ source: "./src", target: "/app/src/" },
			{ source: "./public", target: "/app/public/" },
		])
		.withWorkingDir("/app")
		.withExposedPorts(5174)
		.withCommand(["sh", "-c", "pnpm install && pnpm dev"])
		.withEnvironment({
			DATABASE_URL: databaseUrl,
			PORT: "5174",
		})
		.withLogConsumer((stream) => {
			stream.on("data", (line) => console.log(line));
			stream.on("err", (line) => console.error(line));
			stream.on("end", () => console.log("Stream closed"));
		})
		.start();
}
