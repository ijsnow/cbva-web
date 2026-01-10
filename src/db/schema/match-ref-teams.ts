import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm/_relations";
import {
	check,
	index,
	integer,
	pgTable,
	serial,
	boolean,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import z from "zod";
import { playoffMatches } from "./playoff-matches";
import { poolMatches } from "./pool-matches";
import { tournamentDivisionTeams } from "./tournament-division-teams";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const matchRefTeams = pgTable(
	"match_ref_teams",
	{
		id: serial().primaryKey(),
		poolMatchId: integer().references(() => poolMatches.id, {
			onDelete: "cascade",
		}),
		playoffMatchId: integer().references(() => playoffMatches.id, {
			onDelete: "cascade",
		}),
		teamId: integer()
			.notNull()
			.references(() => tournamentDivisionTeams.id, {
				onDelete: "cascade",
			}),
		abandoned: boolean(),
	},
	(table) => [
		check(
			"match_ref_teams_type_exclusive",
			sql`(${table.poolMatchId} IS NOT NULL AND ${table.playoffMatchId} IS NULL) OR (${table.poolMatchId} IS NULL AND ${table.playoffMatchId} IS NOT NULL)`,
		),
		index("match_ref_teams_pool_match_idx").on(table.poolMatchId),
		index("match_ref_teams_playoff_match_idx").on(table.playoffMatchId),
	],
);

export const selectMatchRefTeamSchema = createSelectSchema(matchRefTeams);
export const createMatchRefTeamSchema = createInsertSchema(matchRefTeams).omit({
	id: true,
});
export const updateMatchRefTeamSchema = createUpdateSchema(matchRefTeams);

export type MatchRefTeam = z.infer<typeof selectMatchRefTeamSchema>;
export type CreateMatchRefTeam = z.infer<typeof createMatchRefTeamSchema>;
export type UpdateMatchRefTeam = z.infer<typeof updateMatchRefTeamSchema>;

export const matchRefTeamsRelations = relations(matchRefTeams, ({ one }) => ({
	poolMatch: one(poolMatches, {
		fields: [matchRefTeams.poolMatchId],
		references: [poolMatches.id],
	}),
	playoffMatch: one(playoffMatches, {
		fields: [matchRefTeams.playoffMatchId],
		references: [playoffMatches.id],
	}),
	team: one(tournamentDivisionTeams, {
		fields: [matchRefTeams.teamId],
		references: [tournamentDivisionTeams.id],
	}),
}));
