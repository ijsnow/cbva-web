import { getLocalTimeZone, today } from "@internationalized/date";
import { describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { duplicateTournamentFn } from "./schedule";

describe("duplicateTournamentFn", () => {
	test("duplicates a tournament on a given date", async () => {
		const input = {
			date: "2025-01-01",
			startTime: "09:00:00",
			directors: [{ id: 0 }, { id: 2 }],
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

		const targetDate = today(getLocalTimeZone());

		const {
			data: { id: createdId },
		} = await duplicateTournamentFn({
			data: { id, date: targetDate.add({ days: 1 }).toString() },
		});

		const dbResult = await db.query.tournaments.findMany({
			with: {
				tournamentDivisions: true,
				venue: true,
				directors: true,
			},
			where: (t, { eq }) => eq(t.id, createdId),
		});

		expect(dbResult.length).toBe(1);
	});
});
