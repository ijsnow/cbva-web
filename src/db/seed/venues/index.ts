import * as fs from "node:fs"
import { eq } from "drizzle-orm"
import { db } from "@/db/connection"
import { venues } from "@/db/schema"
import { files } from "@/db/schema/files"
import venuesData from "./data.json"

export async function seedVenues() {
  for (const venue of venuesData) {
    if (venue.photo) {
      await seedVenuePhoto(venue.short_name, venue.photo)
    }
  }
}

async function seedVenuePhoto(slug: string, imagePath: string) {
  const buffer = await new Promise<Buffer>((resolve, reject) =>
    fs.readFile(`./src/db/seed/venues/files/${imagePath}`, (err, file) => {
      if (err) {
        reject(err)
      }

      resolve(file)
    })
  )

  const [result] = await db
    .insert(files)
    .values({
      bytes: buffer,
    })
    .returning({ id: files.id })

  await db
    .update(venues)
    .set({ imageSource: `/api/files?id=${result.id}` })
    .where(eq(venues.slug, slug))
}
