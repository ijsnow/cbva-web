import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { vi } from "vitest";
import { relationships, tables } from "@/db/schema";
import { seedDivisions, seedLevels } from "@/db/seed/divisions";
import { createVenues } from "./utils/venues";

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

	// await db.insert(users).values([
	// 	{
	// 		id: "adminid",
	// 		name: "Admin User",
	// 		email: "admin@email.com",
	// 		phone: "+12222222222",
	// 		role: "admin",
	// 	},
	// 	{
	// 		id: "userid",
	// 		name: "User User",
	// 		email: "user@email.com",
	// 		phone: "+13333333333",
	// 	},
	// 	{
	// 		id: "tdid1",
	// 		name: "Director User 1",
	// 		email: "director1@email.com",
	// 		phone: "+14444444444",
	// 		role: "td",
	// 	},
	// 	{
	// 		id: "tdid2",
	// 		name: "Director User 2",
	// 		email: "director2@email.com",
	// 		phone: "+15555555555",
	// 		role: "td",
	// 	},
	// 	{
	// 		id: "tdid3",
	// 		name: "Director User 3",
	// 		email: "director3@email.com",
	// 		phone: "+16666666666",
	// 		role: "td",
	// 	},
	// ]);

	// await db.insert(playerProfiles).values([
	// 	{
	// 		id: 1,
	// 		firstName: "User",
	// 		lastName: "User",
	// 		birthdate: "1990-01-01",
	// 		gender: "female",
	// 		userId: "userid",
	// 	},
	// 	{
	// 		id: 2,
	// 		firstName: "Director",
	// 		lastName: "User",
	// 		birthdate: "1990-01-01",
	// 		gender: "female",
	// 		userId: "tdid1",
	// 	},
	// 	{
	// 		id: 3,
	// 		firstName: "Director",
	// 		lastName: "User",
	// 		birthdate: "1990-01-01",
	// 		gender: "female",
	// 		userId: "tdid2",
	// 	},
	// 	{
	// 		id: 4,
	// 		firstName: "Director",
	// 		lastName: "User",
	// 		birthdate: "1990-01-01",
	// 		gender: "female",
	// 		userId: "tdid3",
	// 	},
	// ]);

	// await db.insert(directors).values([
	// 	{
	// 		id: 1,
	// 		profileId: 2,
	// 	},
	// 	{
	// 		id: 2,
	// 		profileId: 3,
	// 	},
	// 	{
	// 		id: 3,
	// 		profileId: 4,
	// 	},
	// ]);

	await seedLevels(db);
	await seedDivisions(db);

	await createVenues(db, [
		{
			slug: "dv",
			name: "default venue",
			city: "default city",
		},
	]);

	return {
		db,
	};
}

vi.mock("@/db/connection", MOCK_DB);
