import { authClient } from "@/auth/client";
import { requireAuthenticated } from "@/auth/shared";
import { db } from "@/db/connection";
import { matchSets, selectMatchSetSchema, selectUserSchema } from "@/db/schema";
import { assertFound } from "@/lib/responses";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import type z from "zod";

const setRandomPasswordSchema = selectUserSchema.pick({
	id: true,
});

const setRandomPasswordFn = createServerFn()
	.middleware([requireAuthenticated])
	.inputValidator(setRandomPasswordSchema)
	.handler(async ({ data: { id: userId } }) => {
		const password = "";

		authClient.admin.setUserPassword({
			userId,
			newPassword: password,
		});

		const { data, error } = await authClient.admin.updateUser({
			userId: "user-id", // required
			data: { needsPasswordChange: true }, // required
		});
	});

export const setRandomPasswordMutationOptions = (
	data: z.infer<typeof setRandomPasswordSchema>,
) =>
	mutationOptions({
		mutationFn: async () => {
			return await setRandomPasswordFn({ data });
		},
	});
