import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq, sql } from "drizzle-orm";
import z from "zod";
import { authMiddleware, requireRole } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	createUserSchema,
	selectUserSchema,
	updateUserSchema,
	users,
} from "@/db/schema";
import { forbidden } from "@/lib/responses";

export const searchUsersSchema = selectUserSchema.pick({
	name: true,
});

export const getUsersFn = createServerFn()
	.middleware([requireRole(["admin"])])
	.inputValidator(searchUsersSchema)
	.handler(async ({ data: { name } }) => {
		return await db.query.users.findMany({
			where: (t, { ilike }) => ilike(t.name, `%${name}%`),
			limit: 10,
			orderBy: (t, { asc }) => asc(t.name),
		});
	});

export const usersQueryOptions = ({
	name,
}: z.infer<typeof searchUsersSchema>) =>
	queryOptions({
		queryKey: ["users", name],
		queryFn: async () => {
			if (name.length < 3) {
				return { users: [], total: 0 };
			}

			const data = await getUsersFn({ data: { name } });

			return { users: data };
		},
	});

export const updateUserFnSchema = updateUserSchema
	.pick({
		name: true,
		email: true,
		phoneNumber: true,
	})
	.extend({
		id: z.string(),
	});

export const updateUserFn = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator(updateUserFnSchema)
	.handler(
		async ({ data: { id, name, email, phoneNumber }, context: { viewer } }) => {
			const isAdmin = viewer?.role === "admin";
			const isViewer = viewer?.id === id;

			if (!isAdmin && !isViewer) {
				throw forbidden();
			}

			const values = {
				name: isAdmin ? name : undefined,
				email: isAdmin ? email : undefined,
				phoneNumber,
			};

			await db
				.update(users)
				.set({
					...values,
					phoneNumberVerified: values.phoneNumber ? sql`` : undefined,
				})
				.where(eq(users.id, id));

			return {
				success: true,
			};
		},
	);

export const updateUserMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof updateUserFnSchema>) => {
			return updateUserFn({ data });
		},
	});

export const adminUpdateUserSchema = selectUserSchema
	.pick({
		role: true,
	})
	.extend({
		id: z.string(),
	});

export const adminUpdateUserFn = createServerFn({ method: "POST" })
	.middleware([requireRole(["admin"])])
	.inputValidator(adminUpdateUserSchema)
	.handler(async ({ data: { id, role } }) => {
		await db
			.update(users)
			.set({
				role,
			})
			.where(eq(users.id, id));

		return {
			success: true,
		};
	});

export const adminUpdateUserMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof adminUpdateUserSchema>) => {
			return adminUpdateUserFn({ data });
		},
	});
