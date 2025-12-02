import { describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import { tournamentDivisionTeams } from "@/db/schema";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { createProfiles, createTeams } from "@/tests/utils/users";
import { createVenues } from "@/tests/utils/venues";
import { getProfileResultsHandler } from "./profiles";

describe("getProfileResults", () => {
	test("can filter results", async () => {
		const [
			{ id: profileId },
			{ id: teammateAId },
			{ id: teammateBId },
			{ id: teammateCId },
		] = await createProfiles(db, [
			{ gender: "male" as const },
			{ gender: "male" as const },
			{ gender: "male" as const },
			{ gender: "male" as const },
		]);

		const [{ id: teamAId }, { id: teamBId }, { id: teamCId }] =
			await createTeams(db, [
				{
					players: [{ id: profileId }, { id: teammateAId }],
				},
				{
					players: [{ id: profileId }, { id: teammateBId }],
				},
				{
					players: [{ id: profileId }, { id: teammateCId }],
				},
			]);

		const [{ id: venueAId }, { id: venueBId }, { id: venueCId }] =
			await createVenues(db, 3);

		const aTournament = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			venue: venueAId,
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 30,
					pools: 6,
				},
			],
			poolMatches: true,
			simulatePoolMatches: false,
		});

		await db.insert(tournamentDivisionTeams).values({
			tournamentDivisionId: aTournament.divisions[0],
			teamId: teamAId,
			status: "confirmed",
		});

		const bTournament = await bootstrapTournament(db, {
			date: "2025-01-02",
			startTime: "09:00:00",
			venue: venueBId,
			divisions: [
				{
					division: "a",
					gender: "male",
					teams: 30,
					pools: 6,
				},
			],
			poolMatches: true,
			simulatePoolMatches: false,
		});

		await db.insert(tournamentDivisionTeams).values({
			tournamentDivisionId: bTournament.divisions[0],
			teamId: teamBId,
			status: "confirmed",
		});

		const cTournament = await bootstrapTournament(db, {
			date: "2025-01-02",
			startTime: "09:00:00",
			venue: venueCId,
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 30,
					pools: 6,
				},
			],
			poolMatches: true,
			simulatePoolMatches: false,
		});

		await db.insert(tournamentDivisionTeams).values({
			tournamentDivisionId: cTournament.divisions[0],
			teamId: teamCId,
			status: "confirmed",
		});

		// Test without filters - should return all 3 results
		const allResults = await getProfileResultsHandler({
			data: {
				id: profileId,
				venues: [],
				divisions: [],
				paging: {
					page: 1,
					size: 10,
				},
			},
		});

		expect(allResults.data).toHaveLength(3);
		expect(allResults.pageInfo.totalItems).toBe(3);
		expect(allResults.pageInfo.totalPages).toBe(1);

		// Get venue and division IDs from the results
		const bDivisionId = allResults.data.find(
			(r) => r.division === "B",
		)?.divisionId;
		const aDivisionId = allResults.data.find(
			(r) => r.division === "A",
		)?.divisionId;

		expect(bDivisionId).toBeDefined();
		expect(aDivisionId).toBeDefined();

		// Test filtering by B division only - should return 2 results (teamA and teamC)
		const bDivisionResults = await getProfileResultsHandler({
			data: {
				id: profileId,
				venues: [],
				divisions: [bDivisionId!],
				paging: {
					page: 1,
					size: 10,
				},
			},
		});

		expect(bDivisionResults.data).toHaveLength(2);
		expect(bDivisionResults.pageInfo.totalItems).toBe(2);
		expect(bDivisionResults.data.every((r) => r.division === "B")).toBe(true);

		// Test filtering by A division only - should return 1 result (teamB)
		const aDivisionResults = await getProfileResultsHandler({
			data: {
				id: profileId,
				venues: [],
				divisions: [aDivisionId!],
				paging: {
					page: 1,
					size: 10,
				},
			},
		});

		expect(aDivisionResults.data).toHaveLength(1);
		expect(aDivisionResults.pageInfo.totalItems).toBe(1);
		expect(aDivisionResults.data[0].division).toBe("A");

		// Test filtering by venue - all tournaments use same venue, should return all 3
		const venueResults = await getProfileResultsHandler({
			data: {
				id: profileId,
				venues: [venueAId],
				divisions: [],
				paging: {
					page: 1,
					size: 10,
				},
			},
		});

		expect(venueResults.data).toHaveLength(1);
		expect(venueResults.pageInfo.totalItems).toBe(1);

		// Test filtering by both venue and division
		const combinedResults = await getProfileResultsHandler({
			data: {
				id: profileId,
				venues: [venueAId, venueCId],
				divisions: [bDivisionId!],
				paging: {
					page: 1,
					size: 10,
				},
			},
		});

		expect(combinedResults.data).toHaveLength(2);
		expect(combinedResults.pageInfo.totalItems).toBe(2);
		expect(combinedResults.data.every((r) => r.division === "B")).toBe(true);
	});
});
