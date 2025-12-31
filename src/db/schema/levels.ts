import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const levels = pgTable("levels", {
	id: serial().primaryKey(),
	name: text().notNull().unique(),
	abbreviated: text(),
	order: integer().notNull(),
	// TODO: display
});

export const selectLevelSchema = createSelectSchema(levels);
export const createLevelSchema = createInsertSchema(levels).omit({
	id: true,
});
export const updateLevelSchema = createUpdateSchema(levels);

export type Level = z.infer<typeof selectLevelSchema>;
export type CreateLevel = z.infer<typeof createLevelSchema>;
export type UpdateLevel = z.infer<typeof updateLevelSchema>;
