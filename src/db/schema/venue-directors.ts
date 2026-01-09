import { relations } from "drizzle-orm"
import { integer, pgTable, serial, unique } from "drizzle-orm/pg-core"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"
import { directors } from "./directors"
import { venues } from "./venues"

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({ zodInstance: z })

export const venueDirectors = pgTable(
  "venue_directors",
  {
    id: serial().primaryKey(),
    venueId: integer()
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    directorId: integer()
      .notNull()
      .references(() => directors.id),
    order: integer().notNull().default(0),
  },
  (table) => [
    unique("venue_directors_unique").on(table.venueId, table.directorId),
  ]
)

export const selectVenueDirectorSchema = createSelectSchema(venueDirectors)
export const createVenueDirectorSchema = createInsertSchema(
  venueDirectors
).omit({
  id: true,
})
export const updateVenueDirectorSchema = createUpdateSchema(venueDirectors)

export type VenueDirector = z.infer<typeof selectVenueDirectorSchema>
export type CreateVenueDirector = z.infer<typeof createVenueDirectorSchema>
export type UpdateVenueDirector = z.infer<typeof updateVenueDirectorSchema>

export const venueDirectorRelations = relations(venueDirectors, ({ one }) => ({
  venue: one(venues, {
    fields: [venueDirectors.venueId],
    references: [venues.id],
  }),
  director: one(directors, {
    fields: [venueDirectors.directorId],
    references: [directors.id],
  }),
}))
