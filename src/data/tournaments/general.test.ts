import { omit, pick } from "lodash-es";
import { describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { editTournamentFn } from "./general";

describe("Edit general info", () => {
	test("merges divisions when changing venue", async () => {
		const [aVenue, bVenue] = await db.query.venues.findMany({
			limit: 2,
		});

		const { id: aId } = await bootstrapTournament(db, {
			venue: aVenue.id,
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "a",
					gender: "female",
					teams: 30,
					pools: 6,
				},
			],
		});

		const { id: bId } = await bootstrapTournament(db, {
			venue: bVenue.id,
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 30,
					pools: 6,
				},
			],
		});

		const divs = await db.query.tournamentDivisions.findMany({
			with: {
				division: true,
				tournament: true,
			},
			where: (t, { inArray }) => inArray(t.tournamentId, [aId, bId]),
		});

		const a = divs.find(({ id }) => id === aId);
		const b = divs.find(({ id }) => id === bId);

		expect(a?.division.name).toBe("a");
		expect(b?.division.name).toBe("b");

		await editTournamentFn({
			data: {
				id: bId,
				venueId: aVenue.id,
				name: b!.tournament.name,
				date: b!.tournament.date,
				startTime: b!.tournament.startTime,
				mergeDivisions: true,
			},
		});

		const updated = await db.query.tournaments.findMany({
			columns: {
				id: true,
			},
			with: {
				tournamentDivisions: {
					with: {
						division: true,
					},
				},
			},
			where: (t, { inArray }) => inArray(t.id, [aId, bId]),
		});

		expect(updated).toHaveLength(1);
		expect(updated[0].tournamentDivisions).toHaveLength(2);

		expect(
			pick(
				updated[0].tournamentDivisions.find(
					({ division }) => division.name === "a",
				),
				["gender"],
			),
		).toStrictEqual({
			gender: "female",
		});

		expect(
			pick(
				updated[0].tournamentDivisions.find(
					({ division }) => division.name === "b",
				),
				["gender"],
			),
		).toStrictEqual({
			gender: "male",
		});
	});
});
