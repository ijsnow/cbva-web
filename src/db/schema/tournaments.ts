import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	integer,
	pgTable,
	serial,
	text,
	time,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";
import { tournamentDirectors } from "./tournament-directors";
import { tournamentDivisions } from "./tournament-divisions";
import { venues } from "./venues";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const tournaments = pgTable("tournaments", {
	id: serial().primaryKey(),
	name: text(),
	date: date().notNull(),
	startTime: time().notNull(),
	visible: boolean().notNull().default(false),
	venueId: integer()
		.notNull()
		.references(() => venues.id),
	externalRef: text(),
});

export const selectTournamentSchema = createSelectSchema(tournaments);
export const createTournamentSchema = createInsertSchema(tournaments).omit({
	id: true,
});
export const updateTournamentSchema = createUpdateSchema(tournaments);

export type Tournament = z.infer<typeof selectTournamentSchema>;
export type CreateTournament = z.infer<typeof createTournamentSchema>;
export type UpdateTournament = z.infer<typeof updateTournamentSchema>;

export const tournamentRelations = relations(tournaments, ({ one, many }) => ({
	venue: one(venues, {
		fields: [tournaments.venueId],
		references: [venues.id],
	}),
	tournamentDivisions: many(tournamentDivisions),
	directors: many(tournamentDirectors),
}));
