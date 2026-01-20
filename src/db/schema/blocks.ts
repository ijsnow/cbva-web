import { pgTable, text } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { richText } from "./shared";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const pages = pgTable("pages", {
	path: text().primaryKey(),
});

export const selectPageSchema = createSelectSchema(pages);
export const createPageSchema = createInsertSchema(pages);
export const updatePageSchema = createUpdateSchema(pages);

export type Page = z.infer<typeof selectPageSchema>;
export type CreatePage = z.infer<typeof createPageSchema>;
export type UpdatePage = z.infer<typeof updatePageSchema>;

export const blocks = pgTable("blocks", {
	key: text().primaryKey(),
	content: richText(),
	page: text()
		.notNull()
		.references(() => pages.path),
});

export const selectBlockSchema = createSelectSchema(blocks);
export const createBlockSchema = createInsertSchema(blocks);
export const updateBlockSchema = createUpdateSchema(blocks);

export type Block = z.infer<typeof selectBlockSchema>;
export type CreateBlock = z.infer<typeof createBlockSchema>;
export type UpdateBlock = z.infer<typeof updateBlockSchema>;
