import { relations } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	serial,
	text,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";
import { users } from "./auth";
import { richText, venueStatusEnum } from "./shared";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const venues = pgTable(
	"venues",
	{
		id: serial().primaryKey(),
		slug: text().notNull().unique(),
		name: text().notNull(),
		city: text().notNull(),
		description: richText().notNull(),
		directions: richText().notNull(),
		mapUrl: text().notNull(),
		status: venueStatusEnum().notNull(),
		imageSource: text(),
		// TODO: add check for confirming user has director role
		directorId: text().references(() => users.id),
		externalRef: uuid().unique(),
	},
	(table) => [
		unique("name_city_unique").on(table.name, table.city),
		index("external_ref_idx").on(table.externalRef),
	],
);

export const selectVenueSchema = createSelectSchema(venues);
export const createVenueSchema = createInsertSchema(venues).omit({
	id: true,
});
export const updateVenueSchema = createUpdateSchema(venues).pick({
	description: true,
	directions: true,
});

export type Venue = z.infer<typeof selectVenueSchema>;
export type CreateVenue = z.infer<typeof createVenueSchema>;
export type UpdateVenue = z.infer<typeof updateVenueSchema>;

export const venueRelations = relations(venues, ({ one }) => ({
	director: one(users, {
		fields: [venues.directorId],
		references: [users.id],
	}),
}));
