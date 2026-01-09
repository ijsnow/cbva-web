import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import { range } from "lodash-es"
import postgres from "postgres"
import { relationships, tables } from "@/db/schema"
import { seedDivisions, seedLevels } from "@/db/seed/divisions"
import { createVenues } from "./utils/venues"

const container: PostgreSqlContainer = new PostgreSqlContainer(
  "postgres:17-alpine"
)

let startedContainer: StartedPostgreSqlContainer

export async function getMockDb() {
  if (!startedContainer) {
    // called once before all tests run
    startedContainer = await container.start()
  }

  const client = postgres(startedContainer.getConnectionUri())

  const db = drizzle({
    client,
    casing: "snake_case",
    schema: { ...tables, ...relationships },
  })

  await migrate(db, {
    migrationsFolder: "src/db/out",
  })

  await seedLevels(db)
  await seedDivisions(db)

  await createVenues(db, [
    {
      slug: "dv",
      name: "default venue",
      city: "default city",
      status: "active",
    },
  ])

  for (const i of range(10)) {
    await createVenues(db, [
      {
        slug: `v${i}`,
        name: `list venue ${i}`,
        city: `city ${i}`,
        status: "active",
      },
    ])
  }

  return {
    db,
    url: startedContainer.getConnectionUri(),
  }
}

export async function deleteMockDb() {
  await startedContainer.stop()
}

export async function startMockDb() {
  const { url } = await getMockDb()

  // Log to stdout so playwright can capture the url and set it as an env var.
  console.log(`DATABASE_URL=${url}`)
}
