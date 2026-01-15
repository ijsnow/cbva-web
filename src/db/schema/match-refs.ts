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
import { playerProfiles } from "./player-profiles";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const matchRefs = pgTable(
	"match_refs",
	{
		id: serial().primaryKey(),
		poolMatchId: integer().references(() => poolMatches.id, {
			onDelete: "cascade",
		}),
		playoffMatchId: integer().references(() => playoffMatches.id, {
			onDelete: "cascade",
		}),
		profileId: integer()
			.notNull()
			.references(() => playerProfiles.id, {
				onDelete: "cascade",
			}),
		abandoned: boolean(),
	},
	(table) => [
		check(
			"match_ref_type_exclusive",
			sql`(${table.poolMatchId} IS NOT NULL AND ${table.playoffMatchId} IS NULL) OR (${table.poolMatchId} IS NULL AND ${table.playoffMatchId} IS NOT NULL)`,
		),
		index("match_ref_pool_match_idx").on(table.poolMatchId),
		index("match_ref_playoff_match_idx").on(table.playoffMatchId),
	],
);

export const selectMatchRefSchema = createSelectSchema(matchRefs);
export const createMatchRefSchema = createInsertSchema(matchRefs).omit({
	id: true,
});
export const updateMatchRefSchema = createUpdateSchema(matchRefs);

export type MatchRef = z.infer<typeof selectMatchRefSchema>;
export type CreateMatchRef = z.infer<typeof createMatchRefSchema>;
export type UpdateMatchRef = z.infer<typeof updateMatchRefSchema>;

export const matchRefsRelations = relations(matchRefs, ({ one }) => ({
	poolMatch: one(poolMatches, {
		fields: [matchRefs.poolMatchId],
		references: [poolMatches.id],
	}),
	playoffMatch: one(playoffMatches, {
		fields: [matchRefs.playoffMatchId],
		references: [playoffMatches.id],
	}),
	profile: one(tournamentDivisionTeams, {
		fields: [matchRefs.profileId],
		references: [tournamentDivisionTeams.id],
	}),
}));
