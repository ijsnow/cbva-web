import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { relationships, tables } from "@/db/schema";
import { seedDivisions, seedLevels } from "@/db/seed/divisions";
import { createVenues } from "./utils/venues";

// const SIXTY_SECONDS = 60 * 1000;

const container: PostgreSqlContainer = new PostgreSqlContainer(
	"postgres:17-alpine",
);

let startedContainer: StartedPostgreSqlContainer;

export async function getMockDb() {
	if (!startedContainer) {
		// called once before all tests run
		startedContainer = await container.start();
	}

	const client = postgres(startedContainer.getConnectionUri());

	const db = drizzle({
		client,
		casing: "snake_case",
		schema: { ...tables, ...relationships },
	});

	await migrate(db, {
		migrationsFolder: "src/db/out",
	});

	await seedLevels(db);
	await seedDivisions(db);

	await createVenues(db, [
		{
			slug: "dv",
			name: "default venue",
			city: "default city",
			status: "active",
		},
	]);

	return {
		db,
		url: startedContainer.getConnectionUri(),
	};
}

export async function deleteMockDb() {
	await startedContainer.stop();
}
