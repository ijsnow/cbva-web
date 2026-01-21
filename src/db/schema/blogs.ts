import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";
import { richText } from "./shared";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const blogs = pgTable("blogs", {
	id: serial(),
	tag: text().notNull(),
	imageSource: text(),
	link: text().notNull(),
	title: text().notNull(),
	summary: richText().notNull(),
	order: integer(),
});

export const selectBlogSchema = createSelectSchema(blogs);
export const createBlogSchema = createInsertSchema(blogs).omit({
	id: true,
});
export const updateBlogSchema = createUpdateSchema(blogs).pick({
	link: true,
	title: true,
	summary: true,
	order: true,
});

export type Blog = z.infer<typeof selectBlogSchema>;
export type CreateBlog = z.infer<typeof createBlogSchema>;
export type UpdateBlog = z.infer<typeof updateBlogSchema>;
