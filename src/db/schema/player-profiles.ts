import { relations, sql } from "drizzle-orm"
import {
  check,
  date,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  uuid,
} from "drizzle-orm/pg-core"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"
import { users } from "./auth"
import { levels } from "./levels"
import { genderEnum, playerRoleEnum, rightLeftEnum } from "./shared"

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({ zodInstance: z })

export const playerProfiles = pgTable(
  "player_profiles",
  {
    id: serial().primaryKey(),
    userId: text().references(() => users.id),
    firstName: text().notNull(),
    preferredName: text(),
    lastName: text().notNull(),
    birthdate: date().notNull(),
    gender: genderEnum().notNull(),
    levelId: integer().references(() => levels.id, {
      onDelete: "set null",
    }),
    ratedPoints: doublePrecision().notNull().default(0),
    juniorsPoints: doublePrecision().notNull().default(0),
    bio: text(),
    imageSource: text(),
    heightFeet: integer(),
    heightInches: integer(),
    dominantArm: rightLeftEnum(),
    preferredRole: playerRoleEnum(),
    preferredSide: rightLeftEnum(),
    club: text(),
    highSchoolGraduationYear: integer(),
    collegeTeam: text(),
    collegeTeamYearsParticipated: integer(),
    externalRef: uuid().unique().notNull().defaultRandom(),
  },
  (table) => [
    check(
      "height_feet_check",
      sql`${table.heightFeet} >= 0 AND ${table.heightFeet} <= 8`
    ),
    check(
      "height_inches_check",
      sql`${table.heightInches} >= 0 AND ${table.heightInches} < 12`
    ),
  ]
)

export const selectPlayerProfileSchema = createSelectSchema(playerProfiles)
export const createPlayerProfileSchema = createInsertSchema(
  playerProfiles
).omit({
  id: true,
  externalRef: true,
})
export const updatePlayerProfileSchema = createUpdateSchema(
  playerProfiles
).omit({
  id: true,
  externalRef: true,
})

export type PlayerProfile = z.infer<typeof selectPlayerProfileSchema>
export type CreatePlayerProfile = z.infer<typeof createPlayerProfileSchema>
export type UpdatePlayerProfile = z.infer<typeof updatePlayerProfileSchema>

export const playerProfileRelations = relations(playerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [playerProfiles.userId],
    references: [users.id],
  }),
  level: one(levels, {
    fields: [playerProfiles.levelId],
    references: [levels.id],
  }),
}))
