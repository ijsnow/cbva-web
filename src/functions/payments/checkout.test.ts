import { db } from "@/db/connection";
import {
	invoices,
	levels,
	memberships,
	teamPlayers,
	tournamentDivisionTeams,
} from "@/db/schema";
import { settings } from "@/db/schema/settings";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { createProfiles, createUsers } from "@/tests/utils/users";
import { eq, inArray } from "drizzle-orm";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { TransactionResponse } from "@/services/usaepay";

const mockPostSale = vi.fn<() => Promise<TransactionResponse>>();

vi.mock("@/services/usaepay", () => ({
	postSale: (...args: unknown[]) => mockPostSale(...args),
}));

// Import after mocking
const { checkoutHandler } = await import("./checkout");

function createCheckoutInput(
	profileIds: number[],
	teams: { divisionId: number; profileIds: number[] }[] = [],
) {
	return {
		billingInformation: {
			firstName: "John",
			lastName: "Doe",
			address: ["123 Main St"],
			city: "Los Angeles",
			state: "CA",
			postalCode: "90001",
		},
		paymentKey: "test-payment-key",
		cart: {
			memberships: profileIds,
			teams,
		},
	};
}

function createSuccessResponse(): TransactionResponse {
	return {
		type: "transaction",
		key: "txn-123",
		refnum: "ref-456",
		result_code: "A",
		result: "Approved",
		authcode: "AUTH123",
		auth_amount: 100,
	};
}

function createDeclinedResponse(): TransactionResponse {
	return {
		type: "transaction",
		key: "txn-123",
		refnum: "ref-456",
		result_code: "D",
		result: "Declined",
		authcode: "",
		auth_amount: 0,
		error: "Insufficient funds",
	};
}

async function seedMembershipPrice(price: number) {
	await db
		.insert(settings)
		.values({
			key: "membership-price",
			label: "Membership Price",
			value: String(price),
			type: "money",
		})
		.onConflictDoUpdate({
			target: settings.key,
			set: { value: String(price) },
		});
}

async function seedDefaultTournamentPrice(price: number) {
	await db
		.insert(settings)
		.values({
			key: "default-tournament-price",
			label: "Default Tournament Price",
			value: String(price),
			type: "money",
		})
		.onConflictDoUpdate({
			target: settings.key,
			set: { value: String(price) },
		});
}

