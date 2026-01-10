import { relations } from "drizzle-orm/_relations";
import {
	boolean,
	doublePrecision,
	integer,
	pgTable,
	serial,
	uuid,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";
import { levels } from "./levels";
import { poolTeams } from "./pool-teams";
import { teamStatusEnum, timestamps } from "./shared";
import { teams } from "./teams";
import { tournamentDivisions } from "./tournament-divisions";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const tournamentDivisionTeams = pgTable("tournament_division_teams", {
	id: serial().primaryKey(),
	tournamentDivisionId: integer()
		.notNull()
		.references(() => tournamentDivisions.id, { onDelete: "cascade" }),
	teamId: integer()
		.notNull()
		.references(() => teams.id),
	seed: integer(),
	finish: integer(),
	playoffsSeed: integer(),
	wildcard: boolean(),
	pointsEarned: doublePrecision(),
	levelEarnedId: integer().references(() => levels.id),
	status: teamStatusEnum().notNull().default("registered"),
	externalRef: uuid().unique(),
	order: integer(),
	...timestamps,
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
		levelEarned: one(levels, {
			fields: [tournamentDivisionTeams.levelEarnedId],
			references: [levels.id],
		}),
	}),
);
