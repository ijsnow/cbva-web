import { relations } from "drizzle-orm/_relations";
import {
	boolean,
	integer,
	pgTable,
	serial,
	text,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { divisions } from "./divisions";
import { pools } from "./pools";
import { genderEnum } from "./shared";
import { tournamentDivisionRequirements } from "./tournament-division-requirements";
import { tournamentDivisionTeams } from "./tournament-division-teams";
import { tournaments } from "./tournaments";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const tournamentDivisions = pgTable(
	"tournament_divisions",
	{
		id: serial().primaryKey(),
		tournamentId: integer()
			.notNull()
			.references(() => tournaments.id, {
				onDelete: "cascade",
			}),
		divisionId: integer()
			.notNull()
			.references(() => divisions.id),
		name: text(), // e.g., "Father/Son Division", "Open Mixed"
		gender: genderEnum().notNull(),
		teamSize: integer().notNull().default(2), // Number of players per team
		capacity: integer().notNull().default(10),
		waitlistCapacity: integer().notNull().default(5),
		autopromoteWaitlist: boolean().notNull().default(true),
		displayGender: boolean(),
		displayDivision: boolean(),
		externalRef: uuid().unique(),
	},
	(table) => [
		unique("tournament_division_name_gender_unique").on(
			table.tournamentId,
			table.divisionId,
			table.name,
			table.gender,
		),
	],
);

export const selectTournamentDivisionSchema =
	createSelectSchema(tournamentDivisions);
export const createTournamentDivisionSchema = createInsertSchema(
	tournamentDivisions,
).omit({
	id: true,
});
export const updateTournamentDivisionSchema =
	createUpdateSchema(tournamentDivisions);

export type TournamentDivision = z.infer<typeof selectTournamentDivisionSchema>;
export type CreateTournamentDivision = z.infer<
	typeof createTournamentDivisionSchema
>;
export type UpdateTournamentDivision = z.infer<
	typeof updateTournamentDivisionSchema
>;

export const tournamentDivisionRelations = relations(
	tournamentDivisions,
	({ one, many }) => ({
		tournament: one(tournaments, {
			fields: [tournamentDivisions.tournamentId],
			references: [tournaments.id],
		}),
		division: one(divisions, {
			fields: [tournamentDivisions.divisionId],
			references: [divisions.id],
		}),
		teams: many(tournamentDivisionTeams),
		pools: many(pools),
		requirements: many(tournamentDivisionRequirements),
	}),
);
