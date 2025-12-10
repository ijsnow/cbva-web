import { mutationOptions } from "@tanstack/react-query";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import z from "zod";
import { requirePermissions } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	createTournamentDivisionRequirementSchema,
	createTournamentDivisionSchema,
	selectTournamentDivisionSchema,
	tournamentDivisionRequirements,
	tournamentDivisions,
	updateTournamentDivisionRequirementSchema,
} from "@/db/schema";
import { isNotNullOrUndefined } from "@/utils/types";

const upsertRequirements = createServerOnlyFn(
	async (
		tournamentDivisionId: number,
		requirements: z.infer<typeof updateTournamentDivisionRequirementSchema>[],
	) => {
		const requirementsUpdates = requirements.filter(({ id }) =>
			isNotNullOrUndefined(id),
		);
		const requirementsCreates = requirements.filter(
			({ id }) => !isNotNullOrUndefined(id),
		);

		await Promise.all(
			requirementsUpdates.map(({ id, ...values }) =>
				db
					.update(tournamentDivisionRequirements)
					.set(values)
					.where(eq(tournamentDivisionRequirements.id, id as number)),
			),
		);

		if (requirementsCreates.length) {
			await db.insert(tournamentDivisionRequirements).values(
				requirementsCreates.map((reqs) => ({
					...reqs,
					tournamentDivisionId,
				})),
			);
		}
	},
);

export const upsertTournamentDivisionSchema =
	createTournamentDivisionSchema.extend({
		id: z.number().optional(),
		requirements: z.array(updateTournamentDivisionRequirementSchema),
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
				displayGender,
				displayDivision,
				requirements,
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
						displayGender,
						displayDivision,
					})
					.where(eq(tournamentDivisions.id, tournamentDivisionId));

				if (requirements.length) {
					await upsertRequirements(tournamentDivisionId, requirements);
				}

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
					displayGender,
					displayDivision,
				})
				.returning({
					id: tournamentDivisions.id,
				});

			if (requirements.length) {
				await upsertRequirements(id, requirements);
			}

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

export const upsertRequirementsSchema = selectTournamentDivisionSchema
	.pick({
		name: true,
		displayDivision: true,
		displayGender: true,
	})
	.extend({
		tournamentDivisionId: z.number(),
		requirements: z.array(
			createTournamentDivisionRequirementSchema.omit({
				tournamentDivisionId: true,
			}),
		),
	});

export const upsertRequirementsFn = createServerFn()
	.middleware([
		requirePermissions({
			tournament: ["update"],
		}),
	])
	.inputValidator(upsertRequirementsSchema)
	.handler(
		async ({
			data: {
				tournamentDivisionId,
				requirements,
				name,
				displayGender,
				displayDivision,
			},
		}) => {
			console.log({
				tournamentDivisionId,
				requirements,
				name,
				displayGender,
				displayDivision,
			});

			return {
				success: true,
			};
		},
	);

export const upsertRequirementsMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof upsertRequirementsSchema>) =>
			upsertRequirementsFn({ data }),
	});
