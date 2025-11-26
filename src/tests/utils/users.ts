import { fakerEN as faker } from "@faker-js/faker";
import { inArray } from "drizzle-orm";
import { chunk, range } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { assert } from "vitest";
import {
	type CreateDirector,
	type CreatePlayerProfile,
	type CreateTeam,
	type CreateTeamPlayer,
	type CreateUser,
	type Database,
	directors,
	levels,
	type PlayerProfile,
	playerProfiles,
	teamPlayers,
	teams,
	type User,
	users,
} from "@/db/schema";
import type { Gender } from "@/db/schema/shared";

function createUserValues(
	overrides: Partial<User> = {},
): CreateUser & { id: string } {
	const id = uuidv4();

	return {
		id,
		name: faker.person.fullName(),
		email: `user-${id}@test.com`,
		phoneNumber: `+1${Math.floor(Math.random() * 1000000000)}`,
		...overrides,
	};
}

export async function createUsers(
	db: Database,
	config: number | Partial<User>[],
) {
	const values = Array.isArray(config)
		? config.map(createUserValues)
		: range(0, config).map(() => createUserValues());

	return await db.insert(users).values(values).returning({
		id: users.id,
	});
}

function createProfileValues(
	overrides: Partial<PlayerProfile> = {},
): CreatePlayerProfile {
	return {
		firstName: faker.person.firstName(),
		lastName: faker.person.lastName(),
		birthdate: faker.date.past().toISOString().split("T")[0],
		gender: faker.helpers.arrayElement(["male", "female"]),
		...overrides,
	};
}

export async function createProfiles(
	db: Database,
	config: number | Partial<PlayerProfile>[],
) {
	const values = Array.isArray(config)
		? config.map(createProfileValues)
		: range(0, config).map(() => createProfileValues());

	return await db.insert(playerProfiles).values(values).returning({
		id: playerProfiles.id,
	});
}

export async function createDirectors(
	db: Database,
	config: number | CreateDirector[],
) {
	const values = Array.isArray(config) ? config : [];

	if (!Array.isArray(config)) {
		const users = await createUsers(
			db,
			range(0, config).map(() => ({
				role: "td",
			})),
		);

		const profiles = await createProfiles(
			db,
			users.map(({ id }) => ({ userId: id })),
		);

		values.push(
			...profiles.map(({ id }) => ({
				profileId: id,
			})),
		);
	}

	return await db.insert(directors).values(values).returning({
		id: directors.id,
	});
}

function createTeamValues(overrides: Partial<CreateTeam> = {}): CreateTeam {
	return {
		name: faker.company.name(),
		...overrides,
	};
}

export async function createTeams(
	db: Database,
	config:
		| { count: number; levels: string[]; gender: Gender }
		| (CreateTeam & { players: Pick<PlayerProfile, "id">[] })[],
	teamSize = 2,
) {
	const values = Array.isArray(config)
		? config.map((team) => createTeamValues({ name: team.name }))
		: range(0, config.count).map(() => createTeamValues());

	const createdTeams = await db.insert(teams).values(values).returning({
		id: teams.id,
	});

	const teamPlayerValues = Array.isArray(config)
		? config.flatMap(({ players }) =>
				players.map(({ id }) => ({ profileId: id })),
			)
		: [];

	if (!Array.isArray(config)) {
		const availableLevels = await db
			.select()
			.from(levels)
			.where(inArray(levels.name, config.levels));

		const profiles = await createProfiles(
			db,
			range(0, config.count * 2).map(() =>
				createProfileValues({
					gender: config.gender,
					levelId: faker.helpers.arrayElement(
						availableLevels.map(({ id }) => id),
					),
				}),
			),
		);

		teamPlayerValues.push(
			...profiles.map(({ id }) => ({
				profileId: id,
			})),
		);
	}

	assert(
		createdTeams.length * teamSize === teamPlayerValues.length,
		"Number of teams of given size and number of players do not match",
	);

	await db.insert(teamPlayers).values(
		chunk(teamPlayerValues, teamSize).flatMap((players, i) =>
			players.flatMap(({ profileId }) => ({
				teamId: createdTeams[i].id,
				playerProfileId: profileId,
			})),
		),
	);

	return createdTeams;
}
