import { requireAuthenticated } from "@/auth/shared";
import { db } from "@/db/connection";
import {
	divisions,
	invoices,
	levels,
	memberships,
	playerProfiles,
	teamPlayers,
	teams,
	tournamentDivisionTeams,
	tournamentDivisions,
	tournaments,
	tshirtSizeSchema,
	type TshirtSize,
} from "@/db/schema";
import { settings } from "@/db/schema/settings";
import { getDefaultTimeZone } from "@/lib/dates";
import { postSale } from "@/services/usaepay";
import { today } from "@internationalized/date";
import { mutationOptions } from "@tanstack/react-query";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { and, eq, inArray, ne } from "drizzle-orm";
import z from "zod";

export const membershipItemSchema = z.object({
	profileId: z.number(),
	tshirtSize: tshirtSizeSchema.optional(),
});

export type MembershipItem = z.infer<typeof membershipItemSchema>;

export const cartSchema = z.object({
	memberships: z.array(membershipItemSchema).default([]),
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
	async (invoiceId: number, membershipItems: Array<{ profileId: number, tshirtSize?: TshirtSize }>) => {
		const validUntil = today(getDefaultTimeZone())
			.set({
				day: 1,
				month: 1,
			})
			.add({ years: 1 })
			.toString();

		await Promise.all(
			membershipItems.map((item) =>
				db.insert(memberships).values({
					profileId: item.profileId,
					invoiceId,
					validUntil,
					tshirtSize: item.tshirtSize ?? null,
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
	async (invoiceId: number, cartTeams: z.infer<typeof cartSchema>["teams"]) => {
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

		const defaultPrice = await getDefaultTournamentPrice();

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

			// Calculate price paid
			const divisionPrice = divisionPriceMap.get(cartTeam.divisionId);
			const pricePaid = divisionPrice ?? defaultPrice ?? 0;

			// Register team in the division
			await db.insert(tournamentDivisionTeams).values({
				tournamentDivisionId: cartTeam.divisionId,
				teamId: team.id,
				invoiceId,
				pricePaid,
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

const validateMemberships = createServerOnlyFn(
	async (membershipItems: z.infer<typeof cartSchema>["memberships"]) => {
		if (membershipItems.length === 0) return;

		const profileIds = membershipItems.map((m) => m.profileId);

		// Check for duplicate profile IDs within the cart
		const uniqueProfileIds = new Set(profileIds);
		if (uniqueProfileIds.size !== profileIds.length) {
			throw new Error("Duplicate memberships in cart for the same player");
		}

		// Check for existing active memberships
		const currentDate = today(getDefaultTimeZone()).toString();
		const activeMemberships = await db.query.memberships.findMany({
			where: {
				profileId: { in: profileIds },
				validUntil: { gte: currentDate },
			},
			columns: { profileId: true },
		});

		if (activeMemberships.length > 0) {
			const activeProfileIds = activeMemberships.map((m) => m.profileId);
			throw new Error(
				`Player(s) already have active memberships: ${activeProfileIds.join(", ")}`,
			);
		}
	},
);

const validateTeamRegistrations = createServerOnlyFn(
	async (cartTeams: z.infer<typeof cartSchema>["teams"]) => {
		if (cartTeams.length === 0) return;

		// Get all division IDs and validate they exist (with division order for level checks)
		const divisionIds = [...new Set(cartTeams.map((t) => t.divisionId))];
		const tournamentDivisionData = await db
			.select({
				id: tournamentDivisions.id,
				gender: tournamentDivisions.gender,
				divisionOrder: divisions.order,
			})
			.from(tournamentDivisions)
			.innerJoin(divisions, eq(tournamentDivisions.divisionId, divisions.id))
			.where(inArray(tournamentDivisions.id, divisionIds));

		const divisionMap = new Map<
			number,
			{ id: number; gender: string; divisionOrder: number | null }
		>(tournamentDivisionData.map((d) => [d.id, d]));

		// Check all divisions exist
		for (const divisionId of divisionIds) {
			if (!divisionMap.has(divisionId)) {
				throw new Error("Division not found");
			}
		}

		// Get all profile IDs with their genders and level orders
		const allProfileIds = [...new Set(cartTeams.flatMap((t) => t.profileIds))];
		const profiles = await db
			.select({
				id: playerProfiles.id,
				gender: playerProfiles.gender,
				levelOrder: levels.order,
			})
			.from(playerProfiles)
			.leftJoin(levels, eq(playerProfiles.levelId, levels.id))
			.where(inArray(playerProfiles.id, allProfileIds));

		const profileMap = new Map<
			number,
			{ id: number; gender: string; levelOrder: number | null }
		>(profiles.map((p) => [p.id, p]));

		// Validate each team's players match the division gender and level
		for (const cartTeam of cartTeams) {
			const division = divisionMap.get(cartTeam.divisionId);
			if (!division) continue;

			for (const profileId of cartTeam.profileIds) {
				const profile = profileMap.get(profileId);
				if (!profile) {
					throw new Error("Player profile not found");
				}

				if (profile.gender !== division.gender) {
					throw new Error(
						`Player gender does not match division: expected ${division.gender}, got ${profile.gender}`,
					);
				}

				// Check level qualification: player level order must be <= division order
				// Higher level players cannot play in lower divisions
				if (
					profile.levelOrder !== null &&
					division.divisionOrder !== null &&
					profile.levelOrder > division.divisionOrder
				) {
					throw new Error("Player level does not qualify for this division");
				}
			}
		}

		// Check for duplicate same-day tournament registrations
		// Get tournament dates for the divisions being registered for
		const divisionTournamentDates = await db
			.select({
				divisionId: tournamentDivisions.id,
				tournamentDate: tournaments.date,
			})
			.from(tournamentDivisions)
			.innerJoin(
				tournaments,
				eq(tournamentDivisions.tournamentId, tournaments.id),
			)
			.where(inArray(tournamentDivisions.id, divisionIds));

		const divisionDateMap = new Map<number, string>(
			divisionTournamentDates.map((d) => [d.divisionId, d.tournamentDate]),
		);

		// Query existing tournament registrations for all players in the cart
		const existingRegistrations = await db
			.select({
				profileId: teamPlayers.playerProfileId,
				tournamentDate: tournaments.date,
			})
			.from(teamPlayers)
			.innerJoin(teams, eq(teamPlayers.teamId, teams.id))
			.innerJoin(
				tournamentDivisionTeams,
				eq(teams.id, tournamentDivisionTeams.teamId),
			)
			.innerJoin(
				tournamentDivisions,
				eq(
					tournamentDivisionTeams.tournamentDivisionId,
					tournamentDivisions.id,
				),
			)
			.innerJoin(
				tournaments,
				eq(tournamentDivisions.tournamentId, tournaments.id),
			)
			.where(
				and(
					inArray(teamPlayers.playerProfileId, allProfileIds),
					ne(tournamentDivisionTeams.status, "cancelled"),
				),
			);

		const existingRegistrationsByProfile = new Map<number, Set<string>>();
		for (const reg of existingRegistrations) {
			if (!existingRegistrationsByProfile.has(reg.profileId)) {
				existingRegistrationsByProfile.set(reg.profileId, new Set<string>());
			}
			existingRegistrationsByProfile
				.get(reg.profileId)
				?.add(reg.tournamentDate);
		}

		// Check for conflicts within the cart and with existing registrations
		const cartProfileDates = new Map<number, Set<string>>(); // profileId -> Set of dates in this cart
		for (const cartTeam of cartTeams) {
			const tournamentDate = divisionDateMap.get(cartTeam.divisionId);
			if (!tournamentDate) continue;

			for (const profileId of cartTeam.profileIds) {
				// Check against existing registrations
				const existingDates = existingRegistrationsByProfile.get(profileId);
				if (existingDates?.has(tournamentDate)) {
					throw new Error(
						`Player already registered in a tournament on this date: ${tournamentDate}`,
					);
				}

				// Check within the cart
				if (!cartProfileDates.has(profileId)) {
					cartProfileDates.set(profileId, new Set<string>());
				}
				const profileDates = cartProfileDates.get(profileId) ?? new Set();
				if (profileDates.has(tournamentDate)) {
					throw new Error(
						`Player cannot be registered in multiple teams on the same tournament date: ${tournamentDate}`,
					);
				}
				profileDates.add(tournamentDate);
			}
		}
	},
);

export const checkoutHandler = createServerOnlyFn(
	async (viewerId: string, data: z.infer<typeof checkoutSchema>) => {
		const {
			paymentKey,
			billingInformation,
			cart: { memberships: membershipItems, teams: cartTeams },
		} = data;

		if (membershipItems.length === 0 && cartTeams.length === 0) {
			throw new Error("Cart is empty");
		}

		// Validate memberships before processing payment
		await validateMemberships(membershipItems);

		// Validate team registrations before processing payment
		await validateTeamRegistrations(cartTeams);

		// Calculate totals
		let membershipsTotal = 0;
		if (membershipItems.length > 0) {
			const membershipPrice = await getMembershipPrice();
			membershipsTotal = membershipItems.length * membershipPrice;
		}

		const teamsTotal = await calculateTeamsTotal(cartTeams);
		const amount = membershipsTotal + teamsTotal;

		// Build description
		const descriptionParts: string[] = [];
		if (membershipItems.length > 0) {
			descriptionParts.push(`Membership (${membershipItems.length})`);
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
		if (membershipItems.length > 0) {
			await createMemberships(invoiceId, membershipItems);
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