describe("checkout", () => {
	beforeEach(async () => {
		vi.resetAllMocks();
		await seedMembershipPrice(100);
	});

	test("creates memberships on successful payment", async () => {
		const [user] = await createUsers(db, 1);
		const profiles = await createProfiles(db, [
			{ userId: user.id },
			{ userId: user.id },
		]);
		const profileIds = profiles.map((p) => p.id);

		mockPostSale.mockResolvedValueOnce(createSuccessResponse());

		const result = await checkoutHandler(
			user.id,
			createCheckoutInput(profileIds),
		);

		expect(result.success).toBe(true);
		expect(result.transactionKey).toBe("txn-123");
		expect(result.refnum).toBe("ref-456");

		// Verify invoice was created
		const [invoice] = await db
			.select()
			.from(invoices)
			.where(eq(invoices.purchaserId, user.id));

		expect(invoice).toBeDefined();
		expect(invoice.transactionKey).toBe("txn-123");

		// Verify memberships were created for each profile
		const createdMemberships = await db
			.select()
			.from(memberships)
			.where(eq(memberships.invoiceId, invoice.id));

		expect(createdMemberships).toHaveLength(2);
		expect(createdMemberships.map((m) => m.profileId).sort()).toEqual(
			profileIds.sort(),
		);
	});

	test("does not create memberships on declined payment", async () => {
		const [user] = await createUsers(db, 1);
		const profiles = await createProfiles(db, [{ userId: user.id }]);
		const profileIds = profiles.map((p) => p.id);

		mockPostSale.mockResolvedValueOnce(createDeclinedResponse());

		await expect(
			checkoutHandler(user.id, createCheckoutInput(profileIds)),
		).rejects.toThrow("Insufficient funds");

		// Verify no invoice was created for this user
		const userInvoices = await db
			.select()
			.from(invoices)
			.where(eq(invoices.purchaserId, user.id));

		expect(userInvoices).toHaveLength(0);

		// Verify no memberships were created for these profiles
		for (const profileId of profileIds) {
			const profileMemberships = await db
				.select()
				.from(memberships)
				.where(eq(memberships.profileId, profileId));

			expect(profileMemberships).toHaveLength(0);
		}
	});

	test("throws error when cart is empty", async () => {
		const [user] = await createUsers(db, 1);

		mockPostSale.mockResolvedValueOnce(createSuccessResponse());

		await expect(
			checkoutHandler(user.id, createCheckoutInput([])),
		).rejects.toThrow("Cart is empty");

		// Verify postSale was never called
		expect(mockPostSale).not.toHaveBeenCalled();
	});

	test("calculates correct amount based on number of memberships", async () => {
		const [user] = await createUsers(db, 1);
		const profiles = await createProfiles(db, [
			{ userId: user.id },
			{ userId: user.id },
			{ userId: user.id },
		]);
		const profileIds = profiles.map((p) => p.id);

		mockPostSale.mockResolvedValueOnce(createSuccessResponse());

		await checkoutHandler(user.id, createCheckoutInput(profileIds));

		expect(mockPostSale).toHaveBeenCalledWith(
			expect.objectContaining({
				amount: 300, // 3 memberships * $100 each (price from settings)
				description: "CBVA Membership (3)",
			}),
		);
	});

	test("uses membership price from settings", async () => {
		await seedMembershipPrice(50);

		const [user] = await createUsers(db, 1);
		const profiles = await createProfiles(db, [
			{ userId: user.id },
			{ userId: user.id },
		]);
		const profileIds = profiles.map((p) => p.id);

		mockPostSale.mockResolvedValueOnce(createSuccessResponse());

		await checkoutHandler(user.id, createCheckoutInput(profileIds));

		expect(mockPostSale).toHaveBeenCalledWith(
			expect.objectContaining({
				amount: 100, // 2 memberships * $50 each
			}),
		);
	});

	test("throws error when membership price is not configured", async () => {
		await db.delete(settings).where(eq(settings.key, "membership-price"));

		const [user] = await createUsers(db, 1);
		const profiles = await createProfiles(db, [{ userId: user.id }]);
		const profileIds = profiles.map((p) => p.id);

		await expect(
			checkoutHandler(user.id, createCheckoutInput(profileIds)),
		).rejects.toThrow("Membership price not configured");

		expect(mockPostSale).not.toHaveBeenCalled();
	});

	test("creates team registration on successful payment", async () => {
		await seedDefaultTournamentPrice(75);

		const [user] = await createUsers(db, 1);
		const profiles = await createProfiles(db, [
			{ userId: user.id, gender: "male" },
			{ userId: user.id, gender: "male" },
		]);
		const profileIds = profiles.map((p) => p.id);

		const tournament = await bootstrapTournament(db, {
			date: "2025-06-01",
			startTime: "09:00",
			divisions: [{ division: "aa", gender: "male", teams: 0 }],
		});

		mockPostSale.mockResolvedValueOnce(createSuccessResponse());

		const result = await checkoutHandler(
			user.id,
			createCheckoutInput(
				[],
				[{ divisionId: tournament.divisions[0], profileIds }],
			),
		);

		expect(result.success).toBe(true);

		// Verify invoice was created
		const [invoice] = await db
			.select()
			.from(invoices)
			.where(eq(invoices.purchaserId, user.id));

		expect(invoice).toBeDefined();

		// Verify team was created and registered
		const registeredTeams = await db
			.select()
			.from(tournamentDivisionTeams)
			.where(eq(tournamentDivisionTeams.invoiceId, invoice.id));

		expect(registeredTeams).toHaveLength(1);
		expect(registeredTeams[0].tournamentDivisionId).toBe(
			tournament.divisions[0],
		);
		expect(registeredTeams[0].pricePaid).toBe(75);
		expect(registeredTeams[0].status).toBe("registered");

		// Verify team players were created
		const players = await db
			.select()
			.from(teamPlayers)
			.where(eq(teamPlayers.teamId, registeredTeams[0].teamId));

		expect(players).toHaveLength(2);
		expect(players.map((p) => p.playerProfileId).sort()).toEqual(
			profileIds.sort(),
		);
	});

	test("creates multiple team registrations", async () => {
		await seedDefaultTournamentPrice(50);

		const [user] = await createUsers(db, 1);
		const profiles = await createProfiles(db, [
			{ userId: user.id, gender: "male" },
			{ userId: user.id, gender: "male" },
			{ userId: user.id, gender: "female" },
			{ userId: user.id, gender: "female" },
		]);

		const tournament = await bootstrapTournament(db, {
			date: "2025-06-01",
			startTime: "09:00",
			divisions: [
				{ division: "aa", gender: "male", teams: 0 },
				{ division: "aa", gender: "female", teams: 0 },
			],
		});

		mockPostSale.mockResolvedValueOnce(createSuccessResponse());

		await checkoutHandler(
			user.id,
			createCheckoutInput(
				[],
				[
					{
						divisionId: tournament.divisions[0],
						profileIds: [profiles[0].id, profiles[1].id],
					},
					{
						divisionId: tournament.divisions[1],
						profileIds: [profiles[2].id, profiles[3].id],
					},
				],
			),
		);

		// Verify correct amount was charged
		expect(mockPostSale).toHaveBeenCalledWith(
			expect.objectContaining({
				amount: 100, // 2 teams * $50 each
				description: "CBVA Team Registration (2)",
			}),
		);

		// Verify both teams were registered
		const [invoice] = await db
			.select()
			.from(invoices)
			.where(eq(invoices.purchaserId, user.id));

		const registeredTeams = await db
			.select()
			.from(tournamentDivisionTeams)
			.where(eq(tournamentDivisionTeams.invoiceId, invoice.id));

		expect(registeredTeams).toHaveLength(2);
	});

	test("creates team registrations and memberships together", async () => {
		await seedDefaultTournamentPrice(60);

		const [user] = await createUsers(db, 1);
		const profiles = await createProfiles(db, [
			{ userId: user.id, gender: "male" },
			{ userId: user.id, gender: "male" },
		]);
		const profileIds = profiles.map((p) => p.id);

		const tournament = await bootstrapTournament(db, {
			date: "2025-06-01",
			startTime: "09:00",
			divisions: [{ division: "aa", gender: "male", teams: 0 }],
		});

		mockPostSale.mockResolvedValueOnce(createSuccessResponse());

		await checkoutHandler(
			user.id,
			createCheckoutInput(profileIds, [
				{ divisionId: tournament.divisions[0], profileIds },
			]),
		);

		// Verify correct amount was charged (2 memberships * $100 + 1 team * $60)
		expect(mockPostSale).toHaveBeenCalledWith(
			expect.objectContaining({
				amount: 260,
				description: "CBVA Membership (2), Team Registration (1)",
			}),
		);

		// Verify invoice was created
		const [invoice] = await db
			.select()
			.from(invoices)
			.where(eq(invoices.purchaserId, user.id));

		// Verify memberships were created
		const createdMemberships = await db
			.select()
			.from(memberships)
			.where(eq(memberships.invoiceId, invoice.id));

		expect(createdMemberships).toHaveLength(2);

		// Verify team was registered
		const registeredTeams = await db
			.select()
			.from(tournamentDivisionTeams)
			.where(eq(tournamentDivisionTeams.invoiceId, invoice.id));

		expect(registeredTeams).toHaveLength(1);
	});

	test("uses division-specific registration price", async () => {
		await seedDefaultTournamentPrice(50);

		const [user] = await createUsers(db, 1);
		const profiles = await createProfiles(db, [
			{ userId: user.id, gender: "male" },
			{ userId: user.id, gender: "male" },
		]);
		const profileIds = profiles.map((p) => p.id);

		const tournament = await bootstrapTournament(db, {
			date: "2025-06-01",
			startTime: "09:00",
			divisions: [{ division: "aa", gender: "male", teams: 0 }],
		});

		// Set a division-specific price
		const { tournamentDivisions } = await import("@/db/schema");
		await db
			.update(tournamentDivisions)
			.set({ registrationPrice: 80 })
			.where(eq(tournamentDivisions.id, tournament.divisions[0]));

		mockPostSale.mockResolvedValueOnce(createSuccessResponse());

		await checkoutHandler(
			user.id,
			createCheckoutInput(
				[],
				[{ divisionId: tournament.divisions[0], profileIds }],
			),
		);

		// Verify division-specific price was used instead of default
		expect(mockPostSale).toHaveBeenCalledWith(
			expect.objectContaining({
				amount: 80,
			}),
		);

		// Verify pricePaid was recorded correctly
		const [invoice] = await db
			.select()
			.from(invoices)
			.where(eq(invoices.purchaserId, user.id));

		const [registeredTeam] = await db
			.select()
			.from(tournamentDivisionTeams)
			.where(eq(tournamentDivisionTeams.invoiceId, invoice.id));

		expect(registeredTeam.pricePaid).toBe(80);
	});

	test("does not create team registrations on declined payment", async () => {
		await seedDefaultTournamentPrice(50);

		const [user] = await createUsers(db, 1);
		const profiles = await createProfiles(db, [
			{ userId: user.id, gender: "male" },
			{ userId: user.id, gender: "male" },
		]);
		const profileIds = profiles.map((p) => p.id);

		const tournament = await bootstrapTournament(db, {
			date: "2025-06-01",
			startTime: "09:00",
			divisions: [{ division: "aa", gender: "male", teams: 0 }],
		});

		mockPostSale.mockResolvedValueOnce(createDeclinedResponse());

		await expect(
			checkoutHandler(
				user.id,
				createCheckoutInput(
					[],
					[{ divisionId: tournament.divisions[0], profileIds }],
				),
			),
		).rejects.toThrow("Insufficient funds");

		// Verify no invoice was created
		const userInvoices = await db
			.select()
			.from(invoices)
			.where(eq(invoices.purchaserId, user.id));

		expect(userInvoices).toHaveLength(0);

		// Verify no teams were created with these profile ids
		const allTeamPlayers = await db
			.select()
			.from(teamPlayers)
			.where(inArray(teamPlayers.playerProfileId, profileIds));

		expect(allTeamPlayers).toHaveLength(0);
	});

	test("throws error when registering for invalid division", async () => {
		await seedDefaultTournamentPrice(50);

		const [user] = await createUsers(db, 1);
		const profiles = await createProfiles(db, [
			{ userId: user.id, gender: "male" },
			{ userId: user.id, gender: "male" },
		]);
		const profileIds = profiles.map((p) => p.id);

		mockPostSale.mockResolvedValueOnce(createSuccessResponse());

		await expect(
			checkoutHandler(
				user.id,
				createCheckoutInput(
					[],
					[{ divisionId: 999999, profileIds }],
				),
			),
		).rejects.toThrow("Division not found");

		expect(mockPostSale).not.toHaveBeenCalled();
	});

	test("throws error when player gender does not match division", async () => {
		await seedDefaultTournamentPrice(50);

		const [user] = await createUsers(db, 1);
		const profiles = await createProfiles(db, [
			{ userId: user.id, gender: "female" },
			{ userId: user.id, gender: "female" },
		]);
		const profileIds = profiles.map((p) => p.id);

		const tournament = await bootstrapTournament(db, {
			date: "2025-06-01",
			startTime: "09:00",
			divisions: [{ division: "aa", gender: "male", teams: 0 }],
		});

		mockPostSale.mockResolvedValueOnce(createSuccessResponse());

		await expect(
			checkoutHandler(
				user.id,
				createCheckoutInput(
					[],
					[{ divisionId: tournament.divisions[0], profileIds }],
				),
			),
		).rejects.toThrow("gender");

		expect(mockPostSale).not.toHaveBeenCalled();
	});

	test("throws error when player level does not qualify for division", async () => {
		await seedDefaultTournamentPrice(50);

		const [user] = await createUsers(db, 1);

		// Get the "aaa" level (highest) - player with this level can't play in lower divisions
		const aaaLevel = await db
			.select()
			.from(levels)
			.where(eq(levels.name, "aaa"))
			.then((rows) => rows[0]);

		const profiles = await createProfiles(db, [
			{ userId: user.id, gender: "male", levelId: aaaLevel.id },
			{ userId: user.id, gender: "male", levelId: aaaLevel.id },
		]);
		const profileIds = profiles.map((p) => p.id);

		// Create tournament with "b" division - lower than "aaa" player level
		const tournament = await bootstrapTournament(db, {
			date: "2025-06-01",
			startTime: "09:00",
			divisions: [{ division: "b", gender: "male", teams: 0 }],
		});

		mockPostSale.mockResolvedValueOnce(createSuccessResponse());

		await expect(
			checkoutHandler(
				user.id,
				createCheckoutInput(
					[],
					[{ divisionId: tournament.divisions[0], profileIds }],
				),
			),
		).rejects.toThrow("level");

		expect(mockPostSale).not.toHaveBeenCalled();
	});
});
