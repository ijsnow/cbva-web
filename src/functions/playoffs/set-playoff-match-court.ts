import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";

import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { playoffMatches, selectPlayoffMatchSchema } from "@/db/schema";

export const setPlayoffMatchCourtSchema = selectPlayoffMatchSchema
	.pick({
		id: true,
	})
	.extend({
		court: z.string(),
	});

export const setPlayoffMatchCourtFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(setPlayoffMatchCourtSchema)
	.handler(async ({ data: { id, court } }) => {
		await db
			.update(playoffMatches)
			.set({
				court,
			})
			.where(eq(playoffMatches.id, id));

		return {
			success: true as true,
		};
	});

export const setPlayoffMatchCourtMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof setPlayoffMatchCourtSchema>) =>
			setPlayoffMatchCourtFn({ data }),
	});
