import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";

import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import { playoffMatches, pools } from "@/db/schema";
import { isDefined } from "@/utils/types";

export const setMatchCourtSchema = z
	.object({
		poolId: z.number().optional(),
		playoffMatchId: z.number().optional(),
		court: z.string(),
	})
	.refine(({ playoffMatchId, poolId }) => {
		if (!isDefined(playoffMatchId) && !isDefined(poolId)) {
			return false;
		}

		return true;
	}, "Must provide one of poolMatchId or playoffMatchId");

export const setMatchCourtFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(setMatchCourtSchema)
	.handler(async ({ data: { playoffMatchId, poolId, court } }) => {
		if (playoffMatchId) {
			await db
				.update(playoffMatches)
				.set({
					court,
				})
				.where(eq(playoffMatches.id, playoffMatchId));
		} else if (poolId) {
			await db
				.update(pools)
				.set({
					court,
				})
				.where(eq(pools.id, poolId));
		} else {
			throw new Error();
		}

		return {
			success: true as true,
		};
	});

export const setMatchCourtMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof setMatchCourtSchema>) =>
			setMatchCourtFn({ data }),
	});
