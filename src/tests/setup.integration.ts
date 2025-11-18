import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { vi } from "vitest";
import { relationships, tables, users, venues } from "@/db/schema";
import { seedDivisions, seedLevels } from "@/db/seed/divisions";

// const SIXTY_SECONDS = 60 * 1000;

const container: PostgreSqlContainer = new PostgreSqlContainer(
	"postgres:17-alpine",
);

let startedContainer: StartedPostgreSqlContainer;

// beforeAll(async () => {
// 	// called once before all tests run
// 	startedContainer = await container.start();

// 	const { db } = await MOCK_DB();

// 	// called to retrieve the database connection uri
// 	// e.g. mysql://USER:PASSWORD@HOST:PORT/DATABASE
// 	console.log(startedContainer.getConnectionUri());

// 	// clean up function, called once after all tests run
// 	return async () => {
// 		await startedContainer.stop();
// 	};
// }, SIXTY_SECONDS);

async function MOCK_DB() {
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

	await db.insert(users).values([
		{
			id: "adminid",
			name: "Admin User",
			email: "admin@email.com",
			phone: "+12222222222",
			role: "admin",
		},
		{
			id: "userid",
			name: "User User",
			email: "user@email.com",
			phone: "+13333333333",
		},
		{
			id: "tdid",
			name: "Director User",
			email: "director@email.com",
			phone: "+14444444444",
			role: "td",
		},
	]);

	await seedLevels(db);
	await seedDivisions(db);

	const id = await db
		.insert(venues)
		.values({
			slug: "tv",
			name: "test venue",
			city: "test city",
			description: {},
			directions: {},
			mapUrl: "",
			status: "active",
			externalRef: "4482b162-676a-4880-b7fc-20dd931a11ce",
		})
		.returning({
			id: venues.id,
		});

	return {
		db,
	};
}

vi.mock("@/db/connection", MOCK_DB);
