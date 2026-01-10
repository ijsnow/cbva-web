import { relations } from "drizzle-orm/_relations";
import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";
import { teamPlayers } from "./team-players";
import { tournamentDivisionTeams } from "./tournament-division-teams";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const teams = pgTable("teams", {
	id: serial().primaryKey(),
	name: text(),
});

export const selectTeamSchema = createSelectSchema(teams);
export const createTeamSchema = createInsertSchema(teams).omit({
	id: true,
});
export const updateTeamSchema = createUpdateSchema(teams);

export type Team = z.infer<typeof selectTeamSchema>;
export type CreateTeam = z.infer<typeof createTeamSchema>;
export type UpdateTeam = z.infer<typeof updateTeamSchema>;

export const teamRelations = relations(teams, ({ many }) => ({
	tournamentDivisionTeams: many(tournamentDivisionTeams),
	players: many(teamPlayers),
}));
