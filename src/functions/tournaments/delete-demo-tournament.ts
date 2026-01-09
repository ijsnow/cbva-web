import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import type z from "zod";
import { requireAuthenticated, requirePermissions } from "@/auth/shared";
import { selectTournamentSchema, tournaments } from "@/db/schema";
import { duplicateTournamentFn } from "@/data/schedule";
import { today } from "@internationalized/date";
import { getDefaultTimeZone } from "@/lib/dates";
import { db } from "@/db/connection";
import { and, eq } from "drizzle-orm";
import { assertFound, badRequest, forbidden } from "@/lib/responses";
import { withDirectorId } from "@/middlewares/with-director-id";

export const deleteDemoTournamentSchema = selectTournamentSchema.pick({
	id: true,
});

export const deleteDemoTournament = createServerFn()
	.middleware([withDirectorId])
	.inputValidator(deleteDemoTournamentSchema)
	.handler(async ({ data: { id }, context: { directorId, viewer } }) => {
		const tournament = await db.query.tournaments.findFirst({
			with: {
				directors: {
					with: {
						director: true,
					},
				},
			},
			where: (t, { eq }) => eq(t.id, id),
		});

		assertFound(tournament);

		if (!tournament.demo) {
			throw badRequest("Tournament is not a demo.");
		}

		const isDirector = tournament.directors.some(
			(director) => director.directorId === directorId,
		);

		if (!isDirector && viewer.role !== "admin") {
			throw forbidden();
		}

		await db
			.delete(tournaments)
			.where(and(eq(tournaments.id, id), eq(tournaments.demo, true)));

		return {
			success: true,
		};
	});

export const deleteDemoTournamentMuationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof deleteDemoTournamentSchema>) =>
			deleteDemoTournament({ data }),
	});
