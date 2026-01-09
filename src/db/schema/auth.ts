import { relations } from "drizzle-orm"
import {
  bigint,
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"
import { createSchemaFactory } from "drizzle-zod"
import z from "zod"
import { playerProfiles } from "./player-profiles"

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({ zodInstance: z })

export const roleEnum = pgEnum("role", ["user", "td", "admin", "superadmin"])

export const users = pgTable("users", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean()
    .$defaultFn(() => false)
    .notNull(),
  phoneNumber: text().notNull().unique(),
  phoneNumberVerified: boolean()
    .$defaultFn(() => false)
    .notNull(),
  image: text(),
  role: roleEnum(),
  banned: boolean(),
  banReason: text(),
  banDate: date(),
  createdAt: timestamp()
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp()
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const selectUserSchema = createSelectSchema(users)
export const createUserSchema = createInsertSchema(users).omit({
  id: true,
})
export const updateUserSchema = createUpdateSchema(users)

export type User = z.infer<typeof selectUserSchema>
export type CreateUser = z.infer<typeof createUserSchema>
export type UpdateUser = z.infer<typeof updateUserSchema>

export const roleSchema = createSelectSchema(roleEnum)

export type Role = z.infer<typeof roleSchema>

export const userRelations = relations(users, ({ many }) => ({
  profiles: many(playerProfiles),
}))

export const sessions = pgTable("sessions", {
  id: text().primaryKey(),
  expiresAt: timestamp().notNull(),
  token: text().notNull().unique(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  impersonatedBy: text().references(() => users.id),
})

export const accounts = pgTable("accounts", {
  id: text().primaryKey(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp(),
  refreshTokenExpiresAt: timestamp(),
  scope: text(),
  password: text(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
})

export const verifications = pgTable("verifications", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp().notNull(),
  createdAt: timestamp().$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: timestamp().$defaultFn(() => /* @__PURE__ */ new Date()),
})

export const rate_limits = pgTable("rate_limits", {
  id: text().primaryKey(),
  key: text().notNull().unique(),
  count: integer().notNull(),
  lastRequest: bigint({ mode: "number" }).notNull(),
})
