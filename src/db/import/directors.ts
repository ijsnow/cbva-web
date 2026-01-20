import { uniqBy } from "lodash-es";

import { db } from "../connection";
import { legacy } from "../legacy";
import { directors, tournamentDirectors, venues } from "../schema";
import { toKey } from "./tournaments";

export async function getDirectorsCache() {
	return (await db.select().from(directors)).reduce((memo, d) => {
		memo.set(d.externalRef as string, d.id);

		return memo;
	}, new Map<string, number>());
}

export async function importDirectors() {
	const legacyDirectors = await legacy.query.directorPreferences.findMany({
		with: {
			user: true,
		},
	});

	const profiles = (
		await db._query.playerProfiles.findMany({
			where: (t, { inArray }) =>
				inArray(
					t.externalRef,
					legacyDirectors.map(({ userId }) => userId),
				),
		})
	).reduce<{ [key: string]: number }>((memo, p) => {
		memo[p.externalRef] = p.id;

		return memo;
	}, {});

	const values = legacyDirectors.map((d) => ({
		profileId: profiles[d.userId] as number,
		email: d.email,
		phoneNumber: d.phoneNumber,
		externalRef: d.userId,
	}));

	await db
		.insert(directors)
		.values(values)
		.onConflictDoNothing()
		.returning({ id: venues.id, externalRef: venues.externalRef });
}

export async function importDirectorsForYear(
	year: number,
	map: Map<string, number>,
) {
	const tournaments = await legacy.query.tournaments.findMany({
		where: (t, { gte, lt, ne, and }) =>
			and(
				gte(t.startAt, new Date(`${year}-01-01`)),
				lt(t.startAt, new Date(`${year + 1}-01-01`)),
				ne(t.status, "Schedule"),
				ne(t.status, "Cancelled"),
			),
		with: {
			tournamentDirectors: {
				with: {
					directorPreferences: {
						with: {
							user: true,
						},
					},
				},
			},
		},
	});

	const directors = await getDirectorsCache();

	const toCreate: (typeof tournamentDirectors.$inferInsert)[] = uniqBy(
		tournaments,
		(t) => toKey(t.beachId, t.startAt),
	).flatMap(({ beachId, startAt, tournamentDirectors }) =>
		tournamentDirectors.map(
			({ rank, directorPreferences: { email, phone, userId } }) => {
				if (!directors.get(userId)) {
					throw new Error("hahsdf");
				}

				return {
					tournamentId: map.get(toKey(beachId, startAt)) as number,
					directorId: directors.get(userId) as number,
					order: rank || 0,
					email,
					phoneNumber: phone,
				};
			},
		),
	);

	await db.insert(tournamentDirectors).values(toCreate); // .onConflictDoNothing();
}
