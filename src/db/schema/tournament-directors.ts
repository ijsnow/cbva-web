import { relations } from "drizzle-orm/_relations";
import { integer, pgTable, serial, unique } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";
import { directors } from "./directors";
import { tournaments } from "./tournaments";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const tournamentDirectors = pgTable(
	"tournament_directors",
	{
		id: serial().primaryKey(),
		tournamentId: integer()
			.notNull()
			.references(() => tournaments.id, { onDelete: "cascade" }),
		directorId: integer()
			.notNull()
			.references(() => directors.id),
		order: integer().notNull().default(0),
	},
	(table) => [
		unique("tournament_directors_unique").on(
			table.tournamentId,
			table.directorId,
		),
	],
);

export const selectTournamentDirectorSchema =
	createSelectSchema(tournamentDirectors);
export const createTournamentDirectorSchema = createInsertSchema(
	tournamentDirectors,
).omit({
	id: true,
});
export const updateTournamentDirectorSchema =
	createUpdateSchema(tournamentDirectors);

export type TournamentDirector = z.infer<typeof selectTournamentDirectorSchema>;
export type CreateTournamentDirector = z.infer<
	typeof createTournamentDirectorSchema
>;
export type UpdateTournamentDirector = z.infer<
	typeof updateTournamentDirectorSchema
>;

export const tournamentDirectorRelations = relations(
	tournamentDirectors,
	({ one }) => ({
		tournament: one(tournaments, {
			fields: [tournamentDirectors.tournamentId],
			references: [tournaments.id],
		}),
		director: one(directors, {
			fields: [tournamentDirectors.directorId],
			references: [directors.id],
		}),
	}),
);
