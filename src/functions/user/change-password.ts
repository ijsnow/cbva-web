import { auth } from "@/auth";
import { requireAuthenticated } from "@/auth/shared";
import { db } from "@/db/connection";
import { users } from "@/db/schema";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import z from "zod";

export const changePasswordSchema = z.object({
	currentPassword: z.string(),
	newPassword: z.string(),
});

export const changePasswordFn = createServerFn({ method: "POST" })
	.middleware([requireAuthenticated])
	.inputValidator(changePasswordSchema)
	.handler(
		async ({ data: { currentPassword, newPassword }, context: { viewer } }) => {
			await auth.api.changePassword({
				body: {
					currentPassword,
					newPassword,
				},
				headers: getRequestHeaders(),
			});

			await db
				.update(users)
				.set({
					needsPasswordChange: false,
				})
				.where(eq(users.id, viewer.id));

			return {
				success: true,
			};
		},
	);

export const changePasswordMutationOptions = () =>
	mutationOptions({
		mutationFn: async (data: z.infer<typeof changePasswordSchema>) =>
			changePasswordFn({ data }),
	});
