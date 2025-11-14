import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
// import { setResponseStatus } from "@tanstack/react-start/server";
// import { eq } from "drizzle-orm";
import z from "zod";
import { requirePermissions } from "@/auth/shared";
// import { db } from "@/db/connection";
import { selectTournamentDivisionSchema } from "@/db/schema";

export type MatchKind = "set-to-21" | "set-to-28" | "best-of-3";

export const createPlayoffsSchema = selectTournamentDivisionSchema
	.pick({
		id: true,
	})
	.extend({
		count: z.number(),
		matchKind: z.enum<MatchKind[]>(["set-to-21", "set-to-28", "best-of-3"]),
		overwrite: z.boolean(),
	});

const createPlayoffsFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(createPlayoffsSchema)
	.handler(async ({ data: { id: tournamentDivisionId, count, overwrite } }) => {
		console.log({
			tournamentDivisionId,
			count,
			overwrite,
		});

		// TODO: write code that generates a playoff bracket where top seeds are snake drafted into positions
	});

export const createPlayoffsMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof createPlayoffsSchema>) =>
			createPlayoffsFn({ data }),
	});
