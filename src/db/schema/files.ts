import { customType, pgTable, serial } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const bytea = customType<{ data: Buffer }>({
	dataType() {
		return "bytea";
	},
	toDriver(value: Buffer) {
		return value;
	},
	fromDriver(value: unknown) {
		return value as Buffer;
	},
});

export const files = pgTable("files", {
	id: serial().primaryKey(),
	bytes: bytea().notNull(),
});

export const selectFileSchema = createSelectSchema(files);
export const createFileSchema = createInsertSchema(files).omit({
	id: true,
});
export const updateFileSchema = createUpdateSchema(files);

export type File = z.infer<typeof selectFileSchema>;
export type CreateFile = z.infer<typeof createFileSchema>;
export type UpdateFile = z.infer<typeof updateFileSchema>;
