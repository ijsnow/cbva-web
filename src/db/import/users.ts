import { sql } from "drizzle-orm"
import { chunk, groupBy, sortBy } from "lodash-es"
import { v4 as uuidv4 } from "uuid"
import { db, schema } from "../connection"
import { legacy } from "../legacy"
import type { PlayerProfile } from "../schema"
import { mapDivision } from "./shared"

export async function importUsers(levels: Map<string, number>) {
  // const hasMore = true;
  // const offset = 0;

  const existingUsers = await db._query.users.findMany({
    columns: {
      id: true,
      phoneNumber: true,
    },
  })

  const existing = existingUsers.map(({ id }) => id)
  const existingPhones = new Set(
    existingUsers.map(({ phoneNumber }) => phoneNumber)
  )

  // while (hasMore) {
  const legacyUsers = await legacy.query.users.findMany({
    with: {
      phoneVerifications: true,
    },
    // where: (t, { and, not, inArray }) =>
    // 	and(
    // 		not(inArray(t.id, existing)),
    // 		not(inArray(t.username, ["kempervball", "cjpkxwysetztmzq"])),
    // 	),
    // limit: 5000,
    // offset,
  })

  const userProfileGroups = groupBy(legacyUsers, "email")

  const info: {
    user: typeof schema.users.$inferInsert
    account: typeof schema.accounts.$inferInsert
    profiles: (typeof schema.playerProfiles.$inferInsert)[]
  }[] = Object.keys(userProfileGroups).map((email) => {
    const profiles = sortBy(userProfileGroups[email], "created")

    const [accountUser] = profiles

    return {
      user: {
        id: accountUser.id,
        name: accountUser.legalName,
        email:
          accountUser.email === "" ? `empty:${uuidv4()}` : accountUser.email,
        emailVerified: true,
        phoneNumber:
          accountUser.phone === "" ? `empty:${uuidv4()}` : accountUser.phone,
        phoneNumberVerified: accountUser.phoneVerifications.some(
          ({ phone }) => phone === accountUser.phone
        ),
        role: "user",
        createdAt: new Date(accountUser.created.toString()),
      },
      account: {
        id: uuidv4(),
        userId: accountUser.id,
        accountId: accountUser.id,
        providerId: "credential",
        createdAt: new Date(accountUser.created.toString()),
        updatedAt: new Date(),
      },
      profiles: profiles.map((user) => ({
        userId: accountUser.id,
        firstName: user.firstName,
        preferredName:
          user.username === "sinjinjr" ? "Sinjin Jr." : user.firstName,
        lastName: user.lastName,
        birthdate: user.birthdate.toString(),
        gender: user.gender.toLowerCase() as PlayerProfile["gender"],
        levelId: levels.get(mapDivision(user.rating)),
        ratedPoints: user.ratedPoints,
        juniorsPoints: user.juniorsPoints,
        rank: user.rank,
        externalRef: user.id,
      })),
    }
  })

  const usersToCreate: (typeof schema.users.$inferInsert)[] = info.map(
    ({ user }) => user
  )

  const duplicatePhones = groupBy(usersToCreate, "phoneNumber")

  const accountsToCreate: (typeof schema.accounts.$inferInsert)[] = info.map(
    ({ account }) => account
  )

  const profilesToCreate: (typeof schema.playerProfiles.$inferInsert)[] =
    info.flatMap(({ profiles }) => profiles)

  // await db.transaction(async (txn) => {
  // 	await txn.insert(schema.users).values(
  // 		usersToCreate.map((user) => ({
  // 			...user,
  // 			phone:
  // 				duplicatePhones[user.phone]?.length > 1 ||
  // 				existingPhones.has(user.phone)
  // 					? uuidv4()
  // 					: user.phone,
  // 			phoneVerified:
  // 				duplicatePhones[user.phone]?.length > 1 ||
  // 				existingPhones.has(user.phone)
  // 					? false
  // 					: user.phoneVerified,
  // 		})),
  // 	);
  // 	await txn.insert(schema.accounts).values(accountsToCreate);
  // 	await txn.insert(schema.playerProfiles).values(profilesToCreate);
  // });

  for (const batch of chunk(usersToCreate, 1000)) {
    console.log(`users: inserting batch of size ${batch.length}`)

    await db.insert(schema.users).values(
      batch.map((user) => ({
        ...user,
        phoneNumber:
          duplicatePhones[user.phoneNumber]?.length > 1 ||
          existingPhones.has(user.phoneNumber)
            ? uuidv4()
            : user.phoneNumber,
        phoneNumberVerified:
          duplicatePhones[user.phoneNumber]?.length > 1 ||
          existingPhones.has(user.phoneNumber)
            ? false
            : user.phoneNumberVerified,
      }))
    )
  }

  for (const batch of chunk(accountsToCreate, 1000)) {
    console.log(`accounts: inserting batch of size ${batch.length}`)

    await db.insert(schema.accounts).values(batch)
  }

  for (const batch of chunk(profilesToCreate, 1000)) {
    console.log(`profiles: inserting batch of size ${batch.length}`)

    await db.insert(schema.playerProfiles).values(batch)
  }

  // for (const { phone } of usersToCreate) {
  // 	existingPhones.add(phone);
  // }

  // const usersToCreate: (typeof schema.users.$inferInsert)[] = legacyUsers.map(
  // 	(user) => ({
  // 		id: user.id,
  // 		name: user.legalName,
  // 		email: user.email,
  // 		emailVerified: true,
  // 		phone: user.phone,
  // 		phoneVerified: user.phoneVerifications.some(
  // 			({ phone }) => phone === user.phone,
  // 		),
  // 		role: "user",
  // 	}),
  // );

  // const accountsToCreate: (typeof schema.accounts.$inferInsert)[] =
  // 	legacyUsers.map((user) => ({
  // 		id: uuidv4(),
  // 		userId: user.id,
  // 		accountId: user.id,
  // 		providerId: "credential",
  // 		createdAt: new Date(user.created.toString()),
  // 		updatedAt: new Date(),
  // 	}));

  // existing.push(...legacyUsers.map(({ id }) => id));
  // }
}
