import { type ChildProcess, spawn } from "node:child_process";
import { GenericContainer } from "testcontainers";

// let appProcess: ChildProcess;

export async function startApp(databaseUrl: string) {
	process.env.DATABASE_URL = databaseUrl;

	// appProcess = spawn("pnpm", ["vite", "dev", "--port", "5174"], {
	// 	env: {
	// 		...process.env,
	// 		DATABASE_URL: databaseUrl,
	// 	},
	// 	stdio: "inherit",
	// });

	// Start application container
	const container = await GenericContainer.fromDockerfile(
		process.cwd(),
		"Dockerfile",
	).build();

	// .withCopyFilesToContainer([{ source: ".", target: "/app/" }])
	// .withWorkingDir("/app")
	// .withExposedPorts(5174)
	// .withCommand(["sh", "-c", "pnpm install && pnpm dev --port 5174"])

	container
		.withEnvironment({
			DATABASE_URL: databaseUrl,
		})
		.withLogConsumer((stream) => {
			stream.on("data", (line) => console.log(line));
			stream.on("err", (line) => console.error(line));
			stream.on("end", () => console.log("Stream closed"));
		})
		.start();
}

export async function stopApp() {
	// if (appProcess) {
	// 	appProcess.kill();
	// }
}
