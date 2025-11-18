import { type Database, divisions, levels } from "../schema";

export async function seedDivisions(db: Database) {
	await db
		.insert(divisions)
		.values(
			[
				{ name: "unrated", maxAge: null },
				{ name: "b", maxAge: null },
				{ name: "a", maxAge: null },
				{ name: "aa", maxAge: null },
				{ name: "aaa", maxAge: null },
				{ name: "open", maxAge: null },
				{ name: "12u", maxAge: 12 },
				{ name: "14u", maxAge: 14 },
				{ name: "16u", maxAge: 16 },
				{ name: "18u", maxAge: 18 },
			].map(({ name, maxAge }, idx) => ({
				name,
				order: idx,
				maxAge,
			})),
		)
		.onConflictDoNothing();

	return (
		await db
			.select({
				id: divisions.id,
				name: divisions.name,
			})
			.from(divisions)
	).reduce((memo, div) => {
		memo.set(div.name, div.id);

		return memo;
	}, new Map<string, number>());
}

export async function seedLevels(db: Database) {
	await db
		.insert(levels)
		.values(
			[
				{ name: "unrated", abbreviated: "U" },
				{ name: "b" },
				{ name: "a" },
				{ name: "aa" },
				{ name: "aaa" },
			].map(({ name, abbreviated }, idx) => ({
				name,
				order: idx,
				abbreviated,
			})),
		)
		.onConflictDoNothing();

	return (
		await db
			.select({
				id: levels.id,
				name: levels.name,
			})
			.from(levels)
	).reduce((memo, lev) => {
		memo.set(lev.name, lev.id);

		return memo;
	}, new Map<string, number>());
}
