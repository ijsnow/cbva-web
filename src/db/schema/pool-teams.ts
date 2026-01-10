import { relations } from "drizzle-orm/_relations";
import { index, integer, pgTable, serial, unique } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";
import { pools } from "./pools";
import { tournamentDivisionTeams } from "./tournament-division-teams";

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
	createSchemaFactory({ zodInstance: z });

export const poolTeams = pgTable(
	"pool_teams",
	{
		id: serial().primaryKey(),
		poolId: integer()
			.notNull()
			.references(() => pools.id, { onDelete: "cascade" }),
		teamId: integer()
			.notNull()
			.references(() => tournamentDivisionTeams.id, { onDelete: "cascade" }),
		seed: integer(),
		finish: integer(),
	},
	(table) => [
		unique("pool_team_unique").on(table.poolId, table.teamId),
		index("pool_teams_pool_idx").on(table.poolId),
		index("pool_teams_team_idx").on(table.teamId),
	],
);

export const selectPoolTeamSchema = createSelectSchema(poolTeams);
export const createPoolTeamSchema = createInsertSchema(poolTeams).omit({
	id: true,
});
export const updatePoolTeamSchema = createUpdateSchema(poolTeams);

export type PoolTeam = z.infer<typeof selectPoolTeamSchema>;
export type CreatePoolTeam = z.infer<typeof createPoolTeamSchema>;
export type UpdatePoolTeam = z.infer<typeof updatePoolTeamSchema>;

export const poolTeamsRelations = relations(poolTeams, ({ one }) => ({
	team: one(tournamentDivisionTeams, {
		fields: [poolTeams.teamId],
		references: [tournamentDivisionTeams.id],
	}),
	pool: one(pools, {
		fields: [poolTeams.poolId],
		references: [pools.id],
	}),
}));
