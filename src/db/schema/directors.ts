import { relations } from "drizzle-orm"
import { integer, pgTable, serial, text, uuid } from "drizzle-orm/pg-core"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"

import { playerProfiles } from "./player-profiles"

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({ zodInstance: z })

export const directors = pgTable("directors", {
  id: serial().primaryKey(),
  profileId: integer()
    .notNull()
    .unique()
    .references(() => playerProfiles.id, { onDelete: "cascade" }),
  email: text(),
  phoneNumber: text(),
  externalRef: uuid(),
})

export const selectDirectorSchema = createSelectSchema(directors)
export const createDirectorSchema = createInsertSchema(directors).omit({
  id: true,
})
export const updateDirectorSchema = createUpdateSchema(directors)

export type Director = z.infer<typeof selectDirectorSchema>
export type CreateDirector = z.infer<typeof createDirectorSchema>
export type UpdateDirector = z.infer<typeof updateDirectorSchema>

export const directorRelations = relations(directors, ({ one }) => ({
  profile: one(playerProfiles, {
    fields: [directors.profileId],
    references: [playerProfiles.id],
  }),
}))
