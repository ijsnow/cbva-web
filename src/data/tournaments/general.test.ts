import { pick } from "lodash-es";
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
  				division: "b",
  				gender: "male",
  				teams: 30,
  				pools: 6,
  			},
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
				{
					division: "aa",
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

		const aDivs = divs.filter(({ tournamentId }) => tournamentId === aId);
		const bDivs = divs.filter(({ tournamentId }) => tournamentId === bId);

		expect(aDivs).toHaveLength(2);
		expect(bDivs).toHaveLength(2);
		expect(aDivs.find(({ division }) => division.name === "a")).toBeDefined();
		expect(aDivs.find(({ division }) => division.name === "b")).toBeDefined();
		expect(bDivs.find(({ division }) => division.name === "b")).toBeDefined();
		expect(bDivs.find(({ division }) => division.name === "aa")).toBeDefined();

		const bTournament = bDivs[0].tournament;

		await editTournamentFn({
			data: {
				id: bId,
				venueId: aVenue.id,
				name: bTournament.name,
				date: bTournament.date,
				startTime: bTournament.startTime,
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
		expect(updated[0].tournamentDivisions).toHaveLength(3);

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

		expect(
			pick(
				updated[0].tournamentDivisions.find(
					({ division }) => division.name === "aa",
				),
				["gender"],
			),
		).toStrictEqual({
			gender: "male",
		});
	});
});
