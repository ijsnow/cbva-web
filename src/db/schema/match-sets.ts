import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm/_relations";
import {
	check,
	index,
	integer,
	pgTable,
	serial,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { playoffMatches } from "./playoff-matches";
import { poolMatches } from "./pool-matches";
import { setStatusEnum } from "./shared";
import { tournamentDivisionTeams } from "./tournament-division-teams";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const matchSets = pgTable(
	"match_sets",
	{
		id: serial().primaryKey(),
		poolMatchId: integer().references(() => poolMatches.id, {
			onDelete: "cascade",
		}),
		playoffMatchId: integer().references(() => playoffMatches.id, {
			onDelete: "cascade",
		}),
		setNumber: integer().notNull(),
		teamAScore: integer().notNull().default(0),
		teamBScore: integer().notNull().default(0),
		winScore: integer().notNull().default(21),
		winnerId: integer().references(() => tournamentDivisionTeams.id, {
			onDelete: "cascade",
		}),
		status: setStatusEnum().notNull().default("not_started"),
		startedAt: timestamp(),
		endedAt: timestamp(),
		externalRef: uuid().unique(),
	},
	(table) => [
		check(
			"match_type_exclusive",
			sql`(${table.poolMatchId} IS NOT NULL AND ${table.playoffMatchId} IS NULL) OR (${table.poolMatchId} IS NULL AND ${table.playoffMatchId} IS NOT NULL)`,
		),
		check("set_number_positive", sql`${table.setNumber} > 0`),
		index("match_sets_pool_match_idx").on(table.poolMatchId),
		index("match_sets_playoff_match_idx").on(table.playoffMatchId),
	],
);

export const selectMatchSetSchema = createSelectSchema(matchSets);
export const createMatchSetSchema = createInsertSchema(matchSets).omit({
	id: true,
});
export const updateMatchSetSchema = createUpdateSchema(matchSets);

export type MatchSet = z.infer<typeof selectMatchSetSchema>;
export type CreateMatchSet = z.infer<typeof createMatchSetSchema>;
export type UpdateMatchSet = z.infer<typeof updateMatchSetSchema>;

export const matchSetsRelations = relations(matchSets, ({ one }) => ({
	poolMatch: one(poolMatches, {
		fields: [matchSets.poolMatchId],
		references: [poolMatches.id],
	}),
	playoffMatch: one(playoffMatches, {
		fields: [matchSets.playoffMatchId],
		references: [playoffMatches.id],
	}),
}));
