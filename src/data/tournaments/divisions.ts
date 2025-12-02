import { mutationOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	createTournamentDivisionSchema,
	selectTournamentDivisionSchema,
	tournamentDivisions,
} from "@/db/schema";
import { isNotNullOrUndefined } from "@/utils/types";

export const upsertTournamentDivisionSchema =
	createTournamentDivisionSchema.extend({
		id: z.number().optional(),
	});

export const upsertTournamentDivisionFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(upsertTournamentDivisionSchema)
	.handler(
		async ({
			data: {
				id: tournamentDivisionId,
				divisionId,
				name,
				teamSize,
				tournamentId,
				gender,
				capacity,
				waitlistCapacity,
				autopromoteWaitlist,
			},
		}) => {
			if (isNotNullOrUndefined(tournamentDivisionId)) {
				await db
					.update(tournamentDivisions)
					.set({
						divisionId,
						name,
						teamSize,
						tournamentId,
						gender,
						capacity,
						waitlistCapacity,
						autopromoteWaitlist,
					})
					.where(eq(tournamentDivisions.id, tournamentDivisionId));

				return {
					id: tournamentDivisionId,
				};
			}

			const [{ id }] = await db
				.insert(tournamentDivisions)
				.values({
					name,
					divisionId,
					teamSize,
					tournamentId,
					gender,
					capacity,
					waitlistCapacity,
					autopromoteWaitlist,
				})
				.returning({
					id: tournamentDivisions.id,
				});

			return {
				id,
			};
		},
	);

export const upsertTournamentDivisionMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof upsertTournamentDivisionSchema>) =>
			upsertTournamentDivisionFn({ data }),
	});

export const removeTournamentDivisionSchema =
	selectTournamentDivisionSchema.pick({
		id: true,
	});

export const removeTournamentDivisionFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(removeTournamentDivisionSchema)
	.handler(async ({ data: { id: tournamentDivisionId } }) => {
		await db
			.delete(tournamentDivisions)
			.where(eq(tournamentDivisions.id, tournamentDivisionId));
	});

export const removeTournamentDivisionMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof removeTournamentDivisionSchema>) =>
			removeTournamentDivisionFn({ data }),
	});
