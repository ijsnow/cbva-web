import { db } from "@/db/connection";
import {
	matchRefTeams,
	selectMatchRefTeamSchema,
	tournamentDivisionTeams,
} from "@/db/schema";
import { assertFound, notFound } from "@/lib/responses";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";

export const removeTeamSchema = selectMatchRefTeamSchema
	.pick({
		id: true,
	})
	.extend({
		late: z.boolean().optional(),
	});

export const removeTeam = createServerFn()
	.inputValidator(removeTeamSchema)
	.handler(async ({ data: { id, late } }) => {
		const team = await db.query.tournamentDivisionTeams.findFirst({
			with: {
				poolTeam: true,
				tournamentDivision: {
					columns: {
						tournamentId: true,
						capacity: true,
					},
				},
			},
			where: (t, { eq }) => eq(t.id, id),
		});

		assertFound(!team);

		await db
			.update(tournamentDivisionTeams)
			.set({
				status: late ? "late-withdraw" : "withdraw",
			})
			.where(eq(matchRefTeams.id, id));

		// TODO: check if autopromoteWl is enabled, if so, promote a team

		return {
			success: true,
		};
	});

export const removeTeamMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof removeTeamSchema>) =>
			removeTeam({ data }),
	});
