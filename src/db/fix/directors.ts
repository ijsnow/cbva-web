import { eq } from "drizzle-orm"
import createClient from "gel"
import { db } from "../connection"
import { directors, venues } from "../schema"

async function main() {
  console.log("connecting...")

  const gelClient = createClient({
    instanceName: "drizzle",
  })

  console.log("connected")

  const beaches = await gelClient.query<{
    id: string
    director: {
      id: string
    }
  }>(`
    select Beach {
      id,
      director: {
        *
      }
    }
  `)

  if (beaches.length === 0) {
    console.log("all good")

    return
  }

  console.log(`found ${beaches.length}`)

  const venuesToFix = await db.query.venues.findMany()

  for (const venue of venuesToFix) {
    const beach = beaches.find(({ id }) => id === venue.externalRef)

    if (!beach) {
      throw new Error(`could not find beach: ${JSON.stringify(venue, null, 2)}`)
    }

    const director = await db.query.users.findFirst({
      where: (t, { eq }) => eq(t.id, beach.director.id),
    })

    if (!director) {
      throw new Error(
        `director not found: ${JSON.stringify(director, null, 2)}`
      )
    }

    console.log("update", venue.id)

    await db
      .update(venues)
      .set({ directorId: director.id })
      .where(eq(venues.id, venue.id))

    console.log("updated", venue.id)
  }

  process.exit(0)
}

await main()
