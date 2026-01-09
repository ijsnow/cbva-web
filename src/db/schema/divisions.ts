import { relations } from "drizzle-orm"
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"
import { tournamentDivisions } from "./tournament-divisions"

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({ zodInstance: z })

export const divisions = pgTable("divisions", {
  id: serial().primaryKey(),
  name: text().unique().notNull(),
  display: text(),
  order: integer().notNull(),
  maxAge: integer(),
})

export const selectDivisionSchema = createSelectSchema(divisions)
export const createDivisionSchema = createInsertSchema(divisions).omit({
  id: true,
})
export const updateDivisionSchema = createUpdateSchema(divisions)

export type Division = z.infer<typeof selectDivisionSchema>
export type CreateDivision = z.infer<typeof createDivisionSchema>
export type UpdateDivision = z.infer<typeof updateDivisionSchema>

export const divisionRelations = relations(divisions, ({ many }) => ({
  tournamentDivisions: many(tournamentDivisions),
}))
