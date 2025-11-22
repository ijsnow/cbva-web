import { relations } from "drizzle-orm";
import {
	boolean,
	doublePrecision,
	integer,
	pgTable,
	serial,
	text,
	uuid,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { poolTeams } from "./pool-teams";
import { teamStatusEnum } from "./shared";
import { teams } from "./teams";
import { tournamentDivisions } from "./tournament-divisions";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const tournamentDivisionTeams = pgTable("tournament_division_teams", {
	id: serial().primaryKey(),
	tournamentDivisionId: integer()
		.notNull()
		.references(() => tournamentDivisions.id),
	teamId: integer()
		.notNull()
		.references(() => teams.id),
	seed: integer(),
	finish: integer(),
	playoffsSeed: integer(),
	wildcard: boolean(),
	pointsEarned: doublePrecision(),
	ratingEarned: text(),
	status: teamStatusEnum().notNull().default("registered"),
	externalRef: uuid().unique(),
});

export const selectTournamentDivisionTeamSchema = createSelectSchema(
	tournamentDivisionTeams,
);
export const createTournamentDivisionTeamSchema = createInsertSchema(
	tournamentDivisionTeams,
).omit({
	id: true,
});
export const updateTournamentDivisionTeamSchema = createUpdateSchema(
	tournamentDivisionTeams,
);

export type TournamentDivisionTeam = z.infer<
	typeof selectTournamentDivisionTeamSchema
>;
export type CreateTournamentDivisionTeam = z.infer<
	typeof createTournamentDivisionTeamSchema
>;
export type UpdateTournamentDivisionTeam = z.infer<
	typeof updateTournamentDivisionTeamSchema
>;

export const tournamentDivisionTeamsRelations = relations(
	tournamentDivisionTeams,
	({ one }) => ({
		team: one(teams, {
			fields: [tournamentDivisionTeams.teamId],
			references: [teams.id],
		}),
		tournamentDivision: one(tournamentDivisions, {
			fields: [tournamentDivisionTeams.tournamentDivisionId],
			references: [tournamentDivisions.id],
		}),
		poolTeam: one(poolTeams, {
			fields: [tournamentDivisionTeams.id],
			references: [poolTeams.teamId],
		}),
	}),
);
