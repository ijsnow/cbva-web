import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { eq, inArray } from "drizzle-orm";
import range from "lodash-es/range";
import z from "zod";

import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	type CreateMatchSet,
	type CreatePoolMatch,
	type CreatePoolTeam,
	matchSets,
	type PoolTeam,
	poolMatches,
	pools,
	poolTeams,
	selectPoolSchema,
	selectTournamentDivisionSchema,
} from "@/db/schema";
import { matchRefTeams } from "@/db/schema/match-ref-teams";
import { getPoolStats } from "@/hooks/matches";
import { badRequest, internalServerError } from "@/lib/responses";
import { snake } from "@/lib/snake-draft";

export const setPoolCourtSchema = selectPoolSchema
	.pick({
		id: true,
	})
	.extend({
		court: z.string(),
	});

export const setPoolCourtFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(setPoolCourtSchema)
	.handler(async ({ data: { id, court } }) => {
		await db
			.update(pools)
			.set({
				court,
			})
			.where(eq(pools.id, id));

		return {
			success: true as true,
		};
	});

export const setPoolCourtMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof setPoolCourtSchema>) =>
			setPoolCourtFn({ data }),
	});
