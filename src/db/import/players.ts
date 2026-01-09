import { eq, inArray, not } from "drizzle-orm"
import { chunk } from "lodash-es"
import { db } from "../connection"
import { legacy } from "../legacy"
import { teamPlayers, users } from "../legacy/schema/tables"
import { type PlayerProfile, playerProfiles } from "../schema"
import { mapDivision } from "./shared"

export async function importPlayers(levels: Map<string, number>) {
  const existing = await db.query.playerProfiles.findMany({
    columns: {
      externalRef: true,
    },
  })

  // TODO: only get directors
  const usersWithDirectorPreferences =
    await legacy.query.directorPreferences.findMany({
      with: {
        user: true,
      },
      where: (t, { inArray, not }) =>
        not(
          inArray(
            t.userId,
            existing.map(({ externalRef }) => externalRef)
          )
        ),
    })

  const usersWithTeams = await legacy
    .select()
    .from(users)
    .where(
      not(
        inArray(
          users.id,
          existing.map(({ externalRef }) => externalRef)
        )
      )
    )
    .innerJoin(teamPlayers, eq(users.id, teamPlayers.target))

  const playersToCreate: (typeof playerProfiles.$inferInsert)[] = usersWithTeams
    .map(({ User }) => User)
    .concat(usersWithDirectorPreferences.map(({ user }) => user))
    .map((user) => ({
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
    }))

  for (const batch of chunk(playersToCreate, 5000)) {
    console.log(`player_profiles: inserting batch of size ${batch.length}`)

    await db.insert(playerProfiles).values(batch).onConflictDoNothing()
  }
}
