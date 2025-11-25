import { getLocalTimeZone, today } from "@internationalized/date";
import { assert, describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { createDirectors } from "@/tests/utils/users";
import { createVenues } from "@/tests/utils/venues";
import { copyScheduleFn, duplicateTournamentFn } from "./schedule";

describe("duplicateTournamentFn", () => {
	test("duplicates a tournament on a given date", async () => {
		const [venue] = await createVenues(db, 1);

		const input = {
			date: "2025-01-01",
			startTime: "09:00:00",
			venue: venue.id,
			directors: await createDirectors(db, 2),
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

		const targetDate = today(getLocalTimeZone()).add({ days: 1 }).toString();

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

		// TODO: check equality for input
	});
});

describe("copyScheduleFn", () => {
	test("copies the schedule from a year", async () => {
		const [venue1, venue2] = await createVenues(db, 2);

		const inputs = [
			{
				date: "2025-01-01",
				startTime: "09:00:00",
				venue: venue1.id,
				directors: await createDirectors(db, 2),
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
				directors: await createDirectors(db, 2),
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

		await copyScheduleFn({
			data: { sourceYear: 2025, days: 364 },
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

		// todo: assert equality
	});
});
