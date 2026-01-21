import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

export type { Role } from "@/db/schema";

export const statement = {
	tournament: ["create", "update", "delete", "teehee"],
	venues: ["create", "update", "delete"],
	content: ["update"],
	files: ["create", "delete"],
	profiles: ["create", "update"],
	faqs: ["create", "update", "delete"],
	blogs: ["create", "update", "delete"],
	...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

export type Permissions = {
	[K in keyof typeof statement]?: Array<(typeof statement)[K][number]>;
};

export const superadmin = ac.newRole({
	...adminAc.statements,
});

export const admin = ac.newRole({
	tournament: ["create", "update", "delete"],
	venues: ["create", "update", "delete"],
	content: ["update"],
	files: ["create", "delete"],
	profiles: ["create", "update"],
	faqs: ["create", "update", "delete"],
	blogs: ["create", "update", "delete"],
	...adminAc.statements,
});

export const td = ac.newRole({
	tournament: ["update"],
	venues: ["update"],
	files: ["create", "delete"],
	profiles: ["create", "update"],
});

export const user = ac.newRole({
	tournament: [],
	files: ["create", "delete"],
	profiles: ["create", "update"],
});
