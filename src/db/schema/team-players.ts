import { relations } from "drizzle-orm"
import { index, integer, pgTable, serial, unique } from "drizzle-orm/pg-core"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"
import { playerProfiles } from "./player-profiles"
import { teams } from "./teams"

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({ zodInstance: z })

export const teamPlayers = pgTable(
  "team_players",
  {
    id: serial().primaryKey(),
    teamId: integer()
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    playerProfileId: integer()
      .notNull()
      .references(() => playerProfiles.id, { onDelete: "cascade" }),
  },
  (table) => [
    unique("team_player_unique").on(table.teamId, table.playerProfileId),
    index("team_players_team_idx").on(table.teamId),
    index("team_players_player_idx").on(table.playerProfileId),
  ]
)

export const selectTeamPlayerSchema = createSelectSchema(teamPlayers)
export const createTeamPlayerSchema = createInsertSchema(teamPlayers).omit({
  id: true,
})
export const updateTeamPlayerSchema = createUpdateSchema(teamPlayers)

export type TeamPlayer = z.infer<typeof selectTeamPlayerSchema>
export type CreateTeamPlayer = z.infer<typeof createTeamPlayerSchema>
export type UpdateTeamPlayer = z.infer<typeof updateTeamPlayerSchema>

export const teamPlayerRelations = relations(teamPlayers, ({ one }) => ({
  profile: one(playerProfiles, {
    fields: [teamPlayers.playerProfileId],
    references: [playerProfiles.id],
  }),
  team: one(teams, {
    fields: [teamPlayers.teamId],
    references: [teams.id],
  }),
}))
