import { createAccessControl } from "better-auth/plugins/access"
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access"

export const statement = {
  tournament: ["create", "update", "delete"],
  venues: ["create", "update", "delete"],
  ...defaultStatements,
} as const

export const ac = createAccessControl(statement)

export type Role = "admin" | "td" | "user"

export type Permissions = {
  [K in keyof typeof statement]?: Array<(typeof statement)[K][number]>
}

export const admin = ac.newRole({
  tournament: ["create", "update", "delete"],
  venues: ["create", "update", "delete"],
  ...adminAc.statements,
})

export const td = ac.newRole({
  tournament: ["create", "update"],
  venues: ["update"],
})

export const user = ac.newRole({
  tournament: [],
})
