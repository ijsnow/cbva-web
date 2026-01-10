import { db } from "../connection"
import { venueDirectors } from "../schema"

async function main() {
  const results = await db._query.venues.findMany({
    columns: {
      id: true,
      name: true,
      city: true,
    },
    with: {
      // directors: true,
      tournaments: {
        columns: {
          id: true,
          venueId: true,
          date: true,
        },
        with: {
          venue: {
            columns: {
              id: true,
              name: true,
              city: true,
            },
          },
          directors: true,
        },
        where: (t, { lt }) => lt(t.date, "2025-12-01"),
        orderBy: (t, { desc }) => desc(t.date),
        limit: 1,
      },
    },
  })

  const values = results
    .filter(({ tournaments }) => tournaments.length > 0)
    .flatMap(({ id: venueId, tournaments: [{ directors }] }) =>
      directors.map(({ directorId, order }) => ({
        venueId,
        directorId,
        order,
      }))
    )

  await db.insert(venueDirectors).values(values).onConflictDoNothing()

  process.exit(0)
}

await main()
