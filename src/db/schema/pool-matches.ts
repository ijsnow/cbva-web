import { relations, sql } from "drizzle-orm";
import {
	check,
	index,
	integer,
	pgTable,
	serial,
	text,
	time,
	unique,
	uuid,
} from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { matchSets } from "./match-sets";
import { pools } from "./pools";
import { matchStatusEnum } from "./shared";
import { tournamentDivisionTeams } from "./tournament-division-teams";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const poolMatches = pgTable(
	"pool_matches",
	{
		id: serial().primaryKey(),
		poolId: integer()
			.notNull()
			.references(() => pools.id, { onDelete: "cascade" }),
		matchNumber: integer().notNull(),
		court: text(),
		teamAId: integer().references(() => tournamentDivisionTeams.id, {
			onDelete: "cascade",
		}),
		teamBId: integer().references(() => tournamentDivisionTeams.id, {
			onDelete: "cascade",
		}),
		scheduledTime: time(),
		status: matchStatusEnum().notNull().default("scheduled"),
		winnerId: integer().references(() => tournamentDivisionTeams.id),
		externalRef: uuid().unique(),
	},
	(table) => [
		check(
			"team_a_team_a_different",
			sql`(${table.teamAId} IS NULL AND ${table.teamBId} IS NULL) OR ${table.teamAId} != ${table.teamBId}`,
		),
		index("pool_matches_pool_idx").on(table.poolId),
		index("pool_matches_team_a_idx").on(table.teamAId),
		index("pool_matches_team_b_idx").on(table.teamBId),
		unique("pool_matches_pool_id_match_number").on(
			table.poolId,
			table.matchNumber,
		)
	],
);

export const selectPoolMatchSchema = createSelectSchema(poolMatches);
export const createPoolMatchSchema = createInsertSchema(poolMatches).omit({
	id: true,
});
export const updatePoolMatchSchema = createUpdateSchema(poolMatches);

export type PoolMatch = z.infer<typeof selectPoolMatchSchema>;
export type CreatePoolMatch = z.infer<typeof createPoolMatchSchema>;
export type UpdatePoolMatch = z.infer<typeof updatePoolMatchSchema>;

export const poolMatchRelations = relations(poolMatches, ({ one, many }) => ({
	pool: one(pools, {
		fields: [poolMatches.poolId],
		references: [pools.id],
	}),
	sets: many(matchSets),
	teamA: one(tournamentDivisionTeams, {
		fields: [poolMatches.teamAId],
		references: [tournamentDivisionTeams.id],
	}),
	teamB: one(tournamentDivisionTeams, {
		fields: [poolMatches.teamBId],
		references: [tournamentDivisionTeams.id],
	}),
}));
