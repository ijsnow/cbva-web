import { requireAuthenticated } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	invoices,
	memberships,
	teamPlayers,
	teams,
	tournamentDivisionTeams,
	tournamentDivisions,
} from "@/db/schema";
import { settings } from "@/db/schema/settings";
import { getDefaultTimeZone } from "@/lib/dates";
import { postSale } from "@/services/usaepay";
import { today } from "@internationalized/date";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { eq, inArray } from "drizzle-orm";
import z from "zod";

export const cartSchema = z.object({
	memberships: z.array(z.number()).default([]),
	teams: z
		.array(
			z.object({
				divisionId: z.number(),
				profileIds: z.array(z.number()),
			}),
		)
		.default([]),
});

export const checkoutSchema = z.object({
	billingInformation: z.object({
		firstName: z.string().nonempty(),
		lastName: z.string().nonempty(),
		address: z.array(z.string()).min(1).max(2),
		city: z.string().nonempty(),
		state: z.string().nonempty(),
		postalCode: z.string().nonempty(),
	}),
	paymentKey: z.string(),
	cart: cartSchema,
});

const createInvoice = createServerOnlyFn(
	async (purchaserId: string, transactionKey: string) => {
		const [invoice] = await db
			.insert(invoices)
			.values({
				transactionKey,
				purchaserId,
			})
			.returning({ id: invoices.id });

		return invoice.id;
	},
);

const createMemberships = createServerOnlyFn(
	async (invoiceId: number, profileIds: number[]) => {
		const validUntil = today(getDefaultTimeZone())
			.set({
				day: 1,
				month: 1,
			})
			.add({ years: 1 })
			.toString();

		await Promise.all(
			profileIds.map((profileId) =>
				db.insert(memberships).values({
					profileId,
					invoiceId,
					validUntil,
				}),
			),
		);
	},
);

const getMembershipPrice = createServerOnlyFn(async () => {
	const setting = await db
		.select({ value: settings.value })
		.from(settings)
		.where(eq(settings.key, "membership-price"))
		.then((rows) => rows[0]);

	if (!setting?.value) {
		throw new Error("Membership price not configured");
	}

	const price = Number(setting.value);

	if (Number.isNaN(price) || price <= 0) {
		throw new Error("Invalid membership price");
	}

	return price;
});

const getDefaultTournamentPrice = createServerOnlyFn(async () => {
	const setting = await db
		.select({ value: settings.value })
		.from(settings)
		.where(eq(settings.key, "default-tournament-price"))
		.then((rows) => rows[0]);

	if (!setting?.value) {
		return null;
	}

	const price = Number(setting.value);

	if (Number.isNaN(price) || price <= 0) {
		return null;
	}

	return price;
});

const createTeamRegistrations = createServerOnlyFn(
	async (
		invoiceId: number,
		cartTeams: z.infer<typeof cartSchema>["teams"],
	) => {
		if (cartTeams.length === 0) return;

		// Get division prices
		const divisionIds = [...new Set(cartTeams.map((t) => t.divisionId))];
		const divisions = await db
			.select({
				id: tournamentDivisions.id,
				registrationPrice: tournamentDivisions.registrationPrice,
			})
			.from(tournamentDivisions)
			.where(inArray(tournamentDivisions.id, divisionIds));

		const divisionPriceMap = new Map(
			divisions.map((d) => [d.id, d.registrationPrice]),
		);

		for (const cartTeam of cartTeams) {
			// Create the team
			const [team] = await db
				.insert(teams)
				.values({})
				.returning({ id: teams.id });

			// Add players to the team
			await db.insert(teamPlayers).values(
				cartTeam.profileIds.map((profileId) => ({
					teamId: team.id,
					playerProfileId: profileId,
				})),
			);

			// Register team in the division
			await db.insert(tournamentDivisionTeams).values({
				tournamentDivisionId: cartTeam.divisionId,
				teamId: team.id,
				status: "registered",
			});
		}
	},
);

const calculateTeamsTotal = createServerOnlyFn(
	async (cartTeams: z.infer<typeof cartSchema>["teams"]) => {
		if (cartTeams.length === 0) return 0;

		const divisionIds = [...new Set(cartTeams.map((t) => t.divisionId))];
		const divisions = await db
			.select({
				id: tournamentDivisions.id,
				registrationPrice: tournamentDivisions.registrationPrice,
			})
			.from(tournamentDivisions)
			.where(inArray(tournamentDivisions.id, divisionIds));

		const divisionPriceMap = new Map(
			divisions.map((d) => [d.id, d.registrationPrice]),
		);

		const defaultPrice = await getDefaultTournamentPrice();

		let total = 0;
		for (const team of cartTeams) {
			const divisionPrice = divisionPriceMap.get(team.divisionId);
			const price = divisionPrice ?? defaultPrice ?? 0;
			total += price;
		}

		return total;
	},
);

export const checkoutHandler = createServerOnlyFn(
	async (viewerId: string, data: z.infer<typeof checkoutSchema>) => {
		const {
			paymentKey,
			billingInformation,
			cart: { memberships: membershipProfileIds, teams: cartTeams },
		} = data;

		if (membershipProfileIds.length === 0 && cartTeams.length === 0) {
			throw new Error("Cart is empty");
		}

		// Calculate totals
		let membershipsTotal = 0;
		if (membershipProfileIds.length > 0) {
			const membershipPrice = await getMembershipPrice();
			membershipsTotal = membershipProfileIds.length * membershipPrice;
		}

		const teamsTotal = await calculateTeamsTotal(cartTeams);
		const amount = membershipsTotal + teamsTotal;

		// Build description
		const descriptionParts: string[] = [];
		if (membershipProfileIds.length > 0) {
			descriptionParts.push(`Membership (${membershipProfileIds.length})`);
		}
		if (cartTeams.length > 0) {
			descriptionParts.push(`Team Registration (${cartTeams.length})`);
		}

		const transaction = await postSale({
			paymentKey,
			amount,
			billingAddress: {
				firstName: billingInformation.firstName,
				lastName: billingInformation.lastName,
				street: billingInformation.address.filter(Boolean).join(", "),
				city: billingInformation.city,
				state: billingInformation.state,
				postalCode: billingInformation.postalCode,
			},
			description: `CBVA ${descriptionParts.join(", ")}`,
		});

		if (transaction.result_code !== "A") {
			throw new Error(
				transaction.error || `Payment declined: ${transaction.result}`,
			);
		}

		const invoiceId = await createInvoice(viewerId, transaction.key);

		// Create memberships
		if (membershipProfileIds.length > 0) {
			await createMemberships(invoiceId, membershipProfileIds);
		}

		// Create team registrations
		if (cartTeams.length > 0) {
			await createTeamRegistrations(invoiceId, cartTeams);
		}

		return {
			success: true,
			transactionKey: transaction.key,
			refnum: transaction.refnum,
		};
	},
);

export const checkoutFn = createServerFn()
	.middleware([requireAuthenticated])
	.inputValidator(checkoutSchema)
	.handler(({ data, context: { viewer } }) => checkoutHandler(viewer.id, data));

export const checkoutMutationOptions = () =>
	mutationOptions({
		mutationFn: (data: z.infer<typeof checkoutSchema>) => checkoutFn({ data }),
	});
