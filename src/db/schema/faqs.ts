import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";
import { richText } from "./shared";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const faqs = pgTable("faqs", {
	id: serial(),
	question: text().notNull(),
	answer: richText().notNull(),
	order: integer(),
});

export const selectFaqSchema = createSelectSchema(faqs);
export const createFaqSchema = createInsertSchema(faqs).omit({
	id: true,
	order: true,
});
export const updateFaqSchema = createUpdateSchema(faqs).pick({
	question: true,
	answer: true,
	order: true,
});

export type Faq = z.infer<typeof selectFaqSchema>;
export type CreateFaq = z.infer<typeof createFaqSchema>;
export type UpdateFaq = z.infer<typeof updateFaqSchema>;
