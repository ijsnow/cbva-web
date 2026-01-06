import { describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import { bootstrapTournament } from "@/tests/utils/tournaments";
import { editSeed } from "./edit-seed";

describe("editSeed", () => {
	test("move a team up in seeds", async () => {
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 5,
					pools: 1,
				},
			],
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		const teams = await db.query.tournamentDivisionTeams.findMany({
			where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
			orderBy: (t, { asc }) => asc(t.seed),
		});

		const first = teams[0];
		const second = teams[1];
		const third = teams[2];
		const fourth = teams[3];
		const fifth = teams[4];

		expect(teams.map(({ id, seed }) => [id, seed])).toStrictEqual([
			[first.id, 1],
			[second.id, 2],
			[third.id, 3],
			[fourth.id, 4],
			[fifth.id, 5],
		]);

		await editSeed({
			data: {
				id: fourth.id,
				seed: 2,
			},
		});

		const updatedTeams = await db.query.tournamentDivisionTeams.findMany({
			where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
			orderBy: (t, { asc }) => [asc(t.seed)],
		});

		expect(updatedTeams.map(({ id, seed }) => [id, seed])).toStrictEqual([
			[first.id, 1],
			[fourth.id, 2],
			[second.id, 3],
			[third.id, 4],
			[fifth.id, 5],
		]);
	});

	test("move a team down in seeds", async () => {
		const tournamentInfo = await bootstrapTournament(db, {
			date: "2025-01-01",
			startTime: "09:00:00",
			divisions: [
				{
					division: "b",
					gender: "male",
					teams: 5,
					pools: 1,
				},
			],
		});

		const tournamentDivisionId = tournamentInfo.divisions[0];

		const teams = await db.query.tournamentDivisionTeams.findMany({
			where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
			orderBy: (t, { asc }) => [asc(t.seed)],
		});

		const first = teams[0];
		const second = teams[1];
		const third = teams[2];
		const fourth = teams[3];
		const fifth = teams[4];

		await editSeed({
			data: {
				id: second.id,
				seed: 4,
			},
		});

		const updatedTeams = await db.query.tournamentDivisionTeams.findMany({
			where: (t, { eq }) => eq(t.tournamentDivisionId, tournamentDivisionId),
			orderBy: (t, { asc }) => [asc(t.seed)],
		});

		expect(updatedTeams.map(({ id, seed }) => [id, seed])).toStrictEqual([
			[first.id, 1],
			[third.id, 2],
			[fourth.id, 3],
			[second.id, 4],
			[fifth.id, 5],
		]);
	});
});
