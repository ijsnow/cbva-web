import {
  boolean,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core"
import { createSchemaFactory } from "drizzle-zod"
import { z } from "zod"

import { users } from "./auth"

const { createInsertSchema, createSelectSchema, createUpdateSchema } =
  createSchemaFactory({ zodInstance: z })

export const projects = pgTable("projects", {
  id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  sharedUserIds: text().array().notNull().default([]),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  ownerId: text()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
})

export const todos = pgTable("todos", {
  id: serial().primaryKey(),
  text: varchar({ length: 500 }).notNull(),
  completed: boolean().notNull().default(false),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  userId: text()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  projectId: serial()
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  userIds: text().array().notNull().default([]),
})

export const selectProjectSchema = createSelectSchema(projects)
export const createProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export const updateProjectSchema = createUpdateSchema(projects)

export const selectTodoSchema = createSelectSchema(todos)
export const createTodoSchema = createInsertSchema(todos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})
export const updateTodoSchema = createUpdateSchema(todos)

export type Project = z.infer<typeof selectProjectSchema>
export type UpdateProject = z.infer<typeof updateProjectSchema>
export type Todo = z.infer<typeof selectTodoSchema>
export type UpdateTodo = z.infer<typeof updateTodoSchema>

export const selectUsersSchema = createSelectSchema(users)
