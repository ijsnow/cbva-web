import { relations, sql } from "drizzle-orm";
import {
	type AnyPgColumn,
	check,
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";
import { matchRefTeams } from "./match-ref-teams";
import { matchSets } from "./match-sets";
import { pools } from "./pools";
import { matchStatusEnum } from "./shared";
import { tournamentDivisionTeams } from "./tournament-division-teams";
import { tournamentDivisions } from "./tournament-divisions";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const playoffMatches = pgTable(
	"playoff_matches",
	{
		id: serial().primaryKey(),
		tournamentDivisionId: integer()
			.notNull()
			.references(() => tournamentDivisions.id, { onDelete: "cascade" }),
		round: integer().notNull().default(-1),
		matchNumber: integer().notNull(),
		court: text(),
		teamAId: integer().references(() => tournamentDivisionTeams.id),
		teamBId: integer().references(() => tournamentDivisionTeams.id),
		teamAPoolId: integer().references(() => pools.id, {
			onDelete: "cascade",
		}),
		teamBPoolId: integer().references(() => pools.id, {
			onDelete: "cascade",
		}),
		teamAPreviousMatchId: integer().references(
			(): AnyPgColumn => playoffMatches.id,
		),
		teamBPreviousMatchId: integer().references(
			(): AnyPgColumn => playoffMatches.id,
		),
		scheduledTime: timestamp(),
		status: matchStatusEnum().notNull().default("scheduled"),
		winnerId: integer().references(() => tournamentDivisionTeams.id),
		nextMatchId: integer().references((): AnyPgColumn => playoffMatches.id),
		externalRef: uuid().unique(),
	},
	(table) => [
		check(
			"team_a_team_b_different_or_null",
			sql`${table.teamAId} != ${table.teamBId} OR (${table.teamAId} IS NULL AND ${table.teamBId} IS NULL)`,
		),
		index("playoff_matches_tournament_division_idx").on(
			table.tournamentDivisionId,
		),
		index("playoff_matches_team_a_idx").on(table.teamAId),
		index("playoff_matches_team_b_idx").on(table.teamBId),
	],
);

export const selectPlayoffMatchSchema = createSelectSchema(playoffMatches);
export const createPlayoffMatchSchema = createInsertSchema(playoffMatches).omit(
	{
		id: true,
	},
);
export const updatePlayoffMatchSchema = createUpdateSchema(playoffMatches);

export type PlayoffMatch = z.infer<typeof selectPlayoffMatchSchema>;
export type CreatePlayoffMatch = z.infer<typeof createPlayoffMatchSchema>;
export type UpdatePlayoffMatch = z.infer<typeof updatePlayoffMatchSchema>;

export const playoffMatchRelations = relations(
	playoffMatches,
	({ one, many }) => ({
		tournamentDivision: one(tournamentDivisions, {
			fields: [playoffMatches.tournamentDivisionId],
			references: [tournamentDivisions.id],
		}),
		sets: many(matchSets),
		teamA: one(tournamentDivisionTeams, {
			fields: [playoffMatches.teamAId],
			references: [tournamentDivisionTeams.id],
		}),
		teamB: one(tournamentDivisionTeams, {
			fields: [playoffMatches.teamBId],
			references: [tournamentDivisionTeams.id],
		}),
		refTeams: many(matchRefTeams),
		nextMatch: one(playoffMatches, {
			fields: [playoffMatches.nextMatchId],
			references: [playoffMatches.id],
		}),
	}),
);
