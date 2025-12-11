import { today } from "@internationalized/date";
import { assert, describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { createDirectors } from "@/tests/utils/users";
import { createVenues } from "@/tests/utils/venues";
import { duplicateScheduleFn, duplicateTournamentFn } from "./schedule";

describe("duplicateTournamentFn", () => {
	test("duplicates a tournament on a given date", async () => {
		const [venue] = await createVenues(db, 1);

		const directors = await createDirectors(db, 2);
		const input = {
			date: "2025-01-01",
			startTime: "09:00:00",
			venue: venue.id,
			directors: directors.map(({ id }, i) => ({ id, order: i })),
			divisions: [
				{
					division: "b",
					gender: "male" as const,
					teams: 30,
					pools: 6,
				},
				{
					division: "b",
					gender: "female" as const,
					teams: 30,
					pools: 6,
				},
				{
					division: "aa",
					gender: "male" as const,
					teams: 30,
					pools: 6,
				},
				{
					division: "aa",
					gender: "female" as const,
					teams: 30,
					pools: 6,
				},
			],
			poolMatches: false as const,
			simulatePoolMatches: false as const,
		};

		const { id } = await bootstrapTournament(db, input);

		const targetDate = today(getDefaultTimeZone()).add({ days: 1 }).toString();

		await duplicateTournamentFn({
			data: { id, date: targetDate },
		});

		const dbResult = await db.query.tournaments.findMany({
			with: {
				tournamentDivisions: true,
				venue: true,
				directors: true,
			},
			where: (t, { eq, and }) =>
				and(eq(t.venueId, venue.id), eq(t.date, targetDate)),
		});

		expect(dbResult.length).toBe(1);

		const copiedTournament = dbResult[0];

		// Assert tournament fields are copied correctly
		expect(copiedTournament.name).toBeNull(); // name is null in bootstrapTournament
		expect(copiedTournament.date).toBe(targetDate);
		expect(copiedTournament.startTime).toBe(input.startTime);
		expect(copiedTournament.venueId).toBe(venue.id);
		expect(copiedTournament.visible).toBe(false); // copies are hidden by default
		expect(copiedTournament.externalRef).toBeNull(); // should not copy external ref

		// Assert tournament divisions are copied correctly
		expect(copiedTournament.tournamentDivisions).toHaveLength(4);
		const expectedDivisions = input.divisions.map((div) => ({
			divisionId: expect.any(Number), // we don't know the exact IDs
			gender: div.gender,
			name: null, // defaults to null in bootstrapTournament
			teamSize: 2, // defaults to 2
		}));

		for (const expectedDiv of expectedDivisions) {
			expect(copiedTournament.tournamentDivisions).toContainEqual(
				expect.objectContaining(expectedDiv),
			);
		}

		// Assert tournament directors are copied correctly
		expect(copiedTournament.directors).toHaveLength(2);
		expect(copiedTournament.directors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					directorId: directors[0].id,
					order: 0,
				}),
				expect.objectContaining({
					directorId: directors[1].id,
					order: 1,
				}),
			]),
		);
	});
});

describe("duplicateScheduleFn", () => {
	test("copies the schedule from a year", async () => {
		const [venue1, venue2] = await createVenues(db, 2);

		const directors1 = await createDirectors(db, 2);
		const directors2 = await createDirectors(db, 2);
		const inputs = [
			{
				date: "2025-01-01",
				startTime: "09:00:00",
				venue: venue1.id,
				directors: directors1.map(({ id }, i) => ({ id, order: i })),
				divisions: [
					{
						division: "b",
						gender: "male" as const,
						teams: 30,
						pools: 6,
					},
					{
						division: "b",
						gender: "female" as const,
						teams: 30,
						pools: 6,
					},
					{
						division: "aa",
						gender: "male" as const,
						teams: 30,
						pools: 6,
					},
					{
						division: "aa",
						gender: "female" as const,
						teams: 30,
						pools: 6,
					},
				],
				poolMatches: false as const,
				simulatePoolMatches: false as const,
			},
			{
				date: "2025-01-01",
				startTime: "09:00:00",
				venue: venue2.id,
				directors: directors2.map(({ id }, i) => ({ id, order: i })),
				divisions: [
					{
						division: "aa",
						gender: "female" as const,
						teams: 25,
						pools: 4,
					},
				],
				poolMatches: true as const,
				simulatePoolMatches: true as const,
			},
		];

		for (const input of inputs) {
			await bootstrapTournament(db, input);
		}

		await duplicateScheduleFn({
			data: { startDate: "2025-01-01", endDate: "2025-12-31", addDays: 364 },
		});

		const dbResult = await db.query.tournaments.findMany({
			with: {
				tournamentDivisions: true,
				venue: true,
				directors: true,
			},
			where: (t, { and, inArray, eq }) =>
				and(
					inArray(t.venueId, [venue1.id, venue2.id]),
					eq(t.date, "2025-12-31"),
				),
		});

		expect(dbResult.length).toBe(2);
		assert(dbResult.every(({ visible }) => !visible));

		// Sort results by venue ID for consistent testing
		const sortedResults = dbResult.sort((a, b) => a.venueId - b.venueId);
		const [venue1Tournament, venue2Tournament] = sortedResults;
		const [input1, input2] = inputs;

		// Assert first tournament (venue1) was copied correctly
		expect(venue1Tournament.name).toBeNull(); // name is null in bootstrapTournament
		expect(venue1Tournament.date).toBe("2025-12-31");
		expect(venue1Tournament.startTime).toBe(input1.startTime);
		expect(venue1Tournament.venueId).toBe(venue1.id);
		expect(venue1Tournament.visible).toBe(false);
		expect(venue1Tournament.externalRef).toBeNull();

		// Assert tournament divisions for venue1
		expect(venue1Tournament.tournamentDivisions).toHaveLength(4);

		const expectedDivisions1 = input1.divisions.map((div) => ({
			divisionId: expect.any(Number),
			gender: div.gender,
			name: null,
			teamSize: 2,
		}));

		for (const expectedDiv of expectedDivisions1) {
			expect(venue1Tournament.tournamentDivisions).toContainEqual(
				expect.objectContaining(expectedDiv),
			);
		}

		// Assert tournament directors for venue1
		expect(venue1Tournament.directors).toHaveLength(2);

		// Assert second tournament (venue2) was copied correctly
		expect(venue2Tournament.name).toBeNull(); // name is null in bootstrapTournament
		expect(venue2Tournament.date).toBe("2025-12-31");
		expect(venue2Tournament.startTime).toBe(input2.startTime);
		expect(venue2Tournament.venueId).toBe(venue2.id);
		expect(venue2Tournament.visible).toBe(false);
		expect(venue2Tournament.externalRef).toBeNull();

		// Assert tournament divisions for venue2
		expect(venue2Tournament.tournamentDivisions).toHaveLength(1);

		const expectedDivisions2 = input2.divisions.map((div) => ({
			divisionId: expect.any(Number),
			gender: div.gender,
			name: null,
			teamSize: 2,
		}));

		for (const expectedDiv of expectedDivisions2) {
			expect(venue2Tournament.tournamentDivisions).toContainEqual(
				expect.objectContaining(expectedDiv),
			);
		}

		// Assert tournament directors for venue2
		expect(venue2Tournament.directors).toHaveLength(2);
	});
});
