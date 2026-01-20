import { assert, describe, expect, test } from "vitest";
import { db } from "@/db/connection";
import {
	createDirectors,
	createProfiles,
	createTeams,
	createUsers,
} from "./users";

describe("createTeams", () => {
	test("can create random teams with levels", async () => {
		const created = await createTeams(db, {
			count: 10,
			levels: ["b", "aa"],
			gender: "female",
		});

		const teams = await db._query.teams.findMany({
			with: {
				players: {
					with: {
						profile: {
							with: {
								level: true,
							},
						},
					},
				},
			},
			where: (t, { inArray }) =>
				inArray(
					t.id,
					created.map(({ id }) => id),
				),
		});

		expect(teams).toHaveLength(10);

		const players = teams.flatMap(({ players }) => players);

		expect(players).toHaveLength(20);

		expect(
			players.every(
				({ profile }) =>
					profile.gender === "female" &&
					["b", "aa"].includes(profile.level?.name ?? "failed"),
			),
		).toBeTruthy();
	});

	test("can create teams with specific players", async () => {
		const [profile1] = await createProfiles(db, 1);
		const [profile2] = await createProfiles(db, [
			{
				gender: "female",
			},
		]);

		const created = await createTeams(db, [
			{
				players: [profile1, profile2],
			},
		]);

		const teams = await db._query.teams.findMany({
			with: {
				players: {
					with: {
						profile: true,
					},
				},
			},
			where: (t, { inArray }) =>
				inArray(
					t.id,
					created.map(({ id }) => id),
				),
		});

		expect(teams).toHaveLength(1);

		const players = teams.flatMap(({ players }) => players);

		expect(players).toHaveLength(2);

		expect(players.map(({ profile }) => profile.id)).toContain(profile1.id);
		expect(players.map(({ profile }) => profile.id)).toContain(profile2.id);

		expect(
			players.find(({ profile }) => profile.id === profile2.id)?.profile.gender,
		).toBe("female");
	});
});

describe("createDirectors", () => {
	test("can create random directors", async () => {
		const created = await createDirectors(db, 4);

		const directors = await db._query.directors.findMany({
			with: {
				profile: {
					with: {
						user: true,
					},
				},
			},
			where: (t, { inArray }) =>
				inArray(
					t.id,
					created.map(({ id }) => id),
				),
		});

		expect(directors).toHaveLength(4);
		expect(directors.map(({ profile }) => profile?.user)).not.toBeNull();

		assert(
			directors.every(({ profile }) => profile?.user?.role === "td"),
			"each user has director role",
		);
	});
});
